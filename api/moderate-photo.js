// api/moderate-photo.js
// Vérifie qu'une image (photo ou frame de vidéo) est appropriée. Utilise
// l'API Claude (vision). Le paramètre `context` adapte les règles :
// - "pet" (par défaut) : exige un chat ou un chien clairement visible —
//   utilisé pour les photos de profil d'un animal.
// - "prestataire" : n'exige pas d'animal (salon, équipements, photo de
//   l'équipe...), vérifie uniquement que le contenu est approprié.
// Variable d'environnement requise sur Vercel : ANTHROPIC_API_KEY
// Certains modèles habillent parfois leur réponse de balises ```json ... ```
// ou d'un court commentaire malgré la consigne stricte — on nettoie avant
// de tenter le JSON.parse, plutôt que d'échouer sur ce détail de mise en forme.
function extractJson(rawText) {
  const text = (rawText || '').trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];
  return text;
}

function promptFor(context) {
  if (context === 'prestataire') {
    return (
      "Tu es un modérateur de contenu pour Miloute, une application avec un annuaire de prestataires " +
      "indépendants pour animaux (toiletteurs, pet-sitters, éducateurs canins...). Cette image est destinée à la " +
      "galerie photo d'un profil prestataire (salon, équipements, animaux déjà toilettés, photo de l'équipe, " +
      "SELFIE OU PHOTO PERSONNELLE du prestataire lui-même...) — elle n'a PAS besoin de montrer un chat ou un " +
      "chien pour être acceptée, et une photo montrant clairement le visage d'une seule personne (un selfie du " +
      "prestataire par exemple) est un cas tout à fait normal et attendu, à ne JAMAIS refuser pour cette seule raison. " +
      "Réponds UNIQUEMENT avec un objet JSON, sans aucun texte autour, sans balises markdown, au format exact : " +
      '{"is_appropriate": true|false, "reason": "courte explication en français si refusé, sinon null"}. ' +
      "is_appropriate : l'image est-elle dépourvue de contenu choquant, violent, sexuel, ou manifestement sans " +
      "rapport avec une activité professionnelle liée aux animaux ?"
    );
  }
  return (
    "Tu es un modérateur de contenu pour une application de rencontre entre animaux (Miloute). " +
    "Réponds UNIQUEMENT avec un objet JSON, sans aucun texte autour, sans balises markdown, au format exact : " +
    '{"is_cat_or_dog": true|false, "is_appropriate": true|false, "reason": "courte explication en français si refusé, sinon null"}. ' +
    "is_cat_or_dog : l'image montre-t-elle clairement un chat ou un chien (le sujet principal) ? " +
    "is_appropriate : l'image est-elle dépourvue de contenu choquant, violent, sexuel, ou non lié aux animaux (personnes, objets sans rapport, texte publicitaire, etc.) ?"
  );
}

module.exports = async (req, res) => {
  // Autorise les appels depuis l'app Android native (origine "https://localhost",
  // différente du site web) — sans ça, le navigateur/WebView bloque la requête
  // avant même qu'elle n'atteigne ce code (erreur CORS).
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Requête de vérification envoyée automatiquement par le navigateur avant
  // la vraie requête POST — il faut y répondre correctement (200, avec les
  // en-têtes ci-dessus) pour que la vraie requête soit ensuite autorisée.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { image, mimeType, context } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'image is required' });
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: image },
              },
              {
                type: 'text',
                text: promptFor(context),
              },
            ],
          },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(200).json({ approved: false, reason: 'Vérification indisponible, réessayez.' });
    }
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    let parsed;
    try {
      parsed = JSON.parse(extractJson(textBlock?.text));
    } catch (parseErr) {
      // On journalise le texte brut reçu pour pouvoir diagnostiquer facilement
      // si ce cas se reproduit, plutôt qu'un échec silencieux.
      console.error('moderate-photo: réponse non-JSON reçue de Claude :', textBlock?.text);
      return res.status(200).json({ approved: false, reason: 'Vérification impossible, réessayez.' });
    }
    const approved = context === 'prestataire'
      ? !!parsed.is_appropriate
      : !!parsed.is_cat_or_dog && !!parsed.is_appropriate;
    return res.status(200).json({
      approved,
      reason: approved
        ? null
        : parsed.reason || (context === 'prestataire'
          ? 'Cette photo ne respecte pas les règles de Miloute.'
          : 'Seules les photos de chats et chiens, au contenu approprié, sont autorisées.'),
    });
  } catch (err) {
    console.error('moderate-photo error:', err);
    return res.status(500).json({ approved: false, reason: 'Erreur du service de vérification.' });
  }
};
