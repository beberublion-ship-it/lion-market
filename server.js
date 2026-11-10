const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const { initDatabase, getProducts, addProduct } = require('./database');

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const shopWhatsApp = String(process.env.WHATSAPP_NUMBER || '237656342697').replace(/\D/g, '');
const categories = new Set(['Téléphones', 'Informatique', 'Mode', 'Maison', 'Véhicules', 'Transport', 'Beauté', 'Services']);

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/health', async (req, res) => {
  try {
    await getProducts();
    res.json({ ok: true, name: 'lion-market', database: 'supabase' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ ok: false, error: 'Base de données indisponible.' });
  }
});

app.get('/api/config', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ whatsappNumber: shopWhatsApp });
});

app.get('/api/products', async (req, res) => {
  try {
    res.json({ products: await getProducts() });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Impossible de charger les annonces.' });
  }
});

app.post('/api/products', async (req, res) => {
  const { name, price, category, city, image, phone, description } = req.body || {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanCity = typeof city === 'string' ? city.trim() : '';
  const cleanCategory = typeof category === 'string' ? category.trim() : '';
  const amount = Number(price);
  const sellerPhone = String(phone || shopWhatsApp).replace(/\D/g, '');

  if (!cleanName || cleanName.length > 100 || !cleanCity || cleanCity.length > 80 || !categories.has(cleanCategory)) {
    return res.status(400).json({ error: 'Vérifiez le nom, la ville et la catégorie.' });
  }
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000000) {
    return res.status(400).json({ error: 'Le prix doit être un nombre entier positif.' });
  }
  if (!/^\d{9,15}$/.test(sellerPhone)) {
    return res.status(400).json({ error: 'Le numéro WhatsApp doit contenir entre 9 et 15 chiffres.' });
  }

  let cleanImage = '';
  if (image) {
    try {
      const parsed = new URL(String(image));
      if (parsed.protocol !== 'https:') throw new Error('Invalid protocol');
      cleanImage = parsed.toString();
    } catch {
      return res.status(400).json({ error: 'Le lien de la photo doit être une URL HTTPS valide.' });
    }
  }

  try {
    const product = await addProduct({
      name: cleanName,
      price: amount,
      category: cleanCategory,
      city: cleanCity,
      image: cleanImage || 'https://placehold.co/600x400?text=Lion+Market',
      phone: sellerPhone,
      description: typeof description === 'string' ? description.trim().slice(0, 1000) : ''
    });
    res.status(201).json({ product });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: 'Impossible d’enregistrer l’annonce.' });
  }
});

function localReply(message, products) {
  const text = message.toLocaleLowerCase('fr');
  const matches = products.filter((p) => `${p.name} ${p.category} ${p.city} ${p.description}`.toLocaleLowerCase('fr').includes(text));
  if (matches.length) return `J’ai trouvé : ${matches.slice(0, 3).map((p) => `${p.name} (${Number(p.price).toLocaleString('fr-FR')} FCFA, ${p.city})`).join(' ; ')}.`;
  if (/commande|acheter|whatsapp|livraison/.test(text)) return 'Choisissez une annonce et contactez le vendeur sur WhatsApp. Le paiement et la livraison se règlent directement avec lui.';
  if (/prix|combien|coût|tarif/.test(text)) return 'Les prix affichés sont en FCFA. Utilisez la recherche ou les catégories pour trouver une annonce.';
  return 'Je peux vous aider à chercher un produit ou une catégorie. Essayez par exemple « téléphone », « mode » ou le nom d’une ville.';
}

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body || {};
  const cleanMessage = typeof message === 'string' ? message.trim().slice(0, 2000) : '';
  if (!cleanMessage) return res.status(400).json({ error: 'Le message est vide.' });

  let products = [];
  try { products = await getProducts(); } catch (error) { console.error('Chat catalog error:', error); }
  const fallback = localReply(cleanMessage, products);
  if (!process.env.OPENAI_API_KEY) return res.json({ reply: fallback, source: 'local' });

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const safeHistory = Array.isArray(history) ? history.slice(-8).filter((item) => item && typeof item.content === 'string').map((item) => ({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: item.content.slice(0, 1000)
    })) : [];
    const catalogText = products.slice(0, 30).map((p) => `${p.name} | ${p.category} | ${p.city} | ${p.price} FCFA`).join('\n');
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `Tu es l’assistant de LION MARKET au Cameroun. Réponds en français et ne prétends pas connaître des informations absentes du catalogue. Les annonces visibles :\n${catalogText}` },
        ...safeHistory,
        { role: 'user', content: cleanMessage }
      ],
      temperature: 0.5,
      max_tokens: 300
    });
    res.json({ reply: completion.choices?.[0]?.message?.content?.trim() || fallback, source: 'openai' });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.json({ reply: fallback, source: 'local' });
  }
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Route introuvable.' });
  res.sendFile(path.join(__dirname, 'index.html'));
});

async function start() {
  await initDatabase();
  app.listen(port, '0.0.0.0', () => console.log(`LION MARKET écoute sur le port ${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Démarrage impossible :', error);
    process.exit(1);
  });
}

module.exports = { app, start };
