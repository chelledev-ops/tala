import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function VerifyQR({ projectId, packageId, packageCode, projectName }) {
  const ref = useRef(null);
  const url = `${window.location.origin}/verify/${projectId}/${packageId}`;

  const print = () => {
    const canvas = ref.current?.querySelector("canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const w = window.open("", "_blank", "width=480,height=640");
    if (!w) return;
    w.document.write(`
      <html><head><title>${packageCode} — Verify</title>
      <style>
        body{font-family:-apple-system,Segoe UI,sans-serif;text-align:center;padding:40px;color:#0B192C}
        .tag{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#64748b}
        h1{font-size:22px;margin:6px 0 2px}
        .code{font-family:monospace;color:#059669;font-weight:700}
        img{width:300px;height:300px;margin:24px auto;display:block;border:1px solid #e2e8f0;border-radius:12px;padding:12px}
        .url{font-family:monospace;font-size:11px;color:#64748b;word-break:break-all}
        .foot{margin-top:18px;font-size:11px;color:#94a3b8}
      </style></head>
      <body>
        <div class="tag">Scan to verify project record</div>
        <h1>${projectName || "Public Project"}</h1>
        <div class="code">${packageCode}</div>
        <img src="${dataUrl}" />
        <div class="url">${url}</div>
        <div class="foot">TALA · Verifiable Public Projects · Powered by ISLA Camp Center, Inc.</div>
        <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button data-testid={`qr-button-${packageCode}`} size="sm" variant="outline" className="text-xs">
          <QrCode className="h-3.5 w-3.5" /> QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm" data-testid="qr-dialog">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
              Scan to verify project record
            </div>
            <div className="mt-1 font-mono text-emerald-700">{packageCode}</div>
          </DialogTitle>
        </DialogHeader>
        <div ref={ref} className="flex flex-col items-center gap-4 py-2">
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <QRCodeCanvas value={url} size={220} fgColor="#0B192C" level="M" includeMargin={false} />
          </div>
          <p className="text-xs text-slate-500 text-center break-all font-mono">{url}</p>
          <Button data-testid="qr-print-button" onClick={print} className="w-full bg-[#0B192C] hover:bg-[#1E293B]">
            <Printer className="h-4 w-4" /> Print verification QR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
