import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Landmark,
  MapPin,
  Calendar,
  Building,
  Wallet,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  ExternalLink,
  Plus,
  Upload,
  Printer,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { peso, formatDate, shortHash } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { VerificationBadge } from "@/components/VerificationBadge";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VerifyQR } from "@/components/VerifyQR";
import { EvidencePreviewDialog } from "@/components/EvidencePreviewDialog";

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/projects/${id}`).then((r) => setData(r.data));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isAdmin = user && user.role === "LGU Administrator";
  const isReviewer = user && user.role === "LGU Reviewer";
  const isStaff = !!user;

  if (!data) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-slate-400">Loading project…</div>;
  }

  const { project, milestones, evidence, packages } = data;

  const attest = async (pkgId, code) => {
    setBusy(true);
    toast.info(`Anchoring ${code} to Stellar Testnet…`);
    try {
      await api.post(`/packages/${pkgId}/attest`);
      toast.success(`${code} attested to Stellar Testnet.`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Attestation failed");
    } finally {
      setBusy(false);
    }
  };

  const review = async (evId, decision) => {
    try {
      await api.post(`/evidence/${evId}/review`, { decision });
      toast.success(`Evidence marked ${decision}.`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Review failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-5">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#0B192C]">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <Link to={`/signboard/${id}`} data-testid="project-signboard-link">
          <Button size="sm" variant="outline"><Printer className="h-4 w-4" /> Signboard</Button>
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-2xl bg-[#0B192C] text-white p-6 sm:p-8 isla-grid relative overflow-hidden">
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="font-mono text-xs text-emerald-300">{project.project_code}</span>
            <StatusBadge status={project.status} />
            <span className="text-[10px] uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded text-slate-300">
              Demo / Synthetic
            </span>
          </div>
          <h1 data-testid="project-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight max-w-3xl">
            {project.name}
          </h1>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-slate-300">
            <span className="inline-flex items-center gap-1.5"><Landmark className="h-4 w-4 text-emerald-400" /> {project.lgu_name}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-emerald-400" /> {project.location}</span>
            <span className="inline-flex items-center gap-1.5"><Building className="h-4 w-4 text-emerald-400" /> {project.contractor}</span>
          </div>
          <div className="mt-6 max-w-md">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-300">Implementation progress</span>
              <span className="font-bold">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2 bg-white/15" />
          </div>
        </div>
      </div>

      {/* Overview grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <OverviewTile icon={Wallet} label="Project Value" value={peso(project.value, 2)} />
        <OverviewTile icon={FileText} label="Funding Source" value={project.funding_source} />
        <OverviewTile icon={Calendar} label="Start Date" value={formatDate(project.start_date)} />
        <OverviewTile icon={Calendar} label="Target Completion" value={formatDate(project.target_completion)} />
      </div>

      <Tabs defaultValue="timeline" className="mt-8">
        <TabsList data-testid="project-tabs">
          <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
          <TabsTrigger value="evidence" data-testid="tab-evidence">Evidence</TabsTrigger>
          <TabsTrigger value="packages" data-testid="tab-packages">
            Evidence Packages
          </TabsTrigger>
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline" className="mt-6">
          <div className="relative pl-8">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />
            {milestones.map((m) => {
              const Icon =
                m.status === "Completed" ? CheckCircle2 : m.status === "In Progress" ? Clock : Circle;
              const color =
                m.status === "Completed"
                  ? "text-emerald-500"
                  : m.status === "In Progress"
                    ? "text-blue-500"
                    : "text-slate-300";
              return (
                <div key={m.id} data-testid={`milestone-${m.order}`} className="relative mb-6">
                  <div className="absolute -left-8 top-0 bg-white rounded-full">
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                          {m.category}
                        </div>
                        <h4 className="font-bold text-[#0B192C]">{m.event}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={m.verification_status} />
                        <StatusBadge status={m.status} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-slate-500">
                      <span>{formatDate(m.date)}</span>
                      <span>{m.responsible_office}</span>
                      {m.amount != null && (
                        <span className="font-semibold text-[#0B192C]">{peso(m.amount)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Evidence */}
        <TabsContent value="evidence" className="mt-6">
          {isAdmin && (
            <div className="mb-4">
              <UploadEvidenceDialog milestones={milestones} onDone={load} />
            </div>
          )}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Evidence</th>
                    <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Type</th>
                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">SHA-256</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Stellar</th>
                    {isStaff && <th className="text-left px-4 py-3 font-semibold">File</th>}
                    {isReviewer && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evidence.map((e) => (
                    <tr key={e.id} data-testid={`evidence-row-${e.id}`}>
                      <td className="px-4 py-3 font-medium text-[#0B192C]">{e.name}</td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{e.document_type}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="font-mono text-xs text-slate-500">{shortHash(e.sha256)}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                      <td className="px-4 py-3"><StatusBadge status={e.stellar_status} /></td>
                      {isStaff && (
                        <td className="px-4 py-3">
                          {e.has_file ? (
                            <EvidencePreviewDialog evidence={e} />
                          ) : (
                            <span className="text-xs text-slate-400">No file</span>
                          )}
                        </td>
                      )}
                      {isReviewer && (
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <Button data-testid={`approve-${e.id}`} size="sm" variant="outline" className="h-7 text-xs text-emerald-700" onClick={() => review(e.id, "Approved")}>Approve</Button>
                            <Button data-testid={`reject-${e.id}`} size="sm" variant="outline" className="h-7 text-xs text-red-700" onClick={() => review(e.id, "Rejected")}>Reject</Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
              Sensitive document contents are kept off-chain. Only non-sensitive metadata and SHA-256 digests are published.
            </div>
          </div>
        </TabsContent>

        {/* Packages */}
        <TabsContent value="packages" className="mt-6">
          {isAdmin && (
            <div className="mb-4">
              <CreatePackageDialog project={project} milestones={milestones} evidence={evidence} onDone={load} />
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {packages.length === 0 && (
              <div className="text-slate-400 text-sm">No evidence packages yet.</div>
            )}
            {packages.map((pkg) => (
              <div key={pkg.id} data-testid={`package-${pkg.package_code}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm font-semibold text-[#0B192C]">{pkg.package_code}</span>
                  <StatusBadge status={pkg.status} />
                </div>
                <div className="space-y-1 mb-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">SHA-256 Commitment</div>
                  <div className="font-mono text-xs break-all bg-slate-100 border border-slate-200 rounded px-2 py-1.5 text-slate-700">
                    {pkg.sha256}
                  </div>
                </div>
                {pkg.stellar_tx && (
                  <div className="text-xs text-slate-500 mb-3">
                    <span className="font-semibold">Stellar Tx: </span>
                    <a href={pkg.explorer_url} target="_blank" rel="noreferrer" className="font-mono text-emerald-700 hover:underline inline-flex items-center gap-1">
                      {shortHash(pkg.stellar_tx)} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Link to={`/verify/${project.id}/${pkg.id}`} data-testid={`verify-link-${pkg.package_code}`}>
                    <Button size="sm" variant="outline" className="text-xs"><ShieldCheck className="h-3.5 w-3.5" /> Verify</Button>
                  </Link>
                  <VerifyQR projectId={project.id} packageId={pkg.id} packageCode={pkg.package_code} projectName={project.name} />
                  {isAdmin && !pkg.stellar_tx && (
                    <Button data-testid={`attest-${pkg.package_code}`} size="sm" disabled={busy} className="text-xs bg-emerald-600 hover:bg-emerald-500" onClick={() => attest(pkg.id, pkg.package_code)}>
                      Attest to Stellar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1.5 font-bold text-[#0B192C]">{value}</div>
    </div>
  );
}

const DOC_TYPES = [
  "Appropriation Ordinance", "Invitation to Bid", "Notice of Award", "Contract Agreement",
  "Disbursement Voucher", "Notice to Proceed", "Inspection Report", "Accomplishment Report",
  "Certificate of Completion", "Photo Documentation", "Other",
];

function UploadEvidenceDialog({ milestones, onDone }) {
  const [open, setOpen] = useState(false);
  const [milestoneId, setMilestoneId] = useState("");
  const [name, setName] = useState("");
  const [docType, setDocType] = useState("Accomplishment Report");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!milestoneId || !name || !file) {
      toast.error("Select a milestone, enter a name, and choose a file.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("document_type", docType);
      fd.append("file", file);
      await api.post(`/milestones/${milestoneId}/evidence`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Evidence uploaded. SHA-256 generated; file stored off-chain.");
      setOpen(false);
      setName("");
      setFile(null);
      setMilestoneId("");
      onDone();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="upload-evidence-button" className="bg-[#0B192C] hover:bg-[#1E293B]">
          <Upload className="h-4 w-4" /> Upload Evidence
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="upload-evidence-dialog">
        <DialogHeader>
          <DialogTitle>Upload supporting evidence</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div>
            <Label className="text-xs font-semibold text-slate-600">Milestone</Label>
            <Select value={milestoneId} onValueChange={setMilestoneId}>
              <SelectTrigger data-testid="upload-milestone" className="mt-1"><SelectValue placeholder="Select milestone" /></SelectTrigger>
              <SelectContent>
                {milestones.map((m) => <SelectItem key={m.id} value={m.id}>{m.order}. {m.event}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600">Document name</Label>
            <Input data-testid="upload-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Accomplishment Report — May 2026" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600">Document type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger data-testid="upload-type" className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600">File (demo document)</Label>
            <Input data-testid="upload-file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1" />
            <p className="text-xs text-slate-400 mt-1">Stored securely off-chain. Only the SHA-256 hash and metadata are published.</p>
          </div>
          <Button data-testid="upload-submit" onClick={submit} disabled={busy} className="w-full bg-emerald-600 hover:bg-emerald-500">
            {busy ? "Uploading…" : "Upload & hash"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function CreatePackageDialog({ project, milestones, evidence, onDone }) {
  const [open, setOpen] = useState(false);
  const [milestoneId, setMilestoneId] = useState("all");
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  const scoped = milestoneId === "all" ? evidence : evidence.filter((e) => e.milestone_id === milestoneId);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const selectedDocs = evidence.filter((e) => selected.includes(e.id));

  const submit = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one document to include.");
      return;
    }
    setBusy(true);
    try {
      const body = { project_id: project.id, document_ids: selected };
      if (milestoneId !== "all") body.milestone_id = milestoneId;
      const { data: pkg } = await api.post("/packages", body);
      toast.success(`Package ${pkg.package_code} created from ${selected.length} document(s). SHA-256 generated.`);
      setOpen(false);
      setSelected([]);
      setMilestoneId("all");
      onDone();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to create package");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="create-package-button" className="bg-[#0B192C] hover:bg-[#1E293B]">
          <Plus className="h-4 w-4" /> Generate Evidence Package
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" data-testid="create-package-dialog">
        <DialogHeader>
          <DialogTitle>Build an evidence package</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div>
            <Label className="text-xs font-semibold text-slate-600">Milestone scope</Label>
            <Select value={milestoneId} onValueChange={(v) => { setMilestoneId(v); setSelected([]); }}>
              <SelectTrigger data-testid="package-milestone" className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Whole project (all milestones)</SelectItem>
                {milestones.map((m) => <SelectItem key={m.id} value={m.id}>{m.order}. {m.event}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs font-semibold text-slate-600">Select documents ({selected.length})</Label>
              <button
                type="button"
                data-testid="package-select-all"
                className="text-xs font-semibold text-emerald-700 hover:underline"
                onClick={() => setSelected(scoped.map((e) => e.id))}
              >
                Select all
              </button>
            </div>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
              {scoped.length === 0 && <div className="px-3 py-4 text-sm text-slate-400">No evidence in this scope.</div>}
              {scoped.map((e) => (
                <label key={e.id} data-testid={`package-doc-${e.id}`} className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50">
                  <Checkbox checked={selected.includes(e.id)} onCheckedChange={() => toggle(e.id)} className="mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#0B192C] truncate">{e.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{e.document_type} · {shortHash(e.sha256, 8, 6)}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {selectedDocs.length > 0 && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Will be anchored ({selectedDocs.length})
              </div>
              <ul className="text-xs text-slate-600 space-y-0.5 list-disc list-inside">
                {selectedDocs.map((d) => <li key={d.id} className="truncate">{d.name}</li>)}
              </ul>
              <p className="text-[11px] text-slate-400 mt-2">
                Documents are canonicalized in deterministic order, so the SHA-256 commitment is reproducible.
              </p>
            </div>
          )}

          <Button data-testid="package-submit" onClick={submit} disabled={busy} className="w-full bg-emerald-600 hover:bg-emerald-500">
            {busy ? "Generating…" : "Generate package & SHA-256"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
