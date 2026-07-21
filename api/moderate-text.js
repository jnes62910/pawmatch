// api/moderate-text.js
// Vérifie qu'un message ou commentaire ne contient pas de contenu
// problématique (harcèlement, propos haineux, contenu explicite, arnaque,
// partage abusif de coordonnées, etc.) et bloque automatiquement si besoin.
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

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'text is required' });
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
            content:
              "Tu es un modérateur de contenu pour Miloute, une application de rencontre entre animaux (chats et chiens) " +
              "et de mise en relation entre leurs propriétaires. Analyse le message suivant, écrit par un utilisateur " +
              "dans un chat privé ou un commentaire public de l'application. " +
              "Réponds UNIQUEMENT avec un objet JSON, sans aucun texte autour, au format exact : " +
              '{"approved": true|false, "reason": "courte explication en français si refusé, sinon null"}. ' +
              "Refuse (approved: false) si le message contient : harcèlement, insultes, propos haineux ou discriminatoires, " +
              "menaces, contenu à caractère sexuel, sollicitation commerciale/spam, tentative d'arnaque, ou incitation à sortir " +
              "de l'application de façon suspecte. Accepte les messages normaux de conversation, même informels ou négatifs " +
              "sur un sujet neutre (ex: annuler un rendez-vous poliment).\n\n" +
              `Message à analyser : """${text}"""`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      // Panne du service : on laisse passer plutôt que de bloquer toute conversation.
      return res.status(200).json({ approved: true, reason: null });
    }

    const textBlock = (data.content || []).find((b) => b.type === 'text');
    let parsed;
    try {
      parsed = JSON.parse(extractJson(textBlock?.text));
    } catch (parseErr) {
      console.error('moderate-text: réponse non-JSON reçue de Claude :', textBlock?.text);
      return res.status(200).json({ approved: true, reason: null });
    }

    return res.status(200).json({
      approved: !!parsed.approved,
      reason: parsed.approved ? null : parsed.reason || 'Ce message enfreint les règles de Miloute.',
    });
  } catch (err) {
    console.error('moderate-text error:', err);
    return res.status(200).json({ approved: true, reason: null });
  }
};
