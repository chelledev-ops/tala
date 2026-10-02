import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Activity,
} from "lucide-react";
import api from "@/lib/api";
import { peso, formatDateTime } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/stats").then((r) => setStats(r.data));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0B192C]">Transparency Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome, {user?.name} · <span className="font-semibold">{user?.role}</span>
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-widest bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-slate-500 w-fit">
          Demo / Synthetic Data
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric testId="dash-total-projects" icon={Building2} label="Total Projects" value={stats?.total_projects ?? "—"} />
        <Metric testId="dash-total-value" icon={TrendingUp} label="Total Project Value" value={stats ? peso(stats.total_value) : "—"} />
        <Metric testId="dash-in-progress" icon={Clock} label="In Progress" value={stats?.in_progress ?? "—"} tone="blue" />
        <Metric testId="dash-completed" icon={CheckCircle2} label="Completed" value={stats?.completed ?? "—"} tone="emerald" />
        <Metric testId="dash-verified" icon={ShieldCheck} label="Verified Stellar Proofs" value={stats?.verified_proofs ?? "—"} tone="emerald" />
        <Metric testId="dash-review" icon={AlertTriangle} label="Requiring Review" value={stats?.requiring_review ?? "—"} tone="amber" />
        <Metric testId="dash-lgus" icon={Building2} label="Participating LGUs" value={stats?.lgu_count ?? "—"} />
        <Link to="/manage" className="rounded-xl border border-dashed border-slate-300 bg-white p-5 flex items-center justify-center text-sm font-semibold text-slate-500 hover:text-[#0B192C] hover:border-slate-400 transition-colors">
          Manage Evidence Packages →
        </Link>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-400" />
          <h2 className="font-bold text-[#0B192C]">Recent Project Activity</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {(stats?.recent_activity || []).map((a) => (
            <div key={a.id} data-testid={`activity-${a.id}`} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-slate-700 shrink-0">
                  {a.action}
                </span>
                <span className="text-sm text-slate-500 truncate">{a.role} · {a.actor}</span>
              </div>
              <span className="text-xs text-slate-400 shrink-0">{formatDateTime(a.timestamp)}</span>
            </div>
          ))}
          {(!stats?.recent_activity || stats.recent_activity.length === 0) && (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">No recent activity.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone, testId }) {
  const toneCls =
    tone === "emerald"
      ? "text-emerald-600"
      : tone === "blue"
        ? "text-blue-600"
        : tone === "amber"
          ? "text-amber-600"
          : "text-slate-400";
  return (
    <div data-testid={testId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <Icon className={`h-4 w-4 ${toneCls}`} />
      </div>
      <div className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B192C]">{value}</div>
    </div>
  );
}
