import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import * as repo from "@/services/dataService";
import { generateBookingCode, formatDuration, logOperation } from "@/services/booking";
import { timeToMinutes, minutesToTime } from "@/services/availability";
import { useDemo } from "@/demo/DemoContext";

export default function BookingCreateDialog({ providers, services, onClose, onSaved }) {
  const { terminology } = useDemo();
  const [form, setForm] = useState({
    provider_id: "",
    service_id: "",
    date: "",
    time: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const availableServices = services.filter((s) => s.provider_id === form.provider_id && s.active);

  async function save() {
    if (!form.provider_id || !form.service_id || !form.date || !form.time || !form.customer_name.trim()) {
      setError("A szakember, szolgáltatás, dátum, időpont és név megadása kötelező.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const svc = services.find((s) => s.id === form.service_id);
      const duration = svc?.duration_minutes || 60;
      const startMin = timeToMinutes(form.time);
      const endMin = startMin + duration;
      const start = `${form.date}T${form.time}:00`;
      const end = `${form.date}T${minutesToTime(endMin)}:00`;

      const booking = await repo.bookings.create({
        booking_code: generateBookingCode(),
        provider_id: form.provider_id,
        service_id: form.service_id,
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_note: form.customer_note.trim(),
        start_datetime: start,
        end_datetime: end,
        status: "confirmed",
      });
      await logOperation("manual_create", "Foglalás manuálisan rögzítve", "booking", booking.id);
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message || "Hiba történt a mentés során.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Új {terminology.customer.toLowerCase()} foglalása</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{terminology.provider}</Label>
              <select
                value={form.provider_id}
                onChange={(e) => setForm({ ...form, provider_id: e.target.value, service_id: "" })}
                className="mt-1.5 w-full border px-3 py-2 text-sm bg-card"
              >
                <option value="">Válasszon…</option>
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
                <option value="">Válasszon…</option>
                {availableServices.map((s) => <option key={s.id} value={s.id}>{s.name} ({formatDuration(s.duration_minutes)})</option>)}
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button onClick={save} disabled={saving} className="w-full px-4 py-2.5 bg-forest text-ivory font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-60">
            {saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Foglalás rögzítése"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
