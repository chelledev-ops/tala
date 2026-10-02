import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { shortHash, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { VerifyQR } from "@/components/VerifyQR";
import { Button } from "@/components/ui/button";

export default function ManagePackages() {
  const [packages, setPackages] = useState([]);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    api.get("/packages").then((r) => setPackages(r.data));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const attest = async (pkg) => {
    setBusy(pkg.id);
    toast.info(`Anchoring ${pkg.package_code} to Stellar Testnet…`);
    try {
      await api.post(`/packages/${pkg.id}/attest`);
      toast.success(`${pkg.package_code} attested.`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Attestation failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#0B192C] mb-1">Evidence Packages</h1>
      <p className="text-slate-500 mb-6">Generate SHA-256 commitments and anchor them to Stellar Testnet.</p>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Package</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Project</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">SHA-256</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Stellar</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packages.map((pkg) => (
                <tr key={pkg.id} data-testid={`manage-pkg-${pkg.package_code}`}>
                  <td className="px-4 py-3 font-mono font-semibold text-[#0B192C]">{pkg.package_code}</td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell max-w-xs truncate">{pkg.project_name}</td>
                  <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs text-slate-500">{shortHash(pkg.sha256)}</td>
                  <td className="px-4 py-3"><StatusBadge status={pkg.status} /></td>
                  <td className="px-4 py-3">
                    {pkg.stellar_tx ? (
                      <a href={pkg.explorer_url} target="_blank" rel="noreferrer" className="font-mono text-xs text-emerald-700 hover:underline inline-flex items-center gap-1">
                        {shortHash(pkg.stellar_tx)} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Link to={`/verify/${pkg.project_id}/${pkg.id}`}>
                        <Button size="sm" variant="outline" className="text-xs"><ShieldCheck className="h-3.5 w-3.5" /> Verify</Button>
                      </Link>
                      {pkg.stellar_tx && (
                        <VerifyQR projectId={pkg.project_id} packageId={pkg.id} packageCode={pkg.package_code} projectName={pkg.project_name} />
                      )}
                      {!pkg.stellar_tx && (
                        <Button data-testid={`manage-attest-${pkg.package_code}`} size="sm" disabled={busy === pkg.id} className="text-xs bg-emerald-600 hover:bg-emerald-500" onClick={() => attest(pkg)}>
                          Attest
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-4">
        Generate new packages from any project page. Attestation submits a real transaction to
        Stellar Testnet — the private key is held only on the backend.
      </p>
    </div>
  );
}
