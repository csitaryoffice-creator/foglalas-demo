import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import * as repo from "@/services/dataService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemo } from "@/demo/DemoContext";

const EMPTY_PROVIDER = { name: "", display_name: "", role: "", area: "", calendar_color: "#527a73" };

export default function AdminProviders({ providers = [], reload }) {
  const { terminology } = useDemo();
  const [newProvider, setNewProvider] = useState(EMPTY_PROVIDER);
  const [adding, setAdding] = useState(false);

  async function addProvider() {
    if (!newProvider.name.trim()) return;
    setAdding(true);
    const provider = await repo.providers.create({
      ...newProvider,
      name: newProvider.name.trim(),
      display_name: newProvider.display_name.trim() || newProvider.name.trim(),
      role: newProvider.role.trim(),
      area: newProvider.area.trim() || newProvider.role.trim(),
      active: true,
      sort_order: providers.length,
    });
    await repo.availabilityRules.bulkCreate([1, 2, 3, 4, 5].map((weekday) => ({
      provider_id: provider.id,
      weekday,
      start_time: "09:00",
      end_time: "17:00",
      active: true,
    })));
    await repo.operationLogs.create({
      action: "provider_created",
      description: `${provider.name} hozzáadva`,
      entity_type: "provider",
      entity_id: provider.id,
    });
    setNewProvider(EMPTY_PROVIDER);
    await reload?.();
    setAdding(false);
  }

  return (
    <div className="max-w-3xl space-y-8">
      <section>
        <h2 className="font-heading text-xl text-foreground">{terminology.providerPlural}</h2>
        <p className="mt-1 text-sm text-muted-foreground">A rendszerben jelenleg szereplő {terminology.providerPlural.toLowerCase()}.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {providers.map((provider) => (
            <div key={provider.id} className="flex items-center gap-3 border bg-card p-3">
              <span className="h-10 w-2 shrink-0" style={{ backgroundColor: provider.calendar_color || "#527a73" }} />
              <span className="min-w-0">
                <strong className="block truncate text-sm font-medium">{provider.name}</strong>
                <span className="block truncate text-xs text-muted-foreground">{provider.role || provider.area || "Nincs megadott szerepkör"}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t pt-7">
        <h2 className="font-heading text-xl text-foreground">Új {terminology.provider.toLowerCase()} hozzáadása</h2>
        <p className="mt-1 text-sm text-muted-foreground">Az új szakember hétfőtől péntekig 9–17 óráig lesz elérhető. Ezután rendelj hozzá szolgáltatást a {terminology.servicePlural.toLowerCase()} menüben.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div><Label>Teljes név *</Label><Input value={newProvider.name} onChange={(event) => setNewProvider({ ...newProvider, name: event.target.value })} className="mt-1.5" /></div>
          <div><Label>Rövid megjelenő név</Label><Input value={newProvider.display_name} onChange={(event) => setNewProvider({ ...newProvider, display_name: event.target.value })} className="mt-1.5" /></div>
          <div><Label>Szerepkör</Label><Input value={newProvider.role} onChange={(event) => setNewProvider({ ...newProvider, role: event.target.value })} className="mt-1.5" /></div>
          <div><Label>Szakterület</Label><Input value={newProvider.area} onChange={(event) => setNewProvider({ ...newProvider, area: event.target.value })} className="mt-1.5" /></div>
          <label className="text-sm"><span className="block text-muted-foreground">Naptárszín</span><input className="mt-1.5 h-10 w-16 border p-1" type="color" value={newProvider.calendar_color} onChange={(event) => setNewProvider({ ...newProvider, calendar_color: event.target.value })} /></label>
        </div>
        <button type="button" onClick={addProvider} disabled={adding || !newProvider.name.trim()} className="mt-4 inline-flex items-center bg-forest px-5 py-2.5 text-ivory font-medium disabled:opacity-50">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1.5 h-4 w-4" /> {terminology.provider} hozzáadása</>}
        </button>
      </section>
    </div>
  );
}
