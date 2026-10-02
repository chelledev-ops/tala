import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO = [
  { role: "LGU Administrator", email: "admin@isla.gov.ph", password: "Admin@123" },
  { role: "LGU Reviewer", email: "reviewer@isla.gov.ph", password: "Review@123" },
  { role: "Auditor", email: "auditor@isla.gov.ph", password: "Audit@123" },
];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      nav("/dashboard");
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === "string" ? d : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const quick = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-[#0B192C] isla-grid text-white p-12">
        <div className="flex items-center gap-2.5">
          <img src="/tala-icon.png" alt="TALA" className="h-9 w-9 rounded-lg" />
          <span className="font-extrabold text-lg">TALA</span>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Public projects.
            <br />
            <span className="text-emerald-400">Verifiable records.</span>
          </h1>
          <p className="text-slate-300 mt-4 max-w-sm">
            Staff portal for LGU Administrators, Reviewers, and Auditors. Citizens do not need an
            account to browse or verify public records.
          </p>
        </div>
        <div className="text-xs text-slate-400">DEMO / SYNTHETIC environment · Stellar Testnet</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-[#0B192C]">Staff sign in</h2>
          <p className="text-slate-500 mt-1 mb-6">Sign in to manage projects and records.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" data-testid="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11" placeholder="you@isla.gov.ph" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" data-testid="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-11" placeholder="••••••••" />
            </div>
            {error && <div data-testid="login-error" className="text-sm text-red-600 font-medium">{error}</div>}
            <Button data-testid="login-submit" type="submit" disabled={busy} className="w-full h-11 bg-[#0B192C] hover:bg-[#1E293B]">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Demo accounts — click to fill
            </div>
            <div className="space-y-2">
              {DEMO.map((acc) => (
                <button
                  key={acc.email}
                  data-testid={`demo-fill-${acc.role.replace(/\s+/g, "-").toLowerCase()}`}
                  onClick={() => quick(acc)}
                  className="w-full text-left rounded-lg border border-slate-200 bg-white px-4 py-2.5 hover:border-slate-300 transition-colors"
                >
                  <div className="text-sm font-semibold text-[#0B192C]">{acc.role}</div>
                  <div className="text-xs text-slate-500 font-mono">{acc.email} · {acc.password}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
