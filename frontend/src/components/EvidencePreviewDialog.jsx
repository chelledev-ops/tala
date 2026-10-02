import { useState } from "react";
import { Eye, Download, FileText } from "lucide-react";
import api from "@/lib/api";
import { shortHash, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EvidencePreviewDialog({ evidence }) {
  const [url, setUrl] = useState(null);
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadFile = async (openState) => {
    if (!openState) {
      if (url) URL.revokeObjectURL(url);
      setUrl(null);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/evidence/${evidence.id}/download`, { responseType: "blob" });
      const blob = res.data;
      setType(blob.type || "");
      setUrl(URL.createObjectURL(blob));
    } catch {
      setError("Could not load file. You may not have access.");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = evidence.original_filename || evidence.name;
    a.click();
  };

  const isImage = type.startsWith("image/");
  const isPdf = type === "application/pdf";

  return (
    <Dialog onOpenChange={loadFile}>
      <DialogTrigger asChild>
        <Button data-testid={`preview-${evidence.id}`} size="sm" variant="outline" className="h-7 text-xs">
          <Eye className="h-3.5 w-3.5" /> Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl" data-testid="evidence-preview-dialog">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{evidence.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Meta label="Type" value={evidence.document_type} />
          <Meta label="Uploaded" value={formatDate(evidence.uploaded_date)} />
          <Meta label="Review status" value={<StatusBadge status={evidence.status} />} />
          <Meta label="Stellar" value={<StatusBadge status={evidence.stellar_status} />} />
        </div>
        <div className="rounded-md bg-slate-100 border border-slate-200 px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">SHA-256</div>
          <div className="font-mono text-xs break-all text-slate-700">{evidence.sha256}</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 min-h-[260px] flex items-center justify-center overflow-hidden">
          {loading && <div className="text-slate-400 text-sm">Loading preview…</div>}
          {!loading && error && <div className="text-red-600 text-sm px-6 text-center">{error}</div>}
          {!loading && !error && url && isImage && (
            <img src={url} alt={evidence.name} className="max-h-[420px] w-auto object-contain" />
          )}
          {!loading && !error && url && isPdf && (
            <iframe src={url} title="preview" className="w-full h-[420px]" />
          )}
          {!loading && !error && url && !isImage && !isPdf && (
            <div className="text-center p-6">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Preview not available for this file type.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-400 max-w-sm">
            Staff-only preview. Document contents remain off-chain and private; they are not exposed publicly.
          </p>
          <Button data-testid="preview-download" size="sm" variant="outline" onClick={download} disabled={!url}>
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-0.5 text-slate-700 font-medium">{value}</div>
    </div>
  );
}
