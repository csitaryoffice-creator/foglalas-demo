// Settings service — key-value business configuration.
import * as repo from "./dataService";
import { getActivePresetId } from "@/demo/sessionStore";

const DEFAULTS = {
  business_name: "Időpontfoglaló demó",
  address: "Fiktív demócím",
  slot_interval: "30",
  booking_window_days: "60",
  booking_lead_minutes: "120",
  booking_available_color: "#71805a",
  booking_selected_color: "#3f4b32",
  booking_unavailable_color: "#d8d4cb",
};

let cache = null;
let cachePresetId = null;

export async function getSettings() {
  const presetId = getActivePresetId();
  if (cache && cachePresetId === presetId) return cache;
  try {
    const rows = await repo.settings.list();
    const obj = { ...DEFAULTS };
    for (const r of rows) obj[r.key] = r.value;
    cache = obj;
    cachePresetId = presetId;
    return obj;
  } catch {
    return DEFAULTS;
  }
}

export async function getSetting(key, defaultVal) {
  const s = await getSettings();
  return s[key] ?? defaultVal;
}

export async function saveSetting(key, value) {
  const rows = await repo.settings.list();
  const existing = rows.find((r) => r.key === key);
  if (existing) {
    await repo.settings.update(existing.id, { value: String(value) });
  } else {
    await repo.settings.create({ key, value: String(value) });
  }
  cache = null;
  cachePresetId = null;
}

export function clearCache() {
  cache = null;
  cachePresetId = null;
}
