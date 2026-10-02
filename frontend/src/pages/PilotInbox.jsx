import { useEffect, useState } from "react";
import { Inbox, Mail } from "lucide-react";
import api from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export default function PilotInbox() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("/pilot").then((r) => {
      setRows(r.data);
      if (r.data.length) setSelected(r.data[0]);
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-1">
        <Inbox className="h-5 w-5 text-[#0B192C]" />
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0B192C]">Pilot Inbox</h1>
      </div>
      <p className="text-slate-500 mb-6">Incoming requests from the Join the LGU Pilot form.</p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-16 text-center text-slate-400" data-testid="pilot-inbox-empty">
          <Mail className="h-8 w-8 mx-auto mb-3 text-slate-300" />
          No pilot requests yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {rows.map((r) => (
                <button
                  key={r.id}
                  data-testid={`pilot-row-${r.id}`}
                  onClick={() => setSelected(r)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selected?.id === r.id ? "bg-slate-50" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#0B192C] truncate">{r.full_name}</span>
                    <StatusBadge status={r.status === "new" ? "Submitted" : r.status} />
                  </div>
                  <div className="text-sm text-slate-500 truncate">{r.organization}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{formatDateTime(r.created_at)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-6" data-testid="pilot-detail">
            {selected ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#0B192C]">{selected.full_name}</h2>
                  <StatusBadge status={selected.status === "new" ? "Submitted" : selected.status} />
                </div>
                <div className="text-sm text-slate-500">{selected.position || "—"}</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                  <Detail label="LGU / Organization" value={selected.organization} />
                  <Detail label="Email" value={<a className="text-emerald-700 hover:underline" href={`mailto:${selected.email}`}>{selected.email}</a>} />
                  <Detail label="Location" value={selected.location || "—"} />
                  <Detail label="Area of interest" value={selected.interest || "—"} />
                  <Detail label="Submitted" value={formatDateTime(selected.created_at)} />
                </div>

                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Message</div>
                  <p className="mt-1 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selected.message || "—"}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-slate-400">Select a request.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-0.5 text-[#0B192C] font-medium">{value}</div>
    </div>
  );
}
