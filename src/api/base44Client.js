// Compatibility facade for the existing admin login and best-effort
// confirmation call. The public demo never talks to the production backend.
export const base44 = {
  functions: {
    async invoke(name, payload = {}) {
      if (name === "adminLogin") {
        const success = payload.username === "demo" && payload.password === "demo";
        return {
          data: success
            ? { success: true, token: globalThis.crypto?.randomUUID?.() || `demo-${Date.now()}` }
            : { success: false, error: "Hibás felhasználónév vagy jelszó" },
        };
      }
      if (name === "sendBookingConfirmation") return { data: { success: true, demo: true } };
      return { data: { success: true } };
    },
  },
  auth: {
    async me() { return { role: "admin", email: "demo@example.test" }; },
    logout() {},
    redirectToLogin() {},
  },
};
