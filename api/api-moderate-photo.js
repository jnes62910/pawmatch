// /api/moderate-photo.js
//
// Vérifie qu'une image (photo ou frame de vidéo) montre bien un chat ou un
// chien, et que le contenu est approprié. Utilise l'API Claude (vision).
//
// Variable d'environnement requise sur Vercel : ANTHROPIC_API_KEY

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { image, mimeType } = req.body || {};
  if (!image) {
    return res.status(400).json({ error: "Image manquante" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mimeType || "image/jpeg", data: image },
              },
              {
                type: "text",
                text:
                  "Tu es un modérateur de contenu pour une application de rencontre entre animaux (Miloute). " +
                  "Réponds UNIQUEMENT avec un objet JSON, sans aucun texte autour, au format exact : " +
                  '{"is_cat_or_dog": true|false, "is_appropriate": true|false, "reason": "courte explication en français si refusé, sinon null"}. ' +
                  "is_cat_or_dog : l'image montre-t-elle clairement un chat ou un chien (le sujet principal) ? " +
                  "is_appropriate : l'image est-elle dépourvue de contenu choquant, violent, sexuel, ou non lié aux animaux (personnes, objets sans rapport, texte publicitaire, etc.) ?",
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const textBlock = (data.content || []).find(b => b.type === "text");
    let parsed;
    try {
      parsed = JSON.parse((textBlock?.text || "{}").trim());
    } catch {
      // Si le modèle n'a pas renvoyé un JSON strict, on refuse par prudence.
      return res.status(200).json({ approved: false, reason: "Vérification impossible, réessayez." });
    }

    const approved = !!parsed.is_cat_or_dog && !!parsed.is_appropriate;
    return res.status(200).json({
      approved,
      reason: approved
        ? null
        : parsed.reason || "Seules les photos de chats et chiens, au contenu approprié, sont autorisées.",
    });
  } catch (err) {
    console.error("moderate-photo error:", err);
    return res.status(500).json({ approved: false, reason: "Erreur du service de vérification." });
  }
}
