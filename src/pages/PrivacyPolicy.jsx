import DemoBanner from "@/components/demo/DemoBanner";
import DemoNav from "@/components/demo/DemoNav";
import { useDemo } from "@/demo/DemoContext";

export default function PrivacyPolicy() {
  const { bookingPath } = useDemo();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <DemoNav />
      <DemoBanner />
    <main className="px-4 py-12 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-md border bg-card p-6 sm:p-10">
        <h1 className="font-heading text-3xl">Adatvédelmi tájékoztató</h1>
        <p className="mt-6 leading-relaxed text-muted-foreground">
          Ez a projekt jelenleg elkülönített munkapéldány. A nyilvános demóhoz
          végleges, a demó üzemeltetőjére és adatkezelésére szabott tájékoztatót
          kell készíteni; az eredeti szalon személyes és vállalkozási adatai nem
          kerültek át ebbe a másolatba.
        </p>
        <a href={bookingPath} className="mt-8 inline-block text-forest underline underline-offset-4">
          Vissza a foglaláshoz
        </a>
      </article>
    </main>
    </div>
  );
}
