/**
 * Supabase REST client for Novedades N&L
 * Uses public anon key to fetch categories and products
 */

const SUPABASE_URL = 'https://wehscgjwcarditwoymut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Q_PziYnFZcUOio-YUCNzPA_257vcb1N';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

/**
 * Generic fetch wrapper
 */
async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase error ${res.status}: ${text || res.statusText}`);
  }

  // Handle empty responses
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return null;
}

/**
 * Fetch all categories
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function fetchCategories() {
  return supabaseFetch('categories?select=id,name&order=name.asc');
}

/**
 * Fetch products with optional filters
 * @param {Object} opts
 * @param {string} [opts.categoryId] - filter by category
 * @param {string} [opts.search] - search by name (ilike)
 * @param {boolean} [opts.inStockOnly=true]
 * @param {number} [opts.limit]
 * @param {string} [opts.orderBy='created_at.desc']
 * @returns {Promise<Array>}
 */
export async function fetchProducts({
  categoryId = null,
  search = '',
  inStockOnly = true,
  limit = null,
  orderBy = 'created_at.desc',
} = {}) {
  let query = 'products?select=id,category_id,name,brand,model,description,stock,sale_price,image_url,created_at,tags,units_per_package';

  const filters = [];

  if (inStockOnly) {
    filters.push('stock=gt.0');
  }

  if (categoryId) {
    filters.push(`category_id=eq.${encodeURIComponent(categoryId)}`);
  }

  if (search && search.trim()) {
    filters.push(`name=ilike.*${encodeURIComponent(search.trim())}*`);
  }

  if (filters.length) {
    query += '&' + filters.join('&');
  }

  query += `&order=${orderBy}`;

  if (limit) {
    query += `&limit=${limit}`;
  }

  return supabaseFetch(query);
}

/**
 * Fetch a single product by id
 */
export async function fetchProductById(id) {
  const rows = await supabaseFetch(
    `products?select=id,category_id,name,brand,model,description,stock,sale_price,image_url,created_at,tags,units_per_package&id=eq.${encodeURIComponent(id)}`
  );
  return rows?.[0] || null;
}
