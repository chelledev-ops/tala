import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import api from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export default function AuditTrail() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get("/audit").then((r) => setRows(r.data));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-1">
        <ScrollText className="h-5 w-5 text-[#0B192C]" />
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0B192C]">Audit Trail</h1>
      </div>
      <p className="text-slate-500 mb-6">Append-only record of every action across the platform.</p>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Timestamp</th>
                <th className="text-left px-4 py-3 font-semibold">Action</th>
                <th className="text-left px-4 py-3 font-semibold">Actor</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Role</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">From → To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} data-testid={`audit-row-${r.id}`}>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{formatDateTime(r.timestamp)}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-slate-700">
                      {r.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#0B192C] font-medium">{r.actor}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{r.role}</td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell font-mono text-xs break-all max-w-xs">
                    {r.previous_state} → {r.resulting_state}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <div className="px-4 py-10 text-center text-slate-400 text-sm">No audit entries.</div>}
      </div>
    </div>
  );
}
