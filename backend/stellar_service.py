"""Stellar Testnet anchoring service.

Keeps the secret key strictly on the backend. Two ways to anchor a SHA-256
evidence commitment:

- Soroban contract (when TALA_CONTRACT_ID is set): calls `attest` on the TALA
  attestation contract (contracts/tala-attestation), which stores the
  commitment under the package ID, write-once. Verification reads it back with
  the contract's `get`.
- Transaction memo (fallback): a manage_data operation plus a hash memo,
  read back from Horizon for verification.
"""
import os
import time

from stellar_sdk import Keypair, Network, Server, SorobanServer, TransactionBuilder, scval
from stellar_sdk.soroban_rpc import GetTransactionStatus, SendTransactionStatus
from stellar_sdk.xdr import SCVal

HORIZON_URL = os.environ["STELLAR_HORIZON_URL"]
NETWORK_PASSPHRASE = os.environ["STELLAR_NETWORK_PASSPHRASE"]
PUBLIC_KEY = os.environ["STELLAR_PUBLIC_KEY"]
SECRET_KEY = os.environ["STELLAR_SECRET_KEY"]

# Hard guard: this service is Testnet-only.
if not HORIZON_URL.startswith("https://horizon-testnet."):
    raise RuntimeError("ISLA Proof is Testnet-only; refusing non-testnet Horizon URL")
if NETWORK_PASSPHRASE != Network.TESTNET_NETWORK_PASSPHRASE:
    raise RuntimeError("Unexpected Stellar network passphrase; expected Testnet")

_keypair = Keypair.from_secret(SECRET_KEY)
if _keypair.public_key != PUBLIC_KEY:
    raise RuntimeError("STELLAR_PUBLIC_KEY does not match STELLAR_SECRET_KEY")

DATA_KEY = "isla_evidence_sha256"
EXPLORER_BASE = "https://stellar.expert/explorer/testnet/tx"
CONTRACT_EXPLORER_BASE = "https://stellar.expert/explorer/testnet/contract"

SOROBAN_RPC_URL = os.environ.get("SOROBAN_RPC_URL", "https://soroban-testnet.stellar.org")
CONTRACT_ID = os.environ.get("TALA_CONTRACT_ID", "").strip()
if SOROBAN_RPC_URL and "testnet" not in SOROBAN_RPC_URL:
    raise RuntimeError("TALA is Testnet-only; refusing non-testnet Soroban RPC URL")


def contract_enabled() -> bool:
    return bool(CONTRACT_ID)


def _server() -> Server:
    return Server(horizon_url=HORIZON_URL)


def anchor_commitment(evidence_hash: str) -> dict:
    """Submit a transaction anchoring the given 64-char hex SHA-256 digest.

    Returns transaction metadata. Raises on submission failure.
    """
    digest = evidence_hash.lower()
    raw = bytes.fromhex(digest)  # 32 bytes

    server = _server()
    source = server.load_account(PUBLIC_KEY)
    tx = (
        TransactionBuilder(
            source_account=source,
            network_passphrase=NETWORK_PASSPHRASE,
            base_fee=100,
        )
        .append_manage_data_op(DATA_KEY, raw)
        .add_hash_memo(raw)
        .set_timeout(180)
        .build()
    )
    tx.sign(_keypair)
    resp = server.submit_transaction(tx)

    return {
        "tx_hash": resp["hash"],
        "ledger": resp.get("ledger"),
        "source_public_key": PUBLIC_KEY,
        "network": "testnet",
        "horizon_url": f"{HORIZON_URL}/transactions/{resp['hash']}",
        "explorer_url": f"{EXPLORER_BASE}/{resp['hash']}",
    }


def fetch_onchain_commitment(tx_hash: str) -> dict:
    """Read back the anchored transaction and return the on-chain SHA-256 hex.

    Reads the hash memo (authoritative transaction-level commitment).
    """
    server = _server()
    tx = server.transactions().transaction(tx_hash).call()

    onchain_hash = None
    memo_type = tx.get("memo_type")
    if memo_type == "hash" and tx.get("memo"):
        import base64

        onchain_hash = base64.b64decode(tx["memo"]).hex()

    return {
        "tx_hash": tx_hash,
        "successful": bool(tx.get("successful")),
        "ledger": tx.get("ledger"),
        "created_at": tx.get("created_at"),
        "memo_type": memo_type,
        "onchain_sha256": onchain_hash,
        "horizon_url": f"{HORIZON_URL}/transactions/{tx_hash}",
        "explorer_url": f"{EXPLORER_BASE}/{tx_hash}",
    }


# ---------- Soroban attestation contract ----------

def _contract_tx(server: SorobanServer, function: str, parameters: list[SCVal]):
    source = server.load_account(PUBLIC_KEY)
    return (
        TransactionBuilder(source_account=source, network_passphrase=NETWORK_PASSPHRASE, base_fee=100)
        .append_invoke_contract_function_op(contract_id=CONTRACT_ID, function_name=function, parameters=parameters)
        .set_timeout(180)
        .build()
    )


def attest_on_contract(package_id: str, project_id: str, evidence_hash: str, wait_seconds: int = 60) -> dict:
    """Record the commitment in the TALA attestation contract and wait for the ledger.

    Raises if the contract rejects it (e.g. the package was already attested)
    or the transaction doesn't succeed within `wait_seconds`.
    """
    raw = bytes.fromhex(evidence_hash.lower())
    server = SorobanServer(SOROBAN_RPC_URL)
    tx = _contract_tx(server, "attest", [
        scval.to_address(PUBLIC_KEY),
        scval.to_string(package_id),
        scval.to_string(project_id),
        scval.to_bytes(raw),
    ])
    tx = server.prepare_transaction(tx)  # simulates; fails here if the contract would reject it
    tx.sign(_keypair)
    sent = server.send_transaction(tx)
    if sent.status == SendTransactionStatus.ERROR:
        raise RuntimeError(f"Soroban RPC rejected the transaction: {sent.error_result_xdr}")

    deadline = time.monotonic() + wait_seconds
    while True:
        result = server.get_transaction(sent.hash)
        if result.status != GetTransactionStatus.NOT_FOUND:
            break
        if time.monotonic() > deadline:
            raise TimeoutError(f"Transaction {sent.hash} not confirmed within {wait_seconds}s")
        time.sleep(2)
    if result.status != GetTransactionStatus.SUCCESS:
        raise RuntimeError(f"Contract call failed: {result.status}")

    return {
        "tx_hash": sent.hash,
        "ledger": result.ledger,
        "source_public_key": PUBLIC_KEY,
        "network": "testnet",
        "method": "soroban",
        "contract_id": CONTRACT_ID,
        "contract_url": f"{CONTRACT_EXPLORER_BASE}/{CONTRACT_ID}",
        "horizon_url": f"{HORIZON_URL}/transactions/{sent.hash}",
        "explorer_url": f"{EXPLORER_BASE}/{sent.hash}",
    }


def read_contract_attestation(package_id: str) -> dict | None:
    """Read a package's attestation from the contract (a read-only simulation, no fee)."""
    server = SorobanServer(SOROBAN_RPC_URL)
    sim = server.simulate_transaction(_contract_tx(server, "get", [scval.to_string(package_id)]))
    if sim.error:
        raise RuntimeError(f"Contract read failed: {sim.error}")
    found = scval.to_native(SCVal.from_xdr(sim.results[0].xdr))
    if found is None:
        return None
    return {
        "method": "soroban",
        "contract_id": CONTRACT_ID,
        "contract_url": f"{CONTRACT_EXPLORER_BASE}/{CONTRACT_ID}",
        "onchain_sha256": found["commitment"].hex(),
        "project_id": found["project_id"],
        "attester": found["attester"].address,
        "ledger": found["ledger"],
        "timestamp": found["timestamp"],
    }
