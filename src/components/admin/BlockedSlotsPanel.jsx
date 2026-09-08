import { useState, useEffect } from "react";
import * as repo from "@/services/dataService";
import { logOperation } from "@/services/booking";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Pencil, X } from "lucide-react";
import { addDays } from "@/services/availability";

const EXC_TYPES = [
  { k: "blocked", l: "Blokkolt időszak" },
  { k: "closed", l: "Egész nap zárva" },
  { k: "custom_hours", l: "Egyedi nyitvatartás" },
];

const TYPE_LABELS = {
  closed: "Zárva",
  blocked: "Blokkolt",
  custom_hours: "Egyedi",
};

const TYPE_COLORS = {
  closed: "bg-red-100 text-red-800",
  blocked: "bg-amber-100 text-amber-800",
  custom_hours: "bg-blue-100 text-blue-800",
};

const REPEAT_TYPES = [
  { k: "none", l: "Egyszeri" },
  { k: "daily", l: "Napi" },
  { k: "weekly", l: "Heti" },
];

export default function BlockedSlotsPanel({ providers }) {
  const [providerId, setProviderId] = useState("");
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const blankForm = {
    date: "",
    type: "blocked",
    start_time: "10:00",
    end_time: "11:00",
    note: "",
    repeat_type: "none",
    repeat_interval: "1",
    repeat_end_date: "",
  };
  const [excForm, setExcForm] = useState(blankForm);

  useEffect(() => {
    if (providers.length && !providerId) setProviderId(providers[0].id);
  }, [providers]);

  async function load() {
    if (!providerId) return;
    setLoading(true);
    const e = await repo.availabilityExceptions.list();
    setExceptions(e.filter((x) => x.provider_id === providerId).sort((a, b) => b.date.localeCompare(a.date)));
    setLoading(false);
  }
  useEffect(() => { load(); }, [providerId]);

  function startNew() { setEditing("new"); setExcForm(blankForm); }
  function startEdit(exc) {
    setEditing(exc.id);
    setExcForm({
      date: exc.date,
      type: exc.type,
      start_time: exc.start_time || "10:00",
      end_time: exc.end_time || "11:00",
      note: exc.note || "",
      repeat_type: "none",
      repeat_interval: "1",
      repeat_end_date: "",
    });
  }
  function cancelEdit() { setEditing(null); setExcForm(blankForm); }

  function generateDates(form) {
    const dates = [form.date];
    const repeatType = form.repeat_type;
    const interval = parseInt(form.repeat_interval) || 1;
    const endDate = form.repeat_end_date;

    if (repeatType === "none" || !endDate) return dates;

    const maxIter = 365;
    let current = form.date;
    for (let i = 0; i < maxIter; i++) {
      if (repeatType === "daily") {
        current = addDays(current, interval);
      } else if (repeatType === "weekly") {
        current = addDays(current, interval * 7);
      }
      if (current > endDate) break;
      dates.push(current);
    }
    return dates;
  }

  async function saveException() {
    if (!excForm.date) return;
    if ((excForm.type === "blocked" || excForm.type === "custom_hours") && (!excForm.start_time || !excForm.end_time)) return;
    setSaving(true);
    try {
      if (editing === "new") {
        const dates = generateDates(excForm);
        await repo.availabilityExceptions.bulkCreate(
          dates.map((d) => ({
            provider_id: providerId,
            date: d,
            type: excForm.type,
            start_time: excForm.start_time,
            end_time: excForm.end_time,
            note: excForm.note,
          }))
        );
        await logOperation("block_add", `Időblokkolás hozzáadva: ${excForm.date}${excForm.repeat_type !== "none" ? " (ismétlődő)" : ""}`, "exception", "");
      } else {
        await repo.availabilityExceptions.update(editing, {
          date: excForm.date,
          type: excForm.type,
          start_time: excForm.start_time,
          end_time: excForm.end_time,
          note: excForm.note,
        });
      }
      setEditing(null);
      setExcForm(blankForm);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function removeException(id) {
    if (!confirm("Biztosan törli ezt a lezárást?")) return;
    setSaving(true);
    await repo.availabilityExceptions.remove(id);
    await logOperation("block_remove", "Időblokkolás törölve", "exception", id);
    await load();
    setSaving(false);
  }

  const showTimes = excForm.type === "blocked" || excForm.type === "custom_hours";
  const showRecurrence = editing === "new";

  return (
    <div>
      <select value={providerId} onChange={(e) => setProviderId(e.target.value)} className="w-full mb-3 border px-3 py-2 text-sm bg-card">
        {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {editing === null && (
        <button onClick={startNew} className="inline-flex items-center px-3 py-2 bg-forest text-ivory text-sm font-medium transition-all duration-200 hover:scale-[1.02] mb-3">
          <Plus className="h-4 w-4 mr-1" /> Új lezárás
        </button>
      )}

      {editing !== null && (
        <div className="border p-3 mb-3 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-sm">{editing === "new" ? "Új lezárás" : "Szerkesztés"}</p>
            <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-2">
            <div>
              <Label>Dátum</Label>
              <Input type="date" value={excForm.date} onChange={(e) => setExcForm({ ...excForm, date: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Típus</Label>
              <select value={excForm.type} onChange={(e) => setExcForm({ ...excForm, type: e.target.value })} className="mt-1 w-full border px-3 py-2 text-sm bg-card">
                {EXC_TYPES.map((t) => <option key={t.k} value={t.k}>{t.l}</option>)}
              </select>
            </div>
            {showTimes && (
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Kezdés</Label><Input type="time" value={excForm.start_time} onChange={(e) => setExcForm({ ...excForm, start_time: e.target.value })} className="mt-1" /></div>
                <div><Label>Befejezés</Label><Input type="time" value={excForm.end_time} onChange={(e) => setExcForm({ ...excForm, end_time: e.target.value })} className="mt-1" /></div>
              </div>
            )}
            <div><Label>Megjegyzés</Label><Input value={excForm.note} onChange={(e) => setExcForm({ ...excForm, note: e.target.value })} className="mt-1" placeholder="pl. ebédszünet, szabadság" /></div>
            {showRecurrence && (
              <div className="border-t pt-3 mt-2 space-y-2">
                <p className="text-sm font-medium">Ismétlődés</p>
                <div>
                  <Label>Gyakoriság</Label>
                  <select value={excForm.repeat_type} onChange={(e) => setExcForm({ ...excForm, repeat_type: e.target.value })} className="mt-1 w-full border px-3 py-2 text-sm bg-card">
                    {REPEAT_TYPES.map((t) => <option key={t.k} value={t.k}>{t.l}</option>)}
                  </select>
                </div>
                {excForm.repeat_type !== "none" && (
                  <>
                    <div>
                      <Label>Ismétlődés gyakorisága (minden {excForm.repeat_type === "daily" ? "X. nap" : "X. hét"})</Label>
                      <Input type="number" min="1" value={excForm.repeat_interval} onChange={(e) => setExcForm({ ...excForm, repeat_interval: e.target.value })} className="mt-1" />
                    </div>
                    <div>
                      <Label>Ismétlődés vége</Label>
                      <Input type="date" value={excForm.repeat_end_date} onChange={(e) => setExcForm({ ...excForm, repeat_end_date: e.target.value })} className="mt-1" />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={saveException} disabled={saving || !excForm.date} className="px-3 py-1.5 bg-forest text-ivory text-sm font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-60">Mentés</button>
            <button onClick={cancelEdit} className="px-3 py-1.5 border text-sm">Mégse</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : exceptions.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nincs rögzítve lezárás.</p>
      ) : (
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {exceptions.map((e) => (
            <div key={e.id} className="flex items-center justify-between border p-2 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-xs">{e.date}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${TYPE_COLORS[e.type]}`}>{TYPE_LABELS[e.type]}</span>
                  {e.type !== "closed" && e.start_time && <span className="text-muted-foreground text-[10px]">{e.start_time}–{e.end_time}</span>}
                </div>
                {e.note && <p className="text-muted-foreground text-[10px] mt-0.5 truncate">{e.note}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => startEdit(e)} className="text-muted-foreground hover:text-foreground p-1 transition-all duration-200 hover:scale-[1.02]"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => removeException(e.id)} className="text-destructive hover:text-destructive/80 p-1 transition-all duration-200 hover:scale-[1.02]"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}