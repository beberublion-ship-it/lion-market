const { createClient } = require('@supabase/supabase-js');

let client;

function getClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL et SUPABASE_PUBLISHABLE_KEY doivent être configurés.');
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  return client;
}

const columns = 'id, nom, prix, categorie, ville, image_url, telephone, description, created_at';

function normalizeProduct(row) {
  return {
    id: row.id,
    name: row.nom,
    price: Number(row.prix),
    category: row.categorie,
    city: row.ville || '',
    image: row.image_url || '',
    phone: row.telephone || '',
    description: row.description || '',
    created_at: row.created_at
  };
}

async function initDatabase() {
  const { error } = await getClient().from('annonces').select('id').limit(1);
  if (error) throw new Error(`Connexion Supabase impossible : ${error.message}`);
}

async function getProducts() {
  const { data, error } = await getClient()
    .from('annonces')
    .select(columns)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeProduct);
}

async function addProduct(product) {
  const { data, error } = await getClient()
    .from('annonces')
    .insert({
      nom: product.name,
      prix: product.price,
      categorie: product.category,
      ville: product.city,
      image_url: product.image || null,
      telephone: product.phone,
      description: product.description || ''
    })
    .select(columns)
    .single();

  if (error) throw error;
  return normalizeProduct(data);
}

module.exports = { initDatabase, getProducts, addProduct };
