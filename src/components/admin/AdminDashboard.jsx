import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import AdminCalendar from "@/components/admin/AdminCalendar";
import BookingEditDialog from "@/components/admin/BookingEditDialog";
import OperationLogPanel from "@/components/admin/OperationLogPanel";

const STATUS = {
  pending: "Függőben",
  confirmed: "Megerősítve",
  completed: "Befejezve",
  cancelled: "Lemondva",
  no_show: "Nem jelent meg",
};

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-200 text-gray-700",
};

const PAGE_SIZE = 10;

function providerBgColor(providerId, providers) {
  const provider = providers.find((p) => p.id === providerId);
  const name = (provider?.name || "").toLowerCase();
  if (name.includes("gábor") || name.includes("gabor")) return "bg-blue-50 border-blue-200";
  if (name.includes("kata")) return "bg-pink-50 border-pink-200";
  return "bg-card border-border";
}

export default function AdminDashboard({ providers, services, bookings, loading, reload }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  const provName = (id) => providers.find((p) => p.id === id)?.name || "—";
  const svcName = (id) => services.find((s) => s.id === id)?.name || "—";

  // Current = not completed (pending, confirmed, cancelled, no_show)
  const currentBookings = bookings.filter((b) => b.status !== "completed");

  const filtered = currentBookings
    .filter((b) => !filterStatus || b.status === filterStatus)
    .filter((b) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        b.customer_name?.toLowerCase().includes(q) ||
        b.booking_code?.toLowerCase().includes(q) ||
        b.customer_phone?.includes(q) ||
        b.customer_email?.toLowerCase().includes(q) ||
        b.start_datetime?.includes(q)
      );
    })
    .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search, filterStatus]);

  return (
    <div>
      {/* Search bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-5">
        <div className="relative sm:col-span-7">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Keresés: név, idő, email, telefon…" className="pl-8" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="sm:col-span-5 border px-3 py-2 text-sm bg-card">
          <option value="">Minden státusz</option>
          {Object.entries(STATUS).filter(([k]) => k !== "completed").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Calendar */}
      <AdminCalendar providers={providers} services={services} bookings={bookings} onSelectBooking={setSelected} onReload={reload} />

      {/* Bookings list */}
      <div className="mt-8">
        <h3 className="font-heading text-lg text-foreground mb-3">Aktuális foglalások ({filtered.length})</h3>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : paginated.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Nincs a feltételeknek megfelelő foglalás.</p>
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
                    <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${STATUS_COLORS[b.status]}`}>
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
      </div>

      {/* Operation log */}
      <div className="mt-8">
        <OperationLogPanel />
      </div>

      {/* Edit dialog */}
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
