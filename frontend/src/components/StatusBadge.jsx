const STATUS_STYLES = {
  "In Progress": "bg-blue-100 text-blue-800 border-blue-300",
  Completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Procurement: "bg-violet-100 text-violet-800 border-violet-300",
  "Review Required": "bg-amber-100 text-amber-800 border-amber-300",
  "Not Started": "bg-slate-100 text-slate-700 border-slate-300",
  Attested: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Draft: "bg-slate-100 text-slate-700 border-slate-300",
  Approved: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Submitted: "bg-blue-100 text-blue-800 border-blue-300",
  Pending: "bg-slate-100 text-slate-600 border-slate-300",
  "Pending Review": "bg-amber-100 text-amber-800 border-amber-300",
  Rejected: "bg-red-100 text-red-800 border-red-300",
  "Not Submitted": "bg-slate-100 text-slate-500 border-slate-200",
  "Not Attested": "bg-amber-50 text-amber-700 border-amber-200",
};

export function StatusBadge({ status, className = "" }) {
  const cls = STATUS_STYLES[status] || "bg-slate-100 text-slate-700 border-slate-300";
  return (
    <span
      data-testid="status-badge"
      className={`inline-flex items-center border font-semibold px-2.5 py-0.5 rounded-full text-xs ${cls} ${className}`}
    >
      {status}
    </span>
  );
}
