import { ShieldCheck, AlertTriangle, Hourglass } from "lucide-react";

const MAP = {
  VERIFIED: {
    cls: "bg-emerald-100 text-emerald-900 border-emerald-500",
    icon: ShieldCheck,
    label: "Verified",
  },
  TAMPERED: {
    cls: "bg-red-100 text-red-900 border-red-500",
    icon: AlertTriangle,
    label: "Tampered",
  },
  NOT_ATTESTED: {
    cls: "bg-amber-100 text-amber-900 border-amber-500",
    icon: Hourglass,
    label: "Not Attested",
  },
};

export function VerificationBadge({ state, className = "" }) {
  const cfg = MAP[state] || MAP.NOT_ATTESTED;
  const Icon = cfg.icon;
  return (
    <span
      data-testid="verification-status-badge"
      data-state={state}
      className={`inline-flex items-center gap-1.5 border-2 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider ${cfg.cls} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}
