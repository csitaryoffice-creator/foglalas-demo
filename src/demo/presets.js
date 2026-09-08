const pad = (value) => String(value).padStart(2, "0");

function dateFromToday(offset) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function records(prefix, items) {
  return items.map((item, index) => ({ id: `${prefix}-${index + 1}`, ...item }));
}

function availabilityFor(presetId, providers) {
  return providers.flatMap((provider, providerIndex) =>
    [1, 2, 3, 4, 5].map((weekday) => ({
      id: `${presetId}-hours-${providerIndex + 1}-${weekday}`,
      provider_id: provider.id,
      weekday,
      start_time: providerIndex === 0 ? "09:00" : "10:00",
      end_time: providerIndex === 0 ? "17:00" : "18:00",
      active: true,
    })),
  );
}

function makePreset(config) {
  const providers = records(`${config.id}-provider`, config.providers);
  const categories = records(`${config.id}-category`, config.categories.map((name, index) => ({
    name,
    sort_order: index,
    active: true,
  })));
  const services = records(`${config.id}-service`, config.services.map((service, index) => ({
    provider_id: providers[service.provider].id,
    category_id: categories[service.category || 0].id,
    name: service.name,
    description: service.description,
    duration_minutes: service.duration,
    price_huf: service.price,
    buffer_before_minutes: service.bufferBefore || 0,
    buffer_after_minutes: service.bufferAfter || 0,
    featured: index === 0,
    active: true,
    sort_order: index,
  })));

  const bookingDateOne = dateFromToday(1);
  const bookingDateTwo = dateFromToday(2);
  const completedDate = dateFromToday(-4);
  const secondaryProvider = providers[1] || providers[0];
  const secondaryService = services.find((service) => service.provider_id === secondaryProvider.id) || services[0];
  const bookings = [
    {
      id: `${config.id}-booking-1`,
      booking_code: `DEMO-${config.code}-101`,
      provider_id: providers[0].id,
      service_id: services.find((service) => service.provider_id === providers[0].id).id,
      customer_name: config.sampleCustomers[0],
      customer_email: "pelda.vendeg@example.test",
      customer_phone: "+36 30 000 0001",
      customer_note: "Előre létrehozott demó foglalás.",
      start_datetime: `${bookingDateOne}T10:00:00`,
      end_datetime: `${bookingDateOne}T${pad(10 + Math.floor(services[0].duration_minutes / 60))}:${pad(services[0].duration_minutes % 60)}:00`,
      status: "confirmed",
    },
    {
      id: `${config.id}-booking-2`,
      booking_code: `DEMO-${config.code}-102`,
      provider_id: secondaryProvider.id,
      service_id: secondaryService.id,
      customer_name: config.sampleCustomers[1],
      customer_email: "minta.ugyfel@example.test",
      customer_phone: "+36 30 000 0002",
      customer_note: "Mintaadat, nem valós személy.",
      start_datetime: `${bookingDateTwo}T13:30:00`,
      end_datetime: `${bookingDateTwo}T14:30:00`,
      status: "pending",
    },
    {
      id: `${config.id}-booking-3`,
      booking_code: `DEMO-${config.code}-099`,
      provider_id: providers[0].id,
      service_id: services[0].id,
      customer_name: config.sampleCustomers[2],
      customer_email: "archiv.pelda@example.test",
      customer_phone: "+36 30 000 0003",
      customer_note: "Archív demó foglalás.",
      start_datetime: `${completedDate}T11:00:00`,
      end_datetime: `${completedDate}T12:00:00`,
      status: "completed",
    },
  ];

  return {
    id: config.id,
    code: config.code,
    businessName: config.businessName,
    businessType: config.businessType,
    description: config.description,
    icon: config.icon,
    branding: config.branding,
    terminology: config.terminology,
    safetyNote: config.safetyNote || "",
    data: {
      providers,
      categories,
      services,
      availabilityRules: availabilityFor(config.id, providers),
      availabilityExceptions: [],
      bookings,
      operationLogs: [
        {
          id: `${config.id}-log-1`,
          action: "demo_loaded",
          description: "A bemutató preset betöltve",
          entity_type: "demo",
          entity_id: config.id,
          created_date: new Date().toISOString(),
        },
      ],
      settings: records(`${config.id}-setting`, [
        { key: "business_name", value: config.businessName },
        { key: "address", value: config.address },
        { key: "slot_interval", value: "30" },
        { key: "booking_window_days", value: "60" },
        { key: "booking_lead_minutes", value: "0" },
        { key: "booking_available_color", value: config.calendarColors?.available || "#71805a" },
        { key: "booking_selected_color", value: config.calendarColors?.selected || "#3f4b32" },
        { key: "booking_unavailable_color", value: config.calendarColors?.unavailable || "#d8d4cb" },
      ]),
    },
  };
}

