import { getDemoPreset } from "./presets.js";

const ACTIVE_PRESET_KEY = "idopont-demo-active-preset";
const STATE_KEY_PREFIX = "idopont-demo-state:v4:";

const clone = (value) => JSON.parse(JSON.stringify(value));
const storage = () => window.sessionStorage;
const stateKey = (presetId) => `${STATE_KEY_PREFIX}${presetId}`;

export function getActivePresetId() {
  return storage().getItem(ACTIVE_PRESET_KEY);
}

export function activateDemoPreset(presetId) {
  const preset = getDemoPreset(presetId);
  if (!preset) throw new Error("Ismeretlen demó preset.");
  storage().setItem(ACTIVE_PRESET_KEY, presetId);
  if (!storage().getItem(stateKey(presetId))) {
    storage().setItem(stateKey(presetId), JSON.stringify(clone(preset.data)));
  }
  return preset;
}

export function getDemoState() {
  const presetId = getActivePresetId();
  if (!presetId) throw new Error("Nincs kiválasztott demó vállalkozás.");
  activateDemoPreset(presetId);
  return JSON.parse(storage().getItem(stateKey(presetId)));
}

export function saveDemoState(state) {
  const presetId = getActivePresetId();
  if (!presetId) throw new Error("Nincs kiválasztott demó vállalkozás.");
  storage().setItem(stateKey(presetId), JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("demo-state-changed", { detail: { presetId } }));
}

export function resetDemoPreset(presetId = getActivePresetId()) {
  const preset = getDemoPreset(presetId);
  if (!preset) throw new Error("Ismeretlen demó preset.");
  storage().setItem(ACTIVE_PRESET_KEY, presetId);
  storage().setItem(stateKey(presetId), JSON.stringify(clone(preset.data)));
  window.dispatchEvent(new CustomEvent("demo-state-changed", { detail: { presetId } }));
  return preset;
}

export function clearDemoAdminSession() {
  storage().removeItem("borka_admin_session");
  storage().removeItem("borka_admin_session_time");
}

function makeId(collection) {
  if (globalThis.crypto?.randomUUID) return `${collection}-${globalThis.crypto.randomUUID()}`;
  return `${collection}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createCollectionRepository(collection) {
  return {
    async list() {
      return clone(getDemoState()[collection] || []);
    },
    async get(id) {
      return clone((getDemoState()[collection] || []).find((item) => item.id === id) || null);
    },
    async create(data) {
      const state = getDemoState();
      const item = {
        id: makeId(collection),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        ...clone(data),
      };
      state[collection] = [...(state[collection] || []), item];
      saveDemoState(state);
      return clone(item);
    },
    async bulkCreate(items) {
      const created = [];
      for (const item of items) created.push(await this.create(item));
      return created;
    },
    async update(id, data) {
      const state = getDemoState();
      const index = (state[collection] || []).findIndex((item) => item.id === id);
      if (index < 0) throw new Error("A módosítandó elem nem található.");
      const updated = { ...state[collection][index], ...clone(data), updated_date: new Date().toISOString() };
      state[collection][index] = updated;
      saveDemoState(state);
      return clone(updated);
    },
    async remove(id) {
      const state = getDemoState();
      state[collection] = (state[collection] || []).filter((item) => item.id !== id);
      saveDemoState(state);
      return { success: true };
    },
  };
}
