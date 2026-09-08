import { useState, useEffect } from "react";
import * as repo from "@/services/dataService";
import { formatPrice, formatDuration, logOperation } from "@/services/booking";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Plus, Trash2, Pause, Play } from "lucide-react";
import { useDemo } from "@/demo/DemoContext";

function sortByName(list) {
  return [...list].sort((a, b) => (a.name || "").localeCompare(b.name || "", "hu"));
}

export default function AdminServices({ providers, reload }) {
  const { terminology } = useDemo();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterProvider, setFilterProvider] = useState("");

  async function load() {
    setLoading(true);
    const [s, c] = await Promise.all([repo.services.list(), repo.categories.list()]);
    setServices(sortByName(s));
    setCategories(c);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (providers.length && !filterProvider) setFilterProvider(providers[0].id);
  }, [providers]);

  const catName = (id) => categories.find((c) => c.id === id)?.name || "—";

  async function toggleActive(s) {
    await repo.services.update(s.id, { active: !s.active });
    load();
    reload();
  }

  async function toggleFeatured(s) {
    await repo.services.update(s.id, { featured: !s.featured });
    load();
  }

  async function deleteService(s) {
    if (!confirm(`Biztosan törli a "${s.name}" szolgáltatást?`)) return;
    await repo.services.remove(s.id);
    await logOperation("service_delete", `Szolgáltatás törölve: ${s.name}`, "service", s.id);
    load();
    reload();
  }

  const filteredServices = filterProvider
    ? services.filter((s) => s.provider_id === filterProvider)
    : services;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h2 className="font-heading text-xl text-foreground">{terminology.servicePlural}</h2>
        <div className="flex items-center gap-2">
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="border px-3 py-2 text-sm bg-card"
          >
            {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex items-center px-4 py-2 bg-forest text-ivory text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4 mr-1" /> Új {terminology.service.toLowerCase()}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filteredServices.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Nincs {terminology.service.toLowerCase()} rögzítve ennél a {terminology.provider.toLowerCase()}nél.</p>
      ) : (
        <div className="space-y-2">
          {filteredServices.map((s) => (
            <div key={s.id} className="border p-3 bg-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {catName(s.category_id)} · {formatDuration(s.duration_minutes)} · {formatPrice(s.price_huf)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded ${s.featured ? "bg-forest/10 text-forest" : "bg-muted text-muted-foreground"}`}>{s.featured ? "Kiemelt" : ""}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${s.active ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{s.active ? "Aktív" : "Szüneteltetve"}</span>
                  <button onClick={() => toggleActive(s)} className={`p-1.5 transition-all duration-200 hover:scale-[1.02] ${s.active ? "text-amber-600 hover:text-amber-700" : "text-green-600 hover:text-green-700"}`} title={s.active ? "Szüneteltetés" : "Aktiválás"}>
                    {s.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button onClick={() => { setEditing(s); setShowForm(true); }} className="p-1.5 transition-all duration-200 hover:scale-[1.02]"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => deleteService(s)} className="p-1.5 text-destructive hover:text-destructive/80 transition-all duration-200 hover:scale-[1.02]"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="flex gap-3 mt-2 text-xs">
                <button onClick={() => toggleFeatured(s)} className="text-muted-foreground hover:text-foreground">{s.featured ? "Kiemelés eltávolítása" : "Kiemelés"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ServiceForm
          service={editing}
          providers={providers}
          categories={categories}
          terminology={terminology}
          defaultProviderId={filterProvider}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); reload(); }}
        />
      )}
    </div>
  );
}

function ServiceForm({ service, providers, categories, terminology, defaultProviderId, onClose, onSaved }) {
  const [form, setForm] = useState({
    provider_id: service?.provider_id || defaultProviderId || "",
    category_id: service?.category_id || "",
    name: service?.name || "",
    description: service?.description || "",
    duration_minutes: service?.duration_minutes || 30,
    price_huf: service?.price_huf || 0,
    buffer_before_minutes: service?.buffer_before_minutes || 0,
    buffer_after_minutes: service?.buffer_after_minutes || 0,
    featured: service?.featured || false,
    active: service?.active !== false,
    sort_order: service?.sort_order || 0,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const data = { ...form, duration_minutes: Number(form.duration_minutes), price_huf: Number(form.price_huf), buffer_before_minutes: Number(form.buffer_before_minutes), buffer_after_minutes: Number(form.buffer_after_minutes), sort_order: Number(form.sort_order) };
    if (service) await repo.services.update(service.id, data);
    else await repo.services.create(data);
    setSaving(false);
    onSaved();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{service ? `${terminology.service} szerkesztése` : `Új ${terminology.service.toLowerCase()}`}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>{terminology.provider}</Label>
            <select value={form.provider_id} onChange={(e) => setForm({ ...form, provider_id: e.target.value })} className="mt-1.5 w-full border px-3 py-2 text-sm bg-card">
              <option value="">Válasszon…</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Kategória</Label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="mt-1.5 w-full border px-3 py-2 text-sm bg-card">
              <option value="">Válasszon…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><Label>Megnevezés</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Leírás</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Időtartam (perc)</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="mt-1.5" /></div>
            <div><Label>Ár (Ft)</Label><Input type="number" value={form.price_huf} onChange={(e) => setForm({ ...form, price_huf: e.target.value })} className="mt-1.5" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Idő előtt (perc)</Label><Input type="number" value={form.buffer_before_minutes} onChange={(e) => setForm({ ...form, buffer_before_minutes: e.target.value })} className="mt-1.5" /></div>
            <div><Label>Idő után (perc)</Label><Input type="number" value={form.buffer_after_minutes} onChange={(e) => setForm({ ...form, buffer_after_minutes: e.target.value })} className="mt-1.5" /></div>
          </div>
          <div><Label>Sorrend</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="mt-1.5" /></div>
          <div className="flex gap-4 items-center flex-wrap">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Kiemelt</label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Megjelenik a weboldalon</label>
              <span className={`text-xs px-2 py-0.5 rounded ${form.active ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{form.active ? "Aktív" : "Szüneteltetve"}</span>
            </div>
          </div>
          <button onClick={save} disabled={saving || !form.name || !form.provider_id || !form.category_id} className="w-full py-2.5 bg-forest text-ivory font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-60">
            {saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Mentés"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
