// ===================================================================
// VAY PERFUME — общий клиент Supabase.
// Подключается и на публичном сайте (js/script.js), и в админке
// (admin.html / js/admin.js). Требует supabase-config.js (URL + anon
// key) и supabase-js, загруженный тегом <script> ДО этого файла.
// ===================================================================

function isSupabaseConfigured() {
  return !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY);
}

let _sb = null;
function getSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (_sb) return _sb;
  if (!window.supabase || !window.supabase.createClient) {
    console.warn("supabase-js не загрузился (нет интернета или блокируется CDN).");
    return null;
  }
  _sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  return _sb;
}

// ---- преобразование строки БД <-> формат, который использует сайт ----
function dbRowToFragrance(row, idx) {
  return {
    id: row.id,
    gender: row.category === "her" ? "her" : row.category === "unisex" ? "unisex" : "him",
    brand: row.brand || "—",
    name: row.name,
    photo: row.image_url || null,
    feel: row.feel || "",
    notesTop: row.notes_top || "",
    notesHeart: row.notes_heart || "",
    notesBase: row.notes_base || "",
    volume: row.volume || "",
    price: row.price || "",
    oldPrice: row.old_price || "",
    character: row.character || "",
    type: row.type || "",
    inStock: row.in_stock !== false,
    order: row.sort_order != null ? row.sort_order : idx,
  };
}

function fragranceToDbRow(f) {
  return {
    id: f.id,
    name: f.name,
    brand: f.brand && f.brand !== "—" ? f.brand : "",
    category: f.gender === "her" ? "her" : f.gender === "unisex" ? "unisex" : "him",
    volume: f.volume || "",
    price: f.price || "",
    old_price: f.oldPrice || "",
    feel: f.feel || "",
    notes_top: f.notesTop || "",
    notes_heart: f.notesHeart || "",
    notes_base: f.notesBase || "",
    character: f.character || "",
    type: f.type || "",
    in_stock: f.inStock !== false,
    image_url: f.photo || "",
    sort_order: f.order || 0,
    is_visible: f.isVisible !== false,
  };
}

// ---- публичное чтение (используется на index.html) ----
async function fetchFragrancesFromSupabase() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("fragrances")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (error) { console.warn("Supabase: не удалось загрузить товары —", error.message); return null; }
  return data.map(dbRowToFragrance);
}

async function fetchReviewsFromSupabase() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("reviews")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (error) { console.warn("Supabase: не удалось загрузить отзывы —", error.message); return null; }
  return data.map(r => ({ id: r.id, image: r.image_url, alt: r.alt || "Отзыв клиента VAY PERFUME", visible: true, sortOrder: r.sort_order }));
}