export const DEMO_PRESETS = [
  makePreset({
    id: "fodraszat",
    code: "HAJ",
    businessName: "Fényfonat Stúdió",
    businessType: "Fodrászat",
    description: "Modern, barátságos fodrászszalon női és férfi szolgáltatásokkal.",
    icon: "✂",
    address: "1111 Budapest, Minta köz 12.",
    branding: {
      primaryColor: "72 20% 25%", accentColor: "18 42% 47%", backgroundColor: "39 33% 96%",
      surfaceColor: "42 33% 99%", textColor: "30 8% 17%", mutedTextColor: "28 7% 42%", borderColor: "35 18% 80%",
      headingFont: '"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif', bodyFont: '"Helvetica Neue", Arial, sans-serif',
      borderRadius: "0rem", buttonStyle: "solid", visualDensity: "balanced", monogram: "FF", heroImage: "/assets/demo/fodraszat-hero.jpg", logoImage: "/assets/demo/logos/fodraszat.png",
    },
    terminology: { provider: "Fodrász", providerPlural: "Fodrászok", customer: "Vendég", customerPlural: "Vendégek", service: "Szolgáltatás", servicePlural: "Szolgáltatások", area: "Fodrász" },
    providers: [
      { name: "Sárosi Luca", display_name: "Luca", role: "Mesterfodrász", area: "Hajszalon", calendar_color: "#7b8050", active: true },
    ],
    categories: ["Hajápolás", "Formázás"],
    services: [
      { provider: 0, category: 0, name: "Női hajvágás", description: "Konzultáció, mosás, vágás és szárítás.", duration: 60, price: 9800 },
      { provider: 0, category: 1, name: "Alkalmi frizura", description: "Személyre szabott alkalmi styling.", duration: 75, price: 12500 },
      { provider: 0, category: 0, name: "Férfi hajvágás", description: "Klasszikus vagy modern férfi hajvágás.", duration: 45, price: 6900 },
      { provider: 0, category: 0, name: "Haj- és szakálligazítás", description: "Komplett frissítő kezelés.", duration: 60, price: 8900 },
    ],
    sampleCustomers: ["Minta Anna", "Próba Bence", "Teszt Dóra"],
  }),
  makePreset({
    id: "wellness",
    code: "RELAX",
    businessName: "Csendliget Wellness",
    businessType: "Masszázs / wellness",
    description: "Nyugodt wellness stúdió frissítő és regeneráló kezelésekkel.",
    icon: "◌",
    address: "1022 Budapest, Harmónia sétány 8.",
    branding: {
      primaryColor: "95 19% 29%", accentColor: "91 18% 45%", backgroundColor: "38 31% 95%",
      surfaceColor: "40 29% 98%", textColor: "32 12% 21%", mutedTextColor: "31 9% 43%", borderColor: "37 18% 79%",
      headingFont: '"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif', bodyFont: '"Helvetica Neue", Arial, sans-serif',
      borderRadius: "0rem", buttonStyle: "soft", visualDensity: "relaxed", monogram: "CW", heroImage: "/assets/demo/wellness-hero.jpg", logoImage: "/assets/demo/logos/wellness.png",
    },
    terminology: { provider: "Masszőr", providerPlural: "Masszőrök", customer: "Vendég", customerPlural: "Vendégek", service: "Masszázs", servicePlural: "Masszázsok", area: "Kezelés" },
    providers: [
      { name: "Varga Emese", display_name: "Emese", role: "Gyógymasszőr", area: "Regenerálás", calendar_color: "#6f8062", active: true },
    ],
    categories: ["Masszázs", "Wellness"],
    services: [
      { provider: 0, name: "Frissítő hátmasszázs", description: "Célzott kezelés a váll és hát területére.", duration: 45, price: 9500 },
      { provider: 0, name: "Regeneráló teljes testmasszázs", description: "Lazító, teljes testes kezelés.", duration: 75, price: 14900 },
      { provider: 0, category: 1, name: "Aromaterápiás masszázs", description: "Illóolajos relaxációs kezelés.", duration: 60, price: 12900 },
      { provider: 0, category: 1, name: "Wellness relaxáció", description: "Légző- és lazító gyakorlatokkal kiegészítve.", duration: 90, price: 16900 },
    ],
    sampleCustomers: ["Minta Nóra", "Próba Levente", "Teszt Júlia"],
  }),
  makePreset({
    id: "maganrendelo",
    code: "MED",
    businessName: "TisztaPont Magánrendelő",
    businessType: "Egészségügy / magánrendelő",
    description: "Fiktív magánrendelő általános és életmód-tanácsadási időpontokhoz.",
    icon: "+",
    address: "1133 Budapest, Példa tér 4.",
    branding: {
      primaryColor: "185 52% 23%", accentColor: "179 32% 40%", backgroundColor: "195 22% 97%",
      surfaceColor: "0 0% 100%", textColor: "195 22% 16%", mutedTextColor: "196 9% 42%", borderColor: "192 15% 82%",
      headingFont: '"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif', bodyFont: '"Helvetica Neue", Arial, sans-serif',
      borderRadius: "0rem", buttonStyle: "precise", visualDensity: "compact", monogram: "TP", heroImage: "/assets/demo/maganrendelo-hero.jpg", logoImage: "/assets/demo/logos/maganrendelo.png",
    },
    terminology: { provider: "Orvos", providerPlural: "Orvosok", customer: "Páciens", customerPlural: "Páciensek", service: "Vizsgálat / konzultáció", servicePlural: "Vizsgálatok / konzultációk", area: "Rendelés" },
    safetyNote: "Ne adj meg valódi egészségügyi vagy személyes adatot. A rendszer kizárólag bemutató célú.",
    providers: [
      { name: "Dr. Pásztor Réka", display_name: "Dr. Pásztor Réka", role: "Általános orvos", area: "Általános rendelés", image: "/assets/demo/providers/dr-pasztor-reka.jpg", calendar_color: "#267c7c", active: true },
      { name: "Dr. Székely Bálint", display_name: "Dr. Székely Bálint", role: "Belgyógyász", area: "Kontrollvizsgálat", image: "/assets/demo/providers/dr-szekely-balint.jpg", calendar_color: "#476fa0", active: true },
      { name: "Dr. Fodor Réka", display_name: "Dr. Fodor Réka", role: "Életmódorvos", area: "Életmód konzultáció", image: "/assets/demo/providers/dr-fodor-reka.jpg", calendar_color: "#7b6a9b", active: true },
      { name: "Dr. Németh András", display_name: "Dr. Németh András", role: "Családorvos", area: "Online utánkövetés", image: "/assets/demo/providers/dr-nemeth-andras.jpg", calendar_color: "#9a6748", active: true },
    ],
    categories: ["Vizsgálat", "Konzultáció"],
    services: [
      { provider: 0, name: "Általános állapotfelmérés", description: "Fiktív, bemutató célú vizsgálati időpont.", duration: 30, price: 18000, bufferAfter: 10 },
      { provider: 1, name: "Kontrollvizsgálat", description: "Rövid utánkövetési konzultáció.", duration: 20, price: 12000, bufferAfter: 10 },
      { provider: 2, category: 1, name: "Életmód-konzultáció", description: "Tájékoztató jellegű demó konzultáció.", duration: 50, price: 22000, bufferAfter: 10 },
      { provider: 3, category: 1, name: "Online utánkövetés", description: "Rövid online megbeszélés.", duration: 30, price: 14000 },
    ],
    sampleCustomers: ["Minta Páciens", "Próba Páciens", "Teszt Páciens"],
  }),
  makePreset({
    id: "kozmetika",
    code: "BEAUTY",
    businessName: "Selyemfény Kozmetika",
    businessType: "Kozmetika / szépségápolás",
    description: "Letisztult kozmetikai stúdió arc- és szépségápolási kezelésekkel.",
    icon: "◇",
    address: "6720 Szeged, Virágzó utca 16.",
    branding: {
      primaryColor: "344 39% 28%", accentColor: "26 28% 48%", backgroundColor: "24 30% 97%",
      surfaceColor: "30 33% 99%", textColor: "340 15% 18%", mutedTextColor: "340 8% 43%", borderColor: "18 17% 81%",
      headingFont: '"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif', bodyFont: '"Helvetica Neue", Arial, sans-serif',
      borderRadius: "0rem", buttonStyle: "elegant", visualDensity: "balanced", monogram: "SK", heroImage: "/assets/demo/kozmetika-hero.jpg", logoImage: "/assets/demo/logos/kozmetika.png",
    },
    terminology: { provider: "Kozmetikus", providerPlural: "Kozmetikusok", customer: "Vendég", customerPlural: "Vendégek", service: "Kezelés", servicePlural: "Kezelések", area: "Szépségápolás" },
    providers: [
      { name: "Bálint Zsófia", display_name: "Zsófia", role: "Kozmetikus", area: "Arckezelés", image: "/assets/demo/providers/balint-zsofia.jpg", calendar_color: "#7f3652", active: true },
      { name: "Halász Petra", display_name: "Petra", role: "Szépségterapeuta", area: "Szemöldök és szempilla", image: "/assets/demo/providers/halasz-petra.jpg", calendar_color: "#a37952", active: true },
    ],
    categories: ["Arckezelés", "Szemöldök és szempilla"],
    services: [
      { provider: 0, name: "Frissítő arckezelés", description: "Tisztítás, hidratálás és nyugtató maszk.", duration: 60, price: 13900 },
      { provider: 0, name: "Prémium hidratáló kezelés", description: "Intenzív hidratáló arcápolás.", duration: 75, price: 17900 },
      { provider: 1, category: 1, name: "Szemöldökformázás", description: "Formaigazítás és styling.", duration: 30, price: 5900 },
      { provider: 1, category: 1, name: "Szempillafestés", description: "Gyors, természetes hatású kezelés.", duration: 30, price: 6500 },
    ],
    sampleCustomers: ["Minta Lili", "Próba Eszter", "Teszt Sára"],
  }),
  makePreset({
    id: "tanacsadas",
    code: "CONSULT",
    businessName: "Iránytű Konzultációs Műhely",
    businessType: "Tanácsadás / konzultáció",
    description: "Fiktív tanácsadó műhely üzleti és karrierkonzultációk bemutatásához.",
    icon: "↗",
    address: "9021 Győr, Jövőkép utca 5.",
    branding: {
      primaryColor: "219 36% 20%", accentColor: "17 50% 39%", backgroundColor: "40 24% 96%",
      surfaceColor: "42 27% 99%", textColor: "219 25% 16%", mutedTextColor: "218 9% 41%", borderColor: "37 14% 80%",
      headingFont: '"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif', bodyFont: '"Helvetica Neue", Arial, sans-serif',
      borderRadius: "0rem", buttonStyle: "structured", visualDensity: "compact", monogram: "IK", heroImage: "/assets/demo/tanacsadas-hero.jpg", logoImage: "/assets/demo/logos/tanacsadas.png",
    },
    terminology: { provider: "Tanácsadó", providerPlural: "Tanácsadók", customer: "Ügyfél", customerPlural: "Ügyfelek", service: "Konzultáció", servicePlural: "Konzultációk", area: "Szakterület" },
    providers: [
      { name: "Molnár Dániel", display_name: "Dániel", role: "Üzleti tanácsadó", area: "Üzleti tervezés", calendar_color: "#284b63", active: true },
    ],
    categories: ["Üzleti", "Karrier"],
    services: [
      { provider: 0, name: "Üzleti helyzetfelmérés", description: "60 perces strukturált konzultáció.", duration: 60, price: 24000 },
      { provider: 0, name: "Stratégiai tervezés", description: "Célok és következő lépések meghatározása.", duration: 90, price: 34000 },
      { provider: 0, category: 1, name: "Karrierirány konzultáció", description: "Lehetőségek és célok közös áttekintése.", duration: 60, price: 22000 },
      { provider: 0, category: 1, name: "Interjúfelkészítés", description: "Gyakorlati felkészülés és visszajelzés.", duration: 75, price: 27000 },
    ],
    sampleCustomers: ["Minta Ádám", "Próba Virág", "Teszt Gergő"],
  }),
];

export function getDemoPreset(presetId) {
  return DEMO_PRESETS.find((preset) => preset.id === presetId) || null;
}
