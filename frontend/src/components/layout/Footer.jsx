import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-5 w-5 text-[#0B192C]" />
              <span className="font-extrabold text-[#0B192C]">ISLA Proof</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              ISLA Proof creates a cryptographic record of project evidence and anchors its
              integrity to Stellar. It verifies the integrity of attested evidence packages — it
              does not assert the truthfulness of underlying statements.
            </p>
          </div>
          <div className="text-sm text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700 mb-2">Network</div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Stellar Testnet only
            </div>
            <div>No private keys in client code</div>
            <div>Sensitive documents kept off-chain</div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-400">
          <span>DEMO / SYNTHETIC DATA — for demonstration purposes only.</span>
          <span>© 2026 ISLA Proof. Public projects. Verifiable records.</span>
        </div>
      </div>
    </footer>
  );
}
