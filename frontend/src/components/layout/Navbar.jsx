import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, ScrollText, FolderCog, Menu, X, Inbox } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const PUBLIC_LINKS = [
  { label: "Projects", to: "/projects", type: "route" },
  { label: "How It Works", to: "/#how-it-works", type: "anchor" },
  { label: "Features", to: "/#features", type: "anchor" },
  { label: "For LGUs", to: "/#for-lgus", type: "anchor" },
  { label: "FAQ", to: "/#faq", type: "anchor" },
  { label: "Contact", to: "/#contact", type: "anchor" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const isAdmin = user && user.role === "LGU Administrator";
  const doLogout = () => {
    logout();
    nav("/");
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" data-testid="nav-logo" className="flex items-center gap-2.5">
            <img src="/tala-icon.png" alt="TALA" className="h-9 w-9 rounded-lg" />
            <div className="leading-tight">
              <div className="font-extrabold tracking-tight text-[#0B192C] text-lg">TALA</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
                Verifiable Public Projects
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-7">
            {!user &&
              PUBLIC_LINKS.map((l) =>
                l.type === "route" ? (
                  <Link key={l.label} to={l.to} data-testid={`nav-${l.label.replace(/\s+/g, "-").toLowerCase()}`} className="text-sm font-semibold text-slate-500 hover:text-[#0B192C] transition-colors">
                    {l.label}
                  </Link>
                ) : (
                  <a key={l.label} href={l.to} data-testid={`nav-${l.label.replace(/\s+/g, "-").toLowerCase()}`} className="text-sm font-semibold text-slate-500 hover:text-[#0B192C] transition-colors">
                    {l.label}
                  </a>
                )
              )}
            {user && (
              <>
                <Link to="/projects" className="text-sm font-semibold text-slate-500 hover:text-[#0B192C]">Projects</Link>
                <Link to="/dashboard" data-testid="nav-dashboard" className="text-sm font-semibold text-slate-500 hover:text-[#0B192C]">Dashboard</Link>
                {isAdmin && (
                  <Link to="/manage" data-testid="nav-manage" className="text-sm font-semibold text-slate-500 hover:text-[#0B192C]">Packages</Link>
                )}
                {isAdmin && (
                  <Link to="/pilot-inbox" data-testid="nav-pilot-inbox" className="text-sm font-semibold text-slate-500 hover:text-[#0B192C]">Pilot Inbox</Link>
                )}
                <Link to="/audit" data-testid="nav-audit" className="text-sm font-semibold text-slate-500 hover:text-[#0B192C]">Audit Trail</Link>
              </>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right leading-tight">
                  <div className="text-sm font-bold text-[#0B192C]">{user.name}</div>
                  <div className="text-[11px] text-slate-500">{user.role}</div>
                </div>
                <Button data-testid="logout-button" variant="outline" size="sm" onClick={doLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <a href="/#pilot" data-testid="nav-pilot-cta" className="inline-flex items-center bg-emerald-500 hover:bg-emerald-400 text-[#0B192C] font-bold text-sm px-4 py-2 rounded-lg transition-colors">
                  Join the LGU Pilot
                </a>
                <Button data-testid="staff-login-button" variant="outline" size="sm" onClick={() => nav("/login")}>
                  Staff Login
                </Button>
              </>
            )}
          </div>

          <button data-testid="mobile-menu-toggle" className="lg:hidden text-[#0B192C]" onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {!user &&
            PUBLIC_LINKS.map((l) => (
              <a key={l.label} href={l.type === "route" ? l.to : l.to} onClick={() => setOpen(false)} className="block py-2 text-sm font-semibold text-slate-700">
                {l.label}
              </a>
            ))}
          {user && (
            <>
              <Link to="/projects" onClick={() => setOpen(false)} className="block py-2 text-sm font-semibold text-slate-700">Projects</Link>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-700"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
              {isAdmin && (
                <Link to="/manage" onClick={() => setOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-700"><FolderCog className="h-4 w-4" /> Packages</Link>
              )}
              {isAdmin && (
                <Link to="/pilot-inbox" onClick={() => setOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-700"><Inbox className="h-4 w-4" /> Pilot Inbox</Link>
              )}
              <Link to="/audit" onClick={() => setOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-700"><ScrollText className="h-4 w-4" /> Audit Trail</Link>
            </>
          )}
          {user ? (
            <button onClick={doLogout} className="flex items-center gap-2 py-2 text-sm font-semibold text-red-600"><LogOut className="h-4 w-4" /> Logout</button>
          ) : (
            <div className="flex gap-2 pt-2">
              <a href="/#pilot" onClick={() => setOpen(false)} className="flex-1 text-center bg-emerald-500 text-[#0B192C] font-bold text-sm px-4 py-2 rounded-lg">Join the LGU Pilot</a>
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); nav("/login"); }}>Staff Login</Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
