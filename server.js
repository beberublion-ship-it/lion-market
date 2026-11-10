const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const OpenAI = require('openai');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body || {};

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'Le message est vide.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY manquant. Ajoutez la clé dans le fichier .env.'
    });
  }

  try {
    const client = new OpenAI({ apiKey });

    const formattedHistory = history
      .filter((item) => item && typeof item.content === 'string')
      .map((item) => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.content
      }));

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es l’assistant virtuel de LION MARKET, un marketplace Camerounais. Aide les clients à trouver un produit, réponds aux questions sur les catégories, les prix et la commande. Reponds en français, concise et utile.'
        },
        ...formattedHistory,
        { role: 'user', content: String(message).trim() }
      ],
      temperature: 0.7
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    res.json({ reply: reply || 'Je peux vous aider à trouver un produit ou à passer commande.' });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({
      error: 'Impossible de traiter votre demande pour le moment. Vérifiez la clé API OpenAI.'
    });
  }
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Route introuvable.' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`LION MARKET est lancé sur http://localhost:${port}`);
});
