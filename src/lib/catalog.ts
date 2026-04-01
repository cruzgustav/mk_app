// =============================================
// Catalog Management System v2
// Products are global entities linked to multiple skin tones via skinToneIds
// =============================================

// ---- Types ----

export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  link: string;
  image: string;
  skinToneIds: string[];
};

export type SkinTone = {
  id: string;
  undertone: 'Warm' | 'Cool' | 'Neutral';
  depth: 'Fair' | 'Light' | 'Medium' | 'Tan' | 'Deep';
  colorHex: string;
  colorName: string;
};

export type CatalogSettings = {
  password: string;
  displayLimit: number;
};

export type Catalog = {
  settings: CatalogSettings;
  categories: Category[];
  products: Product[];
  skinTones: SkinTone[];
};

const STORAGE_KEY = 'skin-catalog-data';
const CATALOG_URL = '/data/catalog.json';
const API_URL = '/api/catalog';

// ---- Generate unique IDs ----

function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ---- Load / Save ----

/**
 * Load catalog: API (KV) > localStorage > static JSON.
 * 
 * Ordem de prioridade:
 * 1. API (KV) — fonte de verdade quando disponível
 * 2. localStorage — preserva edições do admin quando KV não está configurado
 * 3. static JSON — fallback inicial (nunca sobrescreve localStorage)
 */
export async function loadCatalog(): Promise<Catalog> {
  // 1. Try API (KV — fonte de verdade quando disponível)
  try {
    const res = await fetch(API_URL);
    if (res.ok) {
      const data = await res.json();
      // Verifica se é dados reais do KV (não erro 404)
      if (data && !data.error && data.settings && data.categories && data.products && data.skinTones) {
        const catalog = data as Catalog;
        // Sync to localStorage como cache
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog)); } catch {}
        return catalog;
      }
    }
  } catch {
    // API not available, fall through
  }

  // 2. localStorage — preserva edições do admin (funciona sem KV)
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Catalog;
      if (parsed.settings && parsed.categories && parsed.products && parsed.skinTones) {
        return parsed;
      }
    }
  } catch {
    // corrupted, fall through
  }

  // 3. Fallback: static JSON (apenas inicialização, nunca sobrescreve localStorage)
  try {
    const res = await fetch(CATALOG_URL);
    if (res.ok) {
      const catalog = (await res.json()) as Catalog;
      if (catalog.settings && catalog.categories && catalog.products && catalog.skinTones) {
        const migrated = migrateOldFormat(catalog);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); } catch {}
        return migrated;
      }
    }
  } catch {
    // static JSON not available, give up
  }

  throw new Error('Não foi possível carregar o catálogo. Verifique sua conexão.');
}

/**
 * Migrate old format where skinTones had embedded products[] to new format.
 */
function migrateOldFormat(data: Record<string, unknown>): Catalog {
  const catalog = data as unknown as {
    settings: CatalogSettings;
    categories: Category[];
    skinTones: (SkinTone & { products?: unknown[] })[];
    products?: Product[];
  };

  // If already new format, return as-is
  if (catalog.products) return catalog as Catalog;

  // Migrate: extract products from skinTones into global products array
  const products: Product[] = [];
  const cleanSkinTones: SkinTone[] = catalog.skinTones.map((tone) => {
    const ids: string[] = [];
    if (Array.isArray(tone.products)) {
      for (const p of tone.products) {
        const prod = p as { name: string; category: string; link: string; image: string };
        const id = generateId();
        ids.push(id);
        products.push({
          id,
          name: prod.name || 'Produto sem nome',
          category: prod.category || 'base',
          link: prod.link || '',
          image: prod.image || '',
          skinToneIds: [tone.id],
        });
      }
    }
    const { products: _, ...cleanTone } = tone;
    return cleanTone as SkinTone;
  });

  return {
    settings: catalog.settings,
    categories: catalog.categories,
    products,
    skinTones: cleanSkinTones,
  };
}

/**
 * Save catalog: writes to API (project file) first, then caches in localStorage.
 */
export async function saveCatalog(catalog: Catalog): Promise<void> {
  // 1. Save via API (writes to project file — primary)
  try {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catalog),
    });
    if (res.ok) {
      // API save succeeded — also cache in localStorage
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog)); } catch {}
      return;
    }
  } catch {
    // API not available (production), fall through
  }

  // 2. Fallback: save to localStorage only
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
  } catch {
    throw new Error('Não foi possível salvar os dados.');
  }
}

/**
 * Export catalog as downloadable JSON file.
 */
export function exportCatalog(catalog: Catalog): void {
  const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `catalog_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import catalog from JSON file.
 */
export function importCatalog(file: File): Promise<Catalog> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const catalog = migrateOldFormat(data) as Catalog;
        resolve(catalog);
      } catch {
        reject(new Error('Erro ao ler o arquivo JSON.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
    reader.readAsText(file);
  });
}

/**
 * Reset catalog to the static JSON (discard localStorage).
 */
export async function resetCatalog(): Promise<Catalog> {
  localStorage.removeItem(STORAGE_KEY);
  return loadCatalog();
}

// ---- Authentication ----

export function verifyPassword(catalog: Catalog, password: string): boolean {
  return catalog.settings.password === password;
}

// ---- Settings CRUD ----

export function updateSettings(catalog: Catalog, updates: Partial<CatalogSettings>): Catalog {
  return { ...catalog, settings: { ...catalog.settings, ...updates } };
}

// ---- Category CRUD ----

export function addCategory(catalog: Catalog, category: Omit<Category, 'id'>): Catalog {
  return { ...catalog, categories: [...catalog.categories, { ...category, id: generateId() }] };
}

export function updateCategory(catalog: Catalog, id: string, updates: Partial<Omit<Category, 'id'>>): Catalog {
  return { ...catalog, categories: catalog.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)) };
}

export function deleteCategory(catalog: Catalog, id: string): Catalog {
  return { ...catalog, categories: catalog.categories.filter((c) => c.id !== id) };
}

// ---- SkinTone CRUD ----

export function addSkinTone(catalog: Catalog, skinTone: Omit<SkinTone, 'id'>): Catalog {
  return { ...catalog, skinTones: [...catalog.skinTones, { ...skinTone, id: generateId() }] };
}

export function updateSkinTone(catalog: Catalog, id: string, updates: Partial<Omit<SkinTone, 'id'>>): Catalog {
  return { ...catalog, skinTones: catalog.skinTones.map((t) => (t.id === id ? { ...t, ...updates } : t)) };
}

export function deleteSkinTone(catalog: Catalog, id: string): Catalog {
  // Also clean up product references
  return {
    ...catalog,
    skinTones: catalog.skinTones.filter((t) => t.id !== id),
    products: catalog.products.map((p) => ({
      ...p,
      skinToneIds: p.skinToneIds.filter((sid) => sid !== id),
    })),
  };
}

// ---- Product CRUD ----

export function addProduct(catalog: Catalog, product: Omit<Product, 'id'>): Catalog {
  const newProduct: Product = { ...product, id: generateId() };
  return { ...catalog, products: [...catalog.products, newProduct] };
}

export function updateProduct(catalog: Catalog, id: string, updates: Partial<Omit<Product, 'id'>>): Catalog {
  return {
    ...catalog,
    products: catalog.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
  };
}

export function deleteProduct(catalog: Catalog, id: string): Catalog {
  return { ...catalog, products: catalog.products.filter((p) => p.id !== id) };
}

/**
 * Toggle a skin tone ID on a product (add if missing, remove if present).
 */
export function toggleProductSkinTone(catalog: Catalog, productId: string, skinToneId: string): Catalog {
  return {
    ...catalog,
    products: catalog.products.map((p) => {
      if (p.id !== productId) return p;
      const has = p.skinToneIds.includes(skinToneId);
      return {
        ...p,
        skinToneIds: has ? p.skinToneIds.filter((s) => s !== skinToneId) : [...p.skinToneIds, skinToneId],
      };
    }),
  };
}

// ---- Lookup Helpers ----

/**
 * Find a skinTone by undertone + depth (used after face analysis).
 */
export function findMatchingSkinTone(catalog: Catalog, undertone: string, depth: string): SkinTone | null {
  return (
    catalog.skinTones.find(
      (t) =>
        t.undertone.toLowerCase() === undertone.toLowerCase() &&
        t.depth.toLowerCase() === depth.toLowerCase()
    ) ?? null
  );
}

/**
 * Get products for a specific skinTone, limited by displayLimit.
 */
export function getProductsForSkinTone(catalog: Catalog, skinToneId: string): Product[] {
  const limit = catalog.settings.displayLimit || 10;
  return catalog.products
    .filter((p) => p.skinToneIds.includes(skinToneId))
    .slice(0, limit);
}

/**
 * Get product count for a skin tone.
 */
export function getProductCountForSkinTone(catalog: Catalog, skinToneId: string): number {
  return catalog.products.filter((p) => p.skinToneIds.includes(skinToneId)).length;
}

/**
 * Get category name by ID.
 */
export function getCategoryName(catalog: Catalog, categoryId: string): string {
  return catalog.categories.find((c) => c.id === categoryId)?.name ?? categoryId;
}

/**
 * Get all product details.
 */
export function getProduct(catalog: Catalog, productId: string): Product | null {
  return catalog.products.find((p) => p.id === productId) ?? null;
}
