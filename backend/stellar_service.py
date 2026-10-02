"""Stellar Testnet anchoring service.

Keeps the secret key strictly on the backend. Anchors a SHA-256 evidence
commitment to Stellar Testnet using a manage_data operation plus a hash memo,
and reads the anchored transaction back for public verification.
"""
import os

from stellar_sdk import Keypair, Network, Server, TransactionBuilder

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
