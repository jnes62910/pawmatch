// api/moderate-text.js
// Vérifie qu'un message ou commentaire ne contient pas de contenu
// problématique (harcèlement, propos haineux, contenu explicite, arnaque,
// partage abusif de coordonnées, etc.) et bloque automatiquement si besoin.
// Le paramètre `context` adapte les règles : par défaut ("chat"), le texte
// est un message entre utilisateurs, où la sollicitation commerciale est
// interdite. En contexte "service_description" (description d'une
// prestation dans l'espace prestataire), la promotion commerciale est au
// contraire normale et attendue — seules les vraies dérives restent bloquées.
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

const PROMPTS = {
  chat:
    "Tu es un modérateur de contenu pour Miloute, une application de rencontre entre animaux (chats et chiens) " +
    "et de mise en relation entre leurs propriétaires. Analyse le message suivant, écrit par un utilisateur " +
    "dans un chat privé ou un commentaire public de l'application. " +
    "Réponds UNIQUEMENT avec un objet JSON, sans aucun texte autour, au format exact : " +
    '{"approved": true|false, "reason": "courte explication en français si refusé, sinon null"}. ' +
    "Refuse (approved: false) si le message contient : harcèlement, insultes, propos haineux ou discriminatoires, " +
    "menaces, contenu à caractère sexuel, sollicitation commerciale/spam, tentative d'arnaque, ou incitation à sortir " +
    "de l'application de façon suspecte. Accepte les messages normaux de conversation, même informels ou négatifs " +
    "sur un sujet neutre (ex: annuler un rendez-vous poliment).",
  service_description:
    "Tu es un modérateur de contenu pour Miloute, une application qui héberge aussi un annuaire de prestataires " +
    "indépendants pour animaux (toiletteurs, pet-sitters, éducateurs canins, vétérinaires...). Analyse le texte " +
    "suivant, qui est la DESCRIPTION D'UNE PRESTATION rédigée par un prestataire pour présenter son service aux " +
    "clients potentiels — ce texte est un texte commercial par nature (présenter et vendre un service), donc la " +
    "promotion commerciale, les mentions de tarifs, d'expérience professionnelle ou d'arguments de vente sont " +
    "totalement normales et NE DOIVENT PAS être refusées à ce titre. De nombreuses prestations pour animaux se " +
    "déroulent normalement AU DOMICILE du client (toilettage à domicile, garde d'animaux à domicile, visites à " +
    "domicile, déplacement chez le client...) : ceci est un modèle de service parfaitement légitime et courant " +
    "dans ce secteur, PAS une tentative de sortir de l'application — ne le refuse jamais à ce seul titre. " +
    "Réponds UNIQUEMENT avec un objet JSON, sans aucun texte autour, au format exact : " +
    '{"approved": true|false, "reason": "courte explication en français si refusé, sinon null"}. ' +
    "Refuse (approved: false) uniquement si le texte contient : propos haineux ou discriminatoires, contenu à " +
    "caractère sexuel, une incitation à CONTACTER le prestataire ou à PAYER en dehors de l'application (numéro de " +
    "téléphone, email, réseau social, lien externe, virement direct — la simple mention d'un service rendu au " +
    "domicile du client n'entre pas dans ce cas), promesses manifestement mensongères ou dangereuses, ou tout " +
    "contenu sans rapport avec un service pour animaux.",
};

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
    const { text, context } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'text is required' });
    }
    const systemPrompt = PROMPTS[context] || PROMPTS.chat;
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
            content: `${systemPrompt}\n\nTexte à analyser : """${text}"""`,
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
