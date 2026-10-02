import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, ShieldCheck, Building2, Landmark, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import { peso } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

const HERO_IMG =
  "https://images.unsplash.com/photo-1625119264099-17f9757291bc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxwaGlsaXBwaW5lcyUyMGJyaWRnZSUyMGNvbnN0cnVjdGlvbiUyMGhpZ2h3YXl8ZW58MHx8fHwxNzkwOTMwMzk5fDA&ixlib=rb-4.1.0&q=85";

export default function PublicPortal() {
  const [stats, setStats] = useState(null);
  const [lgus, setLgus] = useState([]);
  const [projects, setProjects] = useState([]);
  const [q, setQ] = useState("");
  const [lgu, setLgu] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    api.get("/dashboard/stats").then((r) => setStats(r.data));
    api.get("/lgus").then((r) => setLgus(r.data));
  }, []);

  useEffect(() => {
    const params = {};
    if (q) params.q = q;
    if (lgu !== "all") params.lgu_id = lgu;
    if (status !== "all") params.status = status;
    const t = setTimeout(() => {
      api.get("/projects", { params }).then((r) => setProjects(r.data));
    }, 250);
    return () => clearTimeout(t);
  }, [q, lgu, status]);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-[#0B192C] overflow-hidden">
        <div className="absolute inset-0 isla-grid opacity-40" />
        <div
          className="absolute right-0 top-0 h-full w-1/2 hidden lg:block opacity-25"
          style={{
            backgroundImage: `url(${HERO_IMG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "linear-gradient(to left, black, transparent)",
            WebkitMaskImage: "linear-gradient(to left, black, transparent)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-3xl isla-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Anchored to Stellar Testnet
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
              Public projects.
              <br />
              <span className="text-emerald-400">Verifiable records.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-xl">
              ISLA Proof creates a cryptographic record of project evidence and anchors its
              integrity to Stellar. Anyone can independently verify that published records have not
              been altered — no account required.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#projects"
                data-testid="browse-projects-cta"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#0B192C] font-bold px-5 py-3 rounded-lg transition-colors"
              >
                Browse Projects <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/verify"
                data-testid="verify-record-cta"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold px-5 py-3 rounded-lg transition-colors"
              >
                <ShieldCheck className="h-4 w-4" /> Verify a Record
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile testId="stat-total-projects" icon={Building2} label="Public Projects" value={stats?.total_projects ?? "—"} />
          <StatTile testId="stat-total-value" icon={TrendingUp} label="Total Project Value" value={stats ? peso(stats.total_value) : "—"} />
          <StatTile testId="stat-verified" icon={ShieldCheck} label="Verified Stellar Proofs" value={stats?.verified_proofs ?? "—"} accent />
          <StatTile testId="stat-lgus" icon={Landmark} label="Participating LGUs" value={stats?.lgu_count ?? "—"} />
        </div>
      </section>

      {/* Filters + project grid */}
      <section id="projects" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B192C]">
              Public Infrastructure Projects
            </h2>
            <p className="text-slate-500 mt-1">Search and filter transparent LGU project records.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-8">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              data-testid="project-search-input"
              placeholder="Search by project, code, LGU, or contractor…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <div className="sm:col-span-3">
            <Select value={lgu} onValueChange={setLgu}>
              <SelectTrigger data-testid="lgu-filter" className="h-11">
                <SelectValue placeholder="All LGUs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All LGUs</SelectItem>
                {lgus.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="status-filter" className="h-11">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Procurement">Procurement</SelectItem>
                <SelectItem value="Review Required">Review Required</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 text-slate-400" data-testid="no-projects">
            No projects match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, accent, testId }) {
  return (
    <div
      data-testid={testId}
      className={`rounded-xl border p-5 shadow-sm ${
        accent ? "bg-[#0B192C] border-[#0B192C]" : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${accent ? "text-emerald-300" : "text-slate-500"}`}>
          {label}
        </span>
        <Icon className={`h-4 w-4 ${accent ? "text-emerald-400" : "text-slate-400"}`} />
      </div>
      <div className={`mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight ${accent ? "text-white" : "text-[#0B192C]"}`}>
        {value}
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  return (
    <Link
      to={`/project/${project.id}`}
      data-testid={`project-card-${project.id}`}
      className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-slate-400">{project.project_code}</span>
        <StatusBadge status={project.status} />
      </div>
      <h3 className="font-bold text-lg text-[#0B192C] leading-snug group-hover:text-emerald-700 transition-colors">
        {project.name}
      </h3>
      <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1.5">
        <Landmark className="h-3.5 w-3.5" /> {project.lgu_name}
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-xs text-slate-400">Project value</div>
          <div className="font-extrabold text-[#0B192C]">{peso(project.value)}</div>
        </div>
        {project.attested_count > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            {project.attested_count} anchored
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Progress</span>
          <span className="font-semibold">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-1.5" />
      </div>
    </Link>
  );
}
