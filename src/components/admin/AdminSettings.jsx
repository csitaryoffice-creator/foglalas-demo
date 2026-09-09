import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { getSettings, saveSetting, clearCache } from "@/services/settings";
import * as repo from "@/services/dataService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemo } from "@/demo/DemoContext";

const GENERAL_FIELDS = [
  { key: "business_name", label: "Üzlet neve", type: "text" },
  { key: "address", label: "Cím", type: "text" },
  { key: "slot_interval", label: "Időköz (perc)", type: "number" },
  { key: "booking_window_days", label: "Foglalási ablak (nap)", type: "number" },
  { key: "booking_lead_minutes", label: "Minimális előfoglalási idő (perc)", type: "number" },
];

const CALENDAR_FIELDS = [
  { key: "booking_available_color", label: "Szabad időpontok" },
  { key: "booking_selected_color", label: "Kiválasztott időpont" },
  { key: "booking_unavailable_color", label: "Nem elérhető időpontok" },
];

export default function AdminSettings({ providers = [], reload }) {
  const { terminology } = useDemo();
  const [settings, setSettings] = useState(null);
  const [providerColors, setProviderColors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { getSettings().then(setSettings); }, []);
  useEffect(() => {
    setProviderColors(Object.fromEntries(providers.map((provider) => [provider.id, provider.calendar_color || "#527a73"])));
  }, [providers]);

  async function save() {
    setSaving(true);
    for (const field of [...GENERAL_FIELDS, ...CALENDAR_FIELDS]) {
      await saveSetting(field.key, settings[field.key]);
    }
    await Promise.all(providers.map((provider) => repo.providers.update(provider.id, {
      calendar_color: providerColors[provider.id] || "#527a73",
    })));
    clearCache();
    await reload?.();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!settings) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-2xl space-y-10">
      <section>
        <h2 className="font-heading text-xl text-foreground mb-4">Általános beállítások</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {GENERAL_FIELDS.map((field) => (
            <div key={field.key} className={field.key === "business_name" || field.key === "address" ? "sm:col-span-2" : ""}>
              <Label>{field.label}</Label>
              <Input type={field.type} value={settings[field.key] || ""} onChange={(event) => setSettings({ ...settings, [field.key]: event.target.value })} className="mt-1.5" />
            </div>
          ))}
        </div>
      </section>

      <section className="border-t pt-7">
        <h2 className="font-heading text-xl text-foreground">Vendégoldali naptár színei</h2>
        <p className="mt-1 text-sm text-muted-foreground">A kiválasztott színek a foglalási naptárban és az időpontgombokon is megjelennek.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {CALENDAR_FIELDS.map((field) => (
            <label key={field.key} className="calendar-color-field border bg-card p-3 text-sm">
              <span className="block text-muted-foreground">{field.label}</span>
              <span className="mt-2 flex items-center gap-2">
                <input type="color" value={settings[field.key]} onChange={(event) => setSettings({ ...settings, [field.key]: event.target.value })} />
                <span className="font-mono text-xs">{settings[field.key]}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="border-t pt-7">
        <h2 className="font-heading text-xl text-foreground">{terminology.providerPlural} naptárszínei</h2>
        <p className="mt-1 text-sm text-muted-foreground">A szín az összesített és a szűrt adminnaptárban is ugyanaz marad.</p>
        <div className="mt-4 divide-y border-y">
          {providers.map((provider) => (
            <label key={provider.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span><strong className="block font-medium">{provider.name}</strong><span className="text-muted-foreground">{provider.role || provider.area}</span></span>
              <span className="flex items-center gap-2">
                <input type="color" value={providerColors[provider.id] || "#527a73"} onChange={(event) => setProviderColors({ ...providerColors, [provider.id]: event.target.value })} />
                <span className="font-mono text-xs text-muted-foreground">{providerColors[provider.id]}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <button onClick={save} disabled={saving} className="inline-flex items-center bg-forest px-5 py-2.5 text-ivory font-medium disabled:opacity-60">
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : saved ? <><Check className="mr-1 h-5 w-5" /> Mentve</> : "Minden beállítás mentése"}
      </button>
    </div>
  );
}
