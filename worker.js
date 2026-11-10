const DEFAULT_CATEGORY = new Set(["Téléphones", "Informatique", "Mode", "Maison", "Véhicules", "Beauté", "Services"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function product(row) {
  return {
    id: row.id, name: row.nom, price: Number(row.prix), category: row.categorie,
    city: row.ville || "", image: row.image_url || "", phone: row.telephone || "",
    description: row.description || "", created_at: row.created_at
  };
}

async function supabase(env, path, init = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Configuration Supabase manquante");
  }
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}`,
      "content-type": "application/json",
      ...(init.headers || {})
    }
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${body.slice(0, 300)}`);
  return body ? JSON.parse(body) : null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      try {
        await supabase(env, "annonces?select=id&limit=1");
        return json({ ok: true, name: "lion-market", database: "supabase" });
      } catch (error) {
        return json({ ok: false, error: "Base de données indisponible." }, 503);
      }
    }

    if (url.pathname === "/api/config" && request.method === "GET") {
      return json({ whatsappNumber: String(env.WHATSAPP_NUMBER || "237656342697").replace(/\D/g, "") });
    }

    if (url.pathname === "/api/products" && request.method === "GET") {
      try {
        const rows = await supabase(env, "annonces?select=id,nom,prix,categorie,ville,image_url,telephone,description,created_at&order=created_at.desc");
        return json({ products: (rows || []).map(product) });
      } catch (error) {
        return json({ error: "Impossible de charger les annonces." }, 500);
      }
    }

    if (url.pathname === "/api/products" && request.method === "POST") {
      try {
        const input = await request.json();
        const name = typeof input.name === "string" ? input.name.trim() : "";
        const city = typeof input.city === "string" ? input.city.trim() : "";
        const category = typeof input.category === "string" ? input.category.trim() : "";
        const price = Number(input.price);
        const phone = String(input.phone || env.WHATSAPP_NUMBER || "").replace(/\D/g, "");
        if (!name || name.length > 100 || !city || city.length > 80 || !DEFAULT_CATEGORY.has(category)) {
          return json({ error: "Vérifiez le nom, la ville et la catégorie." }, 400);
        }
        if (!Number.isSafeInteger(price) || price < 1 || price > 1000000000) {
          return json({ error: "Le prix doit être un nombre entier positif." }, 400);
        }
        if (!/^\d{9,15}$/.test(phone)) return json({ error: "Numéro WhatsApp invalide." }, 400);
        let image = "";
        if (input.image) {
          try {
            const parsed = new URL(String(input.image));
            if (parsed.protocol !== "https:") throw new Error();
            image = parsed.toString();
          } catch {
            return json({ error: "Le lien de la photo doit être une URL HTTPS valide." }, 400);
          }
        }
        const rows = await supabase(env, "annonces?select=id,nom,prix,categorie,ville,image_url,telephone,description,created_at", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            nom: name, prix: price, categorie: category, ville: city,
            image_url: image || "https://placehold.co/600x400?text=Lion+Market",
            telephone: phone,
            description: typeof input.description === "string" ? input.description.trim().slice(0, 1000) : ""
          })
        });
        return json({ product: product(rows[0]) }, 201);
      } catch (error) {
        return json({ error: "Impossible d’enregistrer l’annonce. Vérifiez les droits Supabase." }, 500);
      }
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const input = await request.json();
        const message = typeof input.message === "string" ? input.message.trim().slice(0, 2000) : "";
        if (!message) return json({ error: "Le message est vide." }, 400);
        const rows = await supabase(env, "annonces?select=nom,prix,categorie,ville,description&order=created_at.desc&limit=100");
        const q = message.toLocaleLowerCase("fr");
        const matches = (rows || []).filter(p => `${p.nom} ${p.categorie} ${p.ville} ${p.description || ""}`.toLocaleLowerCase("fr").includes(q));
        let reply = matches.length
          ? `J’ai trouvé : ${matches.slice(0, 3).map(p => `${p.nom} (${Number(p.prix).toLocaleString("fr-FR")} FCFA, ${p.ville})`).join(" ; ")}.`
          : "Je peux vous aider à chercher un produit ou une catégorie. Essayez « téléphone », « mode » ou le nom d’une ville.";
        if (!matches.length && /commande|acheter|whatsapp|livraison/.test(q)) {
          reply = "Choisissez une annonce et contactez le vendeur sur WhatsApp. Le paiement et la livraison se règlent directement avec lui.";
        }
        return json({ reply, source: "local" });
      } catch (error) {
        return json({ reply: "L’assistant est momentanément indisponible.", source: "local" }, 200);
      }
    }

    if (url.pathname.startsWith("/api/")) return json({ error: "Route introuvable." }, 404);
    return env.ASSETS.fetch(request);
  }
};
