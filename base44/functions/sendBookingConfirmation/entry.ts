import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { booking, serviceName, providerName, duration, price } = body;

    if (!booking || !booking.customer_email) {
      return Response.json({ error: 'Hiányzó foglalási adatok' }, { status: 400 });
    }

    const date = booking.start_datetime?.substring(0, 10) || '';
    const time = booking.start_datetime?.substring(11, 16) || '';

    const subject = `Foglalás visszaigazolása — BorKa (${booking.booking_code})`;
    const emailBody = [
      `Kedves ${booking.customer_name}!`,
      ``,
      `Foglalását visszaigazoltuk. Örülünk, hogy minket választott!`,
      ``,
      `Foglalás részletei:`,
      `- Szolgáltatás: ${serviceName || '—'}`,
      `- Szakember: ${providerName || '—'}`,
      `- Dátum: ${date}`,
      `- Időpont: ${time}`,
      `- Időtartam: ${duration || '—'}`,
      `- Foglalási kód: ${booking.booking_code}`,
      ``,
      `Helyszín: 8000 Székesfehérvár, Budai út 159.`,
      `Fizetés a helyszínen: készpénz vagy bankkártya.`,
      ``,
      `Kérjük, érkezzen 5 perccel a foglalt időpont előtt. Ha módosítani vagy lemondani szeretné foglalását, keressen minket telefonon vagy e-mailben.`,
      ``,
      `Üdvözlettel,`,
      `BorKa VEGAN Hajszalon és Masszázs`,
    ].join('\n');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: booking.customer_email,
      subject,
      body: emailBody,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}