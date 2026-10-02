import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-[#0B192C] text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-3 gap-10">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/tala-icon.png" alt="TALA" className="h-9 w-9 rounded-lg" />
              <div>
                <div className="font-extrabold text-lg">TALA</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
                  Verifiable Public Projects
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              TALA helps LGUs publish project milestones and create independently verifiable records
              of public project evidence. Integrity anchored to Stellar.
            </p>
          </div>

          <div className="text-sm">
            <div className="font-semibold text-white mb-3">Explore</div>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/projects" className="hover:text-emerald-400">Projects</Link></li>
              <li><a href="/#how-it-works" className="hover:text-emerald-400">How It Works</a></li>
              <li><a href="/#features" className="hover:text-emerald-400">Features</a></li>
              <li><a href="/#faq" className="hover:text-emerald-400">FAQ</a></li>
              <li><a href="/#pilot" className="hover:text-emerald-400">Join the LGU Pilot</a></li>
            </ul>
          </div>

          <div className="text-sm">
            <div className="font-semibold text-white mb-3">Integrity layer</div>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Stellar Testnet only</li>
              <li>No private keys in client code</li>
              <li>Sensitive documents kept off-chain</li>
              <li>No crypto wallet required</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-500">
          <span>Powered by ISLA Camp Center, Inc. · DEMO / SYNTHETIC DATA</span>
          <span>© 2026 TALA. Public projects. Verifiable records.</span>
        </div>
      </div>
    </footer>
  );
}
