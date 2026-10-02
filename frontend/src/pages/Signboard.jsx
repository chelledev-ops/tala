import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { Printer, ArrowLeft, MapPin, Building, Calendar, Wallet } from "lucide-react";
import api from "@/lib/api";
import { peso, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default function Signboard() {
  const { projectId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/projects/${projectId}`).then((r) => setData(r.data));
  }, [projectId]);

  if (!data) return <div className="max-w-3xl mx-auto px-4 py-20 text-slate-400">Loading signboard…</div>;

  const { project, milestones, packages } = data;
  const attested = packages.find((p) => p.stellar_tx);
  const currentMilestone =
    milestones.find((m) => m.status === "In Progress") ||
    [...milestones].reverse().find((m) => m.status === "Completed") ||
    milestones[0];
  const verifyUrl = attested
    ? `${window.location.origin}/verify/${project.id}/${attested.id}`
    : `${window.location.origin}/project/${project.id}`;

  return (
    <div className="bg-slate-100 min-h-screen py-8 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 print:px-0 no-print mb-5 flex items-center justify-between">
        <Link to={`/project/${project.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#0B192C]">
          <ArrowLeft className="h-4 w-4" /> Back to project
        </Link>
        <Button data-testid="signboard-print-button" onClick={() => window.print()} className="bg-[#0B192C] hover:bg-[#1E293B]">
          <Printer className="h-4 w-4" /> Print signboard
        </Button>
      </div>

      {/* Signboard sheet */}
      <div
        data-testid="signboard-sheet"
        className="max-w-4xl mx-auto bg-white border border-slate-300 print:border-0 shadow-lg print:shadow-none overflow-hidden"
        style={{ aspectRatio: "auto" }}
      >
        {/* Header band */}
        <div className="bg-[#0B192C] text-white px-8 py-6 flex items-center justify-between isla-grid">
          <div className="flex items-center gap-3">
            <img src="/tala-icon.png" alt="TALA" className="h-12 w-12 rounded-lg" />
            <div>
              <div className="text-2xl font-extrabold tracking-tight">TALA</div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-300 font-semibold">
                Verifiable Public Projects
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded inline-block">
              Demo / Synthetic Data
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            {project.lgu_name}
          </div>
          <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B192C] leading-tight">
            {project.name}
          </h1>
          <p className="mt-3 text-slate-600 leading-relaxed">{project.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <Info icon={Wallet} label="Project Cost" value={peso(project.value, 2)} />
            <Info icon={Building} label="Contractor" value={project.contractor} />
            <Info icon={Calendar} label="Start Date" value={formatDate(project.start_date)} />
            <Info icon={Calendar} label="Target Completion" value={formatDate(project.target_completion)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 mt-8 items-center">
            <div className="sm:col-span-3 space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <span className="text-slate-600">{project.location}</span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current status / milestone</div>
                <div className="mt-1 font-bold text-[#0B192C]">
                  {project.status} · {currentMilestone ? currentMilestone.event : "—"} ({project.progress}%)
                </div>
              </div>
              <div className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">Last verified update:</span>{" "}
                {attested ? formatDate(attested.attested_at) : "Not yet anchored"}
              </div>
            </div>

            <div className="sm:col-span-2 flex flex-col items-center text-center">
              <div className="p-3 bg-white rounded-xl border-2 border-[#0B192C]">
                <QRCodeCanvas value={verifyUrl} size={168} fgColor="#0B192C" level="M" />
              </div>
              <div className="mt-3 font-extrabold text-[#0B192C] tracking-wide text-sm">
                SCAN TO VERIFY PROJECT RECORD
              </div>
              <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Integrity anchored to Stellar
              </div>
              {attested && (
                <div className="mt-1 font-mono text-[10px] text-slate-400">{attested.package_code}</div>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap justify-between gap-2 text-[11px] text-slate-500">
          <span>Powered by ISLA Camp Center, Inc.</span>
          <span>TALA verifies the integrity of the attested evidence package, not the truthfulness of underlying statements.</span>
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 font-bold text-[#0B192C] text-sm leading-snug">{value}</div>
    </div>
  );
}
