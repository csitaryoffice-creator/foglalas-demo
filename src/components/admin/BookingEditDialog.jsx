import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { updateBooking, deleteBooking } from "@/services/booking";
import { useDemo } from "@/demo/DemoContext";

const STATUS = {
  pending: "Függőben",
  confirmed: "Megerősítve",
  completed: "Befejezve",
  cancelled: "Lemondva",
  no_show: "Nem jelent meg",
};

export default function BookingEditDialog({ booking, providers, services, onClose, onSaved }) {
  const { terminology } = useDemo();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!booking) { setForm(null); return; }
    const dt = booking.start_datetime || "";
    setForm({
      customer_name: booking.customer_name || "",
      customer_phone: booking.customer_phone || "",
      customer_email: booking.customer_email || "",
      customer_note: booking.customer_note || "",
      provider_id: booking.provider_id || "",
      service_id: booking.service_id || "",
      date: dt.substring(0, 10),
      time: dt.substring(11, 16),
      status: booking.status || "pending",
    });
    setError("");
  }, [booking]);

  if (!booking || !form) return null;

  const availableServices = services.filter((s) => s.provider_id === form.provider_id);

  async function save() {
    if (!form.customer_name.trim() || !form.date || !form.time) {
      setError("A név, dátum és időpont megadása kötelező.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const svc = services.find((s) => s.id === form.service_id);
      const duration = svc?.duration_minutes || 60;
      const [h, m] = form.time.split(":").map(Number);
      const endMin = h * 60 + m + duration;
      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;
      const end = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

      await updateBooking(booking.id, {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim(),
        customer_note: form.customer_note.trim(),
        provider_id: form.provider_id,
        service_id: form.service_id,
        start_datetime: `${form.date}T${form.time}:00`,
        end_datetime: `${form.date}T${end}:00`,
        status: form.status,
      });
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message || "Hiba történt a mentés során.");
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!confirm("Biztosan törli ezt a foglalást? Ez nem visszavonható.")) return;
    setSaving(true);
    try {
      await deleteBooking(booking.id);
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!booking} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Foglalás szerkesztése</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Foglalási kód: {booking.booking_code}</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{terminology.provider}</Label>
              <select
                value={form.provider_id}
                onChange={(e) => setForm({ ...form, provider_id: e.target.value, service_id: "" })}
                className="mt-1.5 w-full border px-3 py-2 text-sm bg-card"
              >
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <Label>{terminology.service}</Label>
              <select
                value={form.service_id}
                onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                className="mt-1.5 w-full border px-3 py-2 text-sm bg-card"
              >
                {availableServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Dátum</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Időpont</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>{terminology.customer} neve</Label>
            <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Telefonszám</Label>
              <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Megjegyzés</Label>
            <Textarea value={form.customer_note} onChange={(e) => setForm({ ...form, customer_note: e.target.value })} rows={2} className="mt-1.5" />
          </div>
          <div>
            <Label>Státusz</Label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="mt-1.5 w-full border px-3 py-2 text-sm bg-card"
            >
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 bg-forest text-ivory font-medium disabled:opacity-60">
              {saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Mentés"}
            </button>
            <button onClick={del} disabled={saving} className="px-4 py-2.5 text-destructive border border-destructive/30 hover:bg-destructive/5">
              Törlés
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
