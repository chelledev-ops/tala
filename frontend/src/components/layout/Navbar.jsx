import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, LogOut, LayoutDashboard, ScrollText, FolderCog, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const isAdmin = user && user.role === "LGU Administrator";
  const linkCls = (path) =>
    `text-sm font-semibold transition-colors ${
      loc.pathname === path ? "text-[#0B192C]" : "text-slate-500 hover:text-[#0B192C]"
    }`;

  const doLogout = () => {
    logout();
    nav("/");
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" data-testid="nav-logo" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[#0B192C] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="leading-tight">
              <div className="font-extrabold tracking-tight text-[#0B192C] text-lg">ISLA Proof</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                Verifiable Public Records
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            <Link to="/" data-testid="nav-projects" className={linkCls("/")}>
              Projects
            </Link>
            <Link to="/verify" data-testid="nav-verify" className={linkCls("/verify")}>
              Verify
            </Link>
            {user && (
              <>
                <Link to="/dashboard" data-testid="nav-dashboard" className={linkCls("/dashboard")}>
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link to="/manage" data-testid="nav-manage" className={linkCls("/manage")}>
                    Packages
                  </Link>
                )}
                <Link to="/audit" data-testid="nav-audit" className={linkCls("/audit")}>
                  Audit Trail
                </Link>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Stellar Testnet
            </div>
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right leading-tight">
                  <div className="text-sm font-bold text-[#0B192C]">{user.name}</div>
                  <div className="text-[11px] text-slate-500">{user.role}</div>
                </div>
                <Button
                  data-testid="logout-button"
                  variant="outline"
                  size="sm"
                  onClick={doLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                data-testid="staff-login-button"
                onClick={() => nav("/login")}
                className="bg-[#0B192C] hover:bg-[#1E293B]"
              >
                Staff Login
              </Button>
            )}
          </div>

          <button
            data-testid="mobile-menu-toggle"
            className="md:hidden text-[#0B192C]"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-700">
            Projects
          </Link>
          <Link to="/verify" onClick={() => setOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-700">
            <ShieldCheck className="h-4 w-4" /> Verify
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-700">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              {isAdmin && (
                <Link to="/manage" onClick={() => setOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-700">
                  <FolderCog className="h-4 w-4" /> Packages
                </Link>
              )}
              <Link to="/audit" onClick={() => setOpen(false)} className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-700">
                <ScrollText className="h-4 w-4" /> Audit Trail
              </Link>
              <button onClick={doLogout} className="flex items-center gap-2 py-2 text-sm font-semibold text-red-600">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <Button onClick={() => { setOpen(false); nav("/login"); }} className="w-full bg-[#0B192C]">
              Staff Login
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}
