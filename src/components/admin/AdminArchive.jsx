import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import BookingEditDialog from "@/components/admin/BookingEditDialog";

const STATUS = {
  pending: "Függőben",
  confirmed: "Megerősítve",
  completed: "Befejezve",
  cancelled: "Lemondva",
  no_show: "Nem jelent meg",
};

const STATUS_COLORS = {
  completed: "bg-blue-100 text-blue-800",
};

const PAGE_SIZE = 10;

function providerBgColor(providerId, providers) {
  const provider = providers.find((p) => p.id === providerId);
  const name = (provider?.name || "").toLowerCase();
  if (name.includes("gábor") || name.includes("gabor")) return "bg-blue-50 border-blue-200";
  if (name.includes("kata")) return "bg-pink-50 border-pink-200";
  return "bg-card border-border";
}

export default function AdminArchive({ providers, services, bookings, loading, reload }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  const provName = (id) => providers.find((p) => p.id === id)?.name || "—";
  const svcName = (id) => services.find((s) => s.id === id)?.name || "—";

  const archived = bookings
    .filter((b) => b.status === "completed")
    .filter((b) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        b.customer_name?.toLowerCase().includes(q) ||
        b.booking_code?.toLowerCase().includes(q) ||
        b.customer_phone?.includes(q) ||
        b.customer_email?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.start_datetime.localeCompare(a.start_datetime));

  const totalPages = Math.ceil(archived.length / PAGE_SIZE);
  const paginated = archived.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search]);

  return (
    <div>
      <h2 className="font-heading text-xl text-foreground mb-2">Archívum</h2>
      <p className="text-sm text-muted-foreground mb-4">Lezajlott (befejezett) foglalások.</p>

      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Keresés az archívumban…" className="pl-8" />
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : paginated.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Nincs archivált foglalás.</p>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className={`w-full text-left border p-3 transition-all duration-200 hover:scale-[1.02] ${providerBgColor(b.provider_id, providers)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground">
                      {b.start_datetime?.substring(0, 16).replace("T", " ")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">{b.customer_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {provName(b.provider_id)} · {svcName(b.service_id)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${STATUS_COLORS[b.status] || "bg-muted text-muted-foreground"}`}>
                    {STATUS[b.status]}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="p-2 border hover:bg-muted disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="p-2 border hover:bg-muted disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      <BookingEditDialog
        booking={selected}
        providers={providers}
        services={services}
        onClose={() => setSelected(null)}
        onSaved={reload}
      />
    </div>
  );
}