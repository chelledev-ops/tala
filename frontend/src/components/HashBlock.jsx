import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function HashBlock({ value, label, testId, tone = "slate" }) {
  const [copied, setCopied] = useState(false);
  const toneCls =
    tone === "emerald"
      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
      : tone === "red"
        ? "bg-red-50 border-red-200 text-red-900"
        : "bg-slate-100 border-slate-200 text-slate-800";

  const copy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-1">
      {label && (
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
      )}
      <div
        className={`font-mono text-xs sm:text-sm px-3 py-2 rounded-md border tracking-wider break-all flex items-start gap-2 ${toneCls}`}
      >
        <span data-testid={testId} className="flex-1">
          {value || "—"}
        </span>
        {value && (
          <button
            data-testid={testId ? `${testId}-copy` : "hash-copy"}
            onClick={copy}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Copy hash"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
