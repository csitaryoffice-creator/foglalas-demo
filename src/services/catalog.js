// Catalog service — joins services with providers and categories for UI use.
import * as repo from "./dataService";

export async function loadCatalog() {
  const [services, providers, categories] = await Promise.all([
    repo.services.list(),
    repo.providers.list(),
    repo.categories.list(),
  ]);
  const activeProviders = providers.filter((p) => p.active);
  const activeCategories = categories.filter((c) => c.active);
  return services
    .filter((s) => s.active)
    .map((s) => ({
      ...s,
      provider: activeProviders.find((p) => p.id === s.provider_id),
      category: activeCategories.find((c) => c.id === s.category_id),
    }))
    .filter((s) => s.provider)
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "hu"));
}

export async function loadProviders() {
  const list = await repo.providers.list();
  return list.filter((p) => p.active);
}

export async function loadCategories() {
  const list = await repo.categories.list();
  return list.filter((c) => c.active).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}