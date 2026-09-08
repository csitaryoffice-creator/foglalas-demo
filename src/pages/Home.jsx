import BookingWidget from "@/components/booking/BookingWidget";
import DemoBanner from "@/components/demo/DemoBanner";
import DemoNav from "@/components/demo/DemoNav";
import { useDemo } from "@/demo/DemoContext";

export default function Home() {
  const { preset, terminology } = useDemo();
  return (
    <div className="booking-page min-h-screen bg-background">
      <DemoNav />
      <DemoBanner />
      <main>
        <section className="business-hero">
          <div className="business-hero__copy">
            <div className="business-monogram"><img src={preset.branding.logoImage} alt={`${preset.businessName} logója`} /></div>
            <p className="business-kicker">{preset.businessType}</p>
            <h1>{preset.businessName}</h1>
            <p className="business-description">{preset.description}</p>
            <div className="business-meta">
              <span>{terminology.providerPlural}</span><span>Online időpontfoglalás</span>
              <span>{preset.data.settings.find((item) => item.key === "address")?.value}</span>
            </div>
          </div>
          <div className="business-hero__image"><img src={preset.branding.heroImage} alt={`${preset.businessName} hangulatképe`} /></div>
        </section>
        <section id="foglalas" className="booking-section">
          <div className="booking-section__heading">
            <p className="business-kicker">Online foglalás</p>
            <h2>Találd meg a megfelelő időpontot</h2>
            <p>A foglalás néhány rövid lépésből áll, és azonnal megjelenik a demó adminfelületén.</p>
          </div>
          <div className="booking-section__widget"><BookingWidget /></div>
        </section>
      </main>
    </div>
  );
}
