import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return Response.json({ error: 'Hiányzó adatok' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const settings = await base44.asServiceRole.entities.Setting.list();

    const storedUsername = settings.find((s) => s.key === 'admin_username')?.value;
    const storedPasswordHash = settings.find((s) => s.key === 'admin_password_hash')?.value;

    if (!storedUsername || !storedPasswordHash) {
      return Response.json({ error: 'A bejelentkezés nincs konfigurálva' }, { status: 500 });
    }

    // Hash the input password with SHA-256 (Web Crypto API)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const inputHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    if (username === storedUsername && inputHash === storedPasswordHash) {
      const token = crypto.randomUUID();
      return Response.json({ success: true, token });
    }

    return Response.json({ error: 'Hibás felhasználónév vagy jelszó' }, { status: 401 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}