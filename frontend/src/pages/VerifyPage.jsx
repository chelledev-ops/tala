import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  AlertTriangle,
  Hourglass,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatDateTime, shortHash } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { HashBlock } from "@/components/HashBlock";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { VerifyQR } from "@/components/VerifyQR";

export default function VerifyPage() {
  const { projectId, packageId } = useParams();
  if (!projectId || !packageId) return <VerifyDirectory />;
  return <VerifyResult projectId={projectId} packageId={packageId} />;
}

function VerifyDirectory() {
  const [packages, setPackages] = useState([]);
  useEffect(() => {
    api.get("/packages").then((r) => setPackages(r.data));
  }, []);
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-[#0B192C] items-center justify-center mb-4">
          <ShieldCheck className="h-7 w-7 text-emerald-400" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B192C]">
          Verify an Evidence Package
        </h1>
        <p className="text-slate-500 mt-2 max-w-xl mx-auto">
          Select a published package to independently check its SHA-256 commitment against the
          record anchored on Stellar Testnet. No account required.
        </p>
      </div>
      <div className="space-y-3">
        {packages.map((pkg) => (
          <Link
            key={pkg.id}
            to={`/verify/${pkg.project_id}/${pkg.id}`}
            data-testid={`verify-dir-${pkg.package_code}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-[#0B192C]">{pkg.package_code}</span>
                <StatusBadge status={pkg.status} />
              </div>
              <div className="text-sm text-slate-500 mt-0.5">{pkg.project_name}</div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}

const BANNER = {
  VERIFIED: {
    wrap: "bg-emerald-50 border-emerald-500",
    icon: ShieldCheck,
    iconCls: "text-emerald-600",
    title: "VERIFIED",
    titleCls: "text-emerald-700",
    msg: "The current evidence package hash matches the commitment recorded on Stellar Testnet.",
  },
  TAMPERED: {
    wrap: "bg-red-50 border-red-500",
    icon: AlertTriangle,
    iconCls: "text-red-600",
    title: "TAMPERED / MISMATCH",
    titleCls: "text-red-700",
    msg: "The current evidence package does not match the Stellar commitment.",
  },
  NOT_ATTESTED: {
    wrap: "bg-amber-50 border-amber-500",
    icon: Hourglass,
    iconCls: "text-amber-600",
    title: "NOT ATTESTED",
    titleCls: "text-amber-700",
    msg: "No Stellar attestation has been recorded for this evidence package.",
  },
};

function VerifyResult({ projectId, packageId }) {
  const { user } = useAuth();
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/verify/${projectId}/${packageId}`)
      .then((r) => setRes(r.data))
      .catch(() => setRes(null))
      .finally(() => setLoading(false));
  }, [projectId, packageId]);

  useEffect(() => {
    load();
  }, [load]);

  const isAdmin = user && user.role === "LGU Administrator";

  const runDemo = async (action) => {
    setBusy(true);
    try {
      await api.post(`/demo/${action}/${packageId}`);
      toast.success(action === "tamper" ? "Evidence modified — re-verifying…" : "Evidence restored — re-verifying…");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-20 text-slate-400">Verifying…</div>;
  if (!res) return <div className="max-w-4xl mx-auto px-4 py-20 text-slate-400">Package not found.</div>;

  const cfg = BANNER[res.result];
  const Icon = cfg.icon;
  const matches = res.result === "VERIFIED";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link to={`/project/${projectId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#0B192C] mb-5">
        <ArrowLeft className="h-4 w-4" /> Back to project
      </Link>

      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Evidence Package Verification
      </div>

      {/* Banner */}
      <div data-testid="verify-result-banner" data-result={res.result} className={`rounded-2xl border-2 p-6 sm:p-8 flex items-start gap-5 ${cfg.wrap}`}>
        <Icon className={`h-12 w-12 sm:h-14 sm:w-14 shrink-0 ${cfg.iconCls}`} />
        <div>
          <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${cfg.titleCls}`}>
            {cfg.title}
          </h1>
          <p className="mt-2 text-slate-700 leading-relaxed max-w-xl">{cfg.msg}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Project</div>
          <div className="font-bold text-[#0B192C] mt-1">{res.project_name}</div>
          <div className="text-sm text-slate-500 inline-flex items-center gap-1.5 mt-0.5">
            <Landmark className="h-3.5 w-3.5" /> {res.lgu_name}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Package</div>
          <div className="font-mono font-bold text-[#0B192C] mt-1">{res.package_code}</div>
          <div className="text-sm text-slate-500 mt-0.5">{res.document_count} document(s) committed</div>
        </div>
      </div>

      {/* Hash comparison */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 mt-4 space-y-4">
        <h3 className="font-bold text-[#0B192C]">SHA-256 Comparison</h3>
        <HashBlock
          label="Current evidence package hash (recomputed now)"
          value={res.current_sha256}
          testId="verify-current-hash"
          tone={matches ? "emerald" : res.result === "TAMPERED" ? "red" : "slate"}
        />
        <HashBlock
          label="Stellar commitment (anchored on-chain)"
          value={res.stellar_commitment}
          testId="verify-onchain-hash"
          tone={matches ? "emerald" : "slate"}
        />
        {res.stellar_tx && (
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <HashBlock label="Stellar transaction hash" value={res.stellar_tx} testId="verify-tx-hash" />
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-slate-500">
                Ledger: <span className="font-mono text-[#0B192C]">{res.stellar_ledger ?? "—"}</span>
              </span>
              <span className="text-slate-500">Attested: {formatDateTime(res.attested_at)}</span>
              {res.explorer_url && (
                <a href={res.explorer_url} target="_blank" rel="noreferrer" data-testid="stellar-explorer-link" className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline">
                  View on Stellar Explorer <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <Button data-testid="reverify-button" variant="outline" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Re-verify
        </Button>
        {res.stellar_tx && (
          <VerifyQR projectId={projectId} packageId={packageId} packageCode={res.package_code} projectName={res.project_name} />
        )}
      </div>

      {/* Admin demo controls */}
      {isAdmin && res.stellar_tx && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 mt-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Demo controls (LGU Administrator)
          </div>
          <p className="text-sm text-slate-500 mb-3">
            Demonstrate the integrity check: modify one evidence metadata field to trigger a
            mismatch, then restore it to pass again. The on-chain commitment never changes.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button data-testid="demo-tamper-button" disabled={busy} variant="outline" className="text-red-700 border-red-300" onClick={() => runDemo("tamper")}>
              Modify evidence (tamper)
            </Button>
            <Button data-testid="demo-restore-button" disabled={busy} variant="outline" className="text-emerald-700 border-emerald-300" onClick={() => runDemo("restore")}>
              Restore original
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-6 leading-relaxed">
        TALA verifies the integrity of the specific evidence package that was attested. It
        does not assert the truthfulness of the underlying statements, nor does it provide legal
        compliance. DEMO / SYNTHETIC data.
      </p>
    </div>
  );
}
