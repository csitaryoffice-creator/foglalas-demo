import { useState, useEffect } from "react";
import * as repo from "@/services/dataService";
import { Loader2 } from "lucide-react";

export default function OperationLogPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const all = await repo.operationLogs.list();
      all.sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""));
      setLogs(all.slice(0, 50));
    } catch (e) {
      // entity might not exist yet
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function formatTime(dt) {
    if (!dt) return "";
    return dt.substring(0, 16).replace("T", " ");
  }

  return (
    <div className="border p-4 bg-card">
      <h3 className="font-heading text-base text-foreground mb-3">Műveleti napló</h3>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground text-sm">Még nincs rögzítve művelet.</p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="border-l-2 border-forest/30 pl-2.5 py-1">
              <p className="text-xs text-foreground">{log.description}</p>
              <p className="text-[10px] text-muted-foreground">{formatTime(log.created_date)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}