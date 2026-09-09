import { useState, useEffect, useRef } from "react";
import { loadCatalog, loadProviders } from "@/services/catalog";
import { getDaySchedule, getMaxBookableDate } from "@/services/availability";
import { createBooking, formatPrice, formatDuration } from "@/services/booking";
import { getSettings } from "@/services/settings";
import { useDemo } from "@/demo/DemoContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import BookingCalendar from "@/components/booking/BookingCalendar";
import TimeSlots from "@/components/booking/TimeSlots";

function providerPortrait(provider) {
  return provider?.image || null;
}

function providerArea(provider) {
  return provider?.area || provider?.role || "Szolgáltatás";
}

function providerRole(provider) {
  return provider?.role || "";
}

function providerFirstName(provider) {
  if (provider?.display_name) return provider.display_name;
  const parts = (provider?.name || "").trim().split(/\s+/);
  return parts[parts.length - 1] || provider?.name || "";
}

export default function BookingWidget() {
  const { terminology, bookingPath, preset, presetId } = useDemo();
  const STEPS = [terminology.area, terminology.service, "Dátum", "Idő", "Adataid", "Megerősítés"];
  const widgetRef = useRef(null);
  const firstRender = useRef(true);
  const [step, setStep] = useState(1);
  const [catalog, setCatalog] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [provider, setProvider] = useState(null);
  const [service, setService] = useState(null);
  const [date, setDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [time, setTime] = useState("");
  const [calendarColors, setCalendarColors] = useState({
    available: "#71805a",
    selected: "#3f4b32",
    unavailable: "#d8d4cb",
  });

  const [form, setForm] = useState({ name: "", phone: "", email: "", note: "", privacy: false });
  const [errors, setErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const hasProviderChoice = providers.length > 1;
  const visibleSteps = hasProviderChoice
    ? STEPS.map((label, index) => ({ label, step: index + 1 }))
    : STEPS.slice(1).map((label, index) => ({ label, step: index + 2 }));

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (widgetRef.current) {
      widgetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  useEffect(() => {
    Promise.all([loadCatalog(), loadProviders(), getMaxBookableDate(), getSettings()])
      .then(([c, p, md, settings]) => {
        const sorted = [...p].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        setCatalog(c);
        setProviders(sorted);
        setMaxDate(md);
        setCalendarColors({
          available: settings.booking_available_color,
          selected: settings.booking_selected_color,
          unavailable: settings.booking_unavailable_color,
        });
        if (sorted.length === 1) {
          setProvider(sorted[0]);
          setStep(2);
        }
      })
      .finally(() => setLoading(false));
  }, [presetId]);

  // Services filtered by selected provider (area).
  const areaServices = provider
    ? catalog.filter((s) => s.provider_id === provider.id)
    : [];

  useEffect(() => {
    if (!date || !service) return;
    setSlotsLoading(true);
    setSlots([]);
    setTime("");
    getDaySchedule(service.provider_id, date, service)
      .then(setSlots)
      .finally(() => setSlotsLoading(false));
  }, [date, service]);

  function selectProvider(p) {
    setProvider(p);
    setService(null);
    setDate("");
    setSlots([]);
    setTime("");
    setStep(2);
  }

  function selectService(s) {
    setService(s);
    setDate("");
    setSlots([]);
    setTime("");
    setStep(3);
  }

  function selectDate(d) {
    setDate(d);
    setStep(4);
  }

  function selectTime(t) {
    setTime(t);
    setStep(5);
  }

  function validateForm() {
    const e = {};
    if (!form.name.trim()) e.name = "Kötelező megadni.";
    if (!form.phone.trim()) e.phone = "Kötelező megadni.";
    if (!form.email.trim()) e.email = "Kötelező megadni.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Érvénytelen e-mail cím.";
    if (!form.privacy) e.privacy = "Az adatkezelési tájékoztató elfogadása kötelező.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submitDetails() {
    if (!validateForm()) return;
    setStep(6);
  }

  async function confirm() {
    setSubmitting(true);
    setError("");
    try {
      const booking = await createBooking({
        provider_id: service.provider_id,
        service_id: service.id,
        dateStr: date,
        timeStr: time,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        customer_note: form.note,
      });
      setResult(booking);
    } catch (err) {
      setError(err.message || "A foglalás során hiba történt.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setResult(null);
    setProvider(null);
    setService(null);
    setDate("");
    setSlots([]);
    setTime("");
    setForm({ name: "", phone: "", email: "", note: "", privacy: false });
    setErrors({});
    setError("");
    setStep(providers.length === 1 ? 2 : 1);
  }

  // ---- Success screen ----
  if (result) {
    return (
      <div className="booking-panel bg-card border p-6 md:p-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center">
          <Check className="h-7 w-7 text-forest" />
        </div>
        <h3 className="font-heading text-2xl text-charcoal mt-5">Foglalás rögzítve</h3>
        <p className="text-charcoal/70 mt-2">Köszönjük! Foglalását rögzítettük, hamarosan megerősítjük.</p>
        <div className="mt-5 inline-block border border-charcoal/15 px-5 py-2.5">
          <p className="text-xs text-charcoal/50">Foglalási kód</p>
          <p className="font-heading text-xl text-forest tracking-wide">{result.booking_code}</p>
        </div>
        <div className="mt-6 text-left max-w-sm mx-auto space-y-2 text-sm">
          <Row label={terminology.service} value={service.name} />
          <Row label={terminology.provider} value={service.provider?.name} />
          <Row label="Dátum" value={date} />
          <Row label="Időpont" value={time} />
          <Row label="Időtartam" value={formatDuration(service.duration_minutes)} />
        </div>
        <a
          href={bookingPath}
          className="primary-action mt-7 inline-flex items-center px-6 py-3 bg-forest text-ivory font-medium transition-colors"
        >
          Vissza a kezdőlapra
        </a>
      </div>
    );
  }

  return (
    <div ref={widgetRef} className="booking-panel bg-card border scroll-mt-20">
      {/* Step indicator */}
      <div className="flex border-b border-charcoal/10 overflow-hidden">
        {visibleSteps.map(({ label, step: stepNumber }, i) => {
          const active = step === stepNumber;
          const done = step > stepNumber;
          return (
            <div
              key={label}
              className={`flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-0.5 overflow-hidden border-r border-charcoal/10 px-1 py-3 text-center text-xs sm:text-[10px] md:text-xs lg:text-sm last:border-r-0 ${
                active ? "bg-forest text-ivory" : done ? "bg-forest/5 text-forest" : "text-charcoal/50"
              }`}
            >
              <span className="shrink-0 font-medium">{i + 1}.</span>
              <span className="hidden min-w-0 overflow-hidden text-ellipsis whitespace-nowrap sm:inline" title={label}>{label}</span>
            </div>
          );
        })}
      </div>

      <div className="p-5 md:p-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-forest" />
          </div>
        ) : step === 1 ? (
          /* ---- Step 1: Service area ---- */
          <div>
            <h3 className="font-heading text-lg text-charcoal mb-1">Válassz szakembert</h3>
            <p className="text-sm text-charcoal/60 mb-5">Válaszd ki a számodra megfelelő {terminology.provider.toLowerCase()}t.</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {providers.map((p) => {
                const portrait = providerPortrait(p);
                const area = providerArea(p);
                const role = providerRole(p);
                const firstName = providerFirstName(p);
                return (
                  <button
                    key={p.id}
                    onClick={() => selectProvider(p)}
                    className="provider-choice group text-left border border-charcoal/15 transition-colors overflow-hidden"
                  >
                    {portrait ? (
                      <div className="provider-choice__portrait overflow-hidden bg-forest/5">
                        <img
                          src={portrait}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="provider-choice__monogram">
                        <span aria-hidden="true">{providerFirstName(p).slice(0, 1)}</span>
                      </div>
                    )}
                    <div className="provider-choice__body p-3 sm:p-4">
                      <p className="provider-choice__area text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">{area}</p>
                      <p className="provider-choice__name font-heading text-base sm:text-lg text-foreground mt-0.5">{firstName}</p>
                      {role && <p className="provider-choice__role text-xs sm:text-sm text-muted-foreground mt-0.5">{role}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : step === 2 ? (
          /* ---- Step 2: Service list ---- */
          <div>
            {hasProviderChoice ? (
              <BackBar onBack={() => setStep(1)} title={providerArea(provider)} sub={providerFirstName(provider)} />
            ) : (
              <div className="mb-5">
                <h3 className="font-heading text-lg text-charcoal">Válassz {terminology.service.toLowerCase()}t</h3>
                <p className="mt-1 text-sm text-muted-foreground">{providerFirstName(provider)} elérhető szolgáltatásai</p>
              </div>
            )}
            <div className="service-list">
              {areaServices.length === 0 && (
                <p className="text-charcoal/50 text-sm py-8 text-center">
                  Nincsenek elérhető szolgáltatások ebben a kategóriában.
                </p>
              )}
              {areaServices.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectService(s)}
                  className={`service-row w-full text-left py-4 transition-colors flex items-center justify-between gap-4 ${
                    service?.id === s.id ? "service-row--selected" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-charcoal">{s.name}</p>
                    {s.description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.description}</p>}
                    <p className="text-xs font-medium text-charcoal/60 mt-1.5">
                      {formatDuration(s.duration_minutes)} · {formatPrice(s.price_huf)}
                    </p>
                  </div>
                  <span className="service-row__cta">Foglalás <ChevronRight className="h-4 w-4 shrink-0" /></span>
                </button>
              ))}
            </div>
          </div>
        ) : step === 3 ? (
          /* ---- Step 3: Date (calendar) ---- */
          <div>
            <BackBar onBack={() => setStep(2)} title={service?.name} sub={service?.provider?.name} />
            <h3 className="font-heading text-base text-charcoal mb-4">Válasszon dátumot</h3>
            <BookingCalendar
              providerId={provider.id}
              service={service}
              value={date}
              onChange={selectDate}
              maxDate={maxDate}
              colors={calendarColors}
            />
            {date && (
              <p className="text-sm text-forest mt-4 font-medium">
                Kiválasztott dátum: {date}
              </p>
            )}
          </div>
        ) : step === 4 ? (
          /* ---- Step 4: Time slots ---- */
          <div className="min-h-[220px]">
            <BackBar onBack={() => setStep(3)} title={date} />
            <h3 className="font-heading text-base text-charcoal mb-4">Elérhető időpontok</h3>
            <TimeSlots slots={slots} loading={slotsLoading} value={time} onSelect={selectTime} colors={calendarColors} />
          </div>
        ) : step === 5 ? (
          /* ---- Step 5: Customer details ---- */
          <div>
            <BackBar onBack={() => setStep(4)} title={`${date} ${time}`} />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bk-name">{terminology.customer} neve *</Label>
                <Input id="bk-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="bk-phone">Telefonszám *</Label>
                <Input id="bk-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="bk-email">E-mail *</Label>
                <Input id="bk-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="bk-note">Megjegyzés (opcionális)</Label>
                <Textarea id="bk-note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="mt-1.5" rows={3} />
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2.5">
              <Checkbox id="bk-privacy" checked={form.privacy} onCheckedChange={(v) => setForm({ ...form, privacy: !!v })} className="mt-0.5" />
              <Label htmlFor="bk-privacy" className="text-sm text-charcoal/70 leading-relaxed font-normal">
                Elolvastam és elfogadom az <a href={`/demo/${presetId}/adatvedelmi-tajekoztato`} target="_blank" rel="noopener noreferrer" className="underline text-forest hover:text-forest/80">adatvédelmi tájékoztatót</a>.
              </Label>
            </div>
            {preset.safetyNote && <p className="mt-3 rounded-md bg-amber-50 p-3 text-xs font-medium text-amber-900">{preset.safetyNote}</p>}
            {errors.privacy && <p className="text-xs text-destructive mt-1">{errors.privacy}</p>}
            <button onClick={submitDetails} className="primary-action mt-5 w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-forest text-ivory font-medium transition-colors">
              Tovább az ellenőrzésre
            </button>
          </div>
        ) : step === 6 ? (
          /* ---- Step 6: Review & confirm ---- */
          <div>
            <BackBar onBack={() => setStep(5)} />
            <h3 className="font-heading text-lg text-charcoal mb-4">Foglalás összegzése</h3>
            <div className="space-y-2.5 text-sm border border-charcoal/10 p-5">
              <Row label={terminology.service} value={service.name} />
              <Row label={terminology.provider} value={service.provider?.name} />
              <Row label="Dátum" value={date} />
              <Row label="Időpont" value={time} />
              <Row label="Időtartam" value={formatDuration(service.duration_minutes)} />
              <div className="border-t border-charcoal/10 pt-2.5 mt-2.5">
                <Row label="Név" value={form.name} />
                <Row label="Telefonszám" value={form.phone} />
                <Row label="E-mail" value={form.email} />
                {form.note && <Row label="Megjegyzés" value={form.note} />}
              </div>
            </div>
            <p className="text-xs text-charcoal/50 mt-3">
              Ez egy próba foglalás; fizetés és tartós adatmentés nem történik.
            </p>
            {error && <p className="text-sm text-destructive mt-3">{error}</p>}
            <button
              onClick={confirm}
              disabled={submitting}
              className="primary-action mt-5 w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-forest text-ivory font-medium transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Foglalás véglegesítése"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BackBar({ onBack, title, sub }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <button onClick={onBack} className="flex items-center text-sm text-charcoal/60 hover:text-charcoal">
        <ChevronLeft className="h-4 w-4 mr-1" /> Vissza
      </button>
      {(title || sub) && (
        <div className="text-right">
          {title && <p className="text-sm text-charcoal/80 font-medium">{title}</p>}
          {sub && <p className="text-xs text-charcoal/50">{sub}</p>}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-charcoal/50">{label}</span>
      <span className="text-charcoal text-right">{value}</span>
    </div>
  );
}
