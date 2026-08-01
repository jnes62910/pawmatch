// api/create-checkout-session.js
//
// Crée la session Stripe Checkout pour l'abonnement Premium. Corrigé pour
// attacher l'identité de l'utilisateur (profileId, userId) dès la création
// du paiement — nécessaire pour que verify-session.js et le webhook de
// secours puissent savoir à qui attribuer le paiement, sans jamais dépendre
// du navigateur pour décider qui devient Premium.
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PLANS = {
  monthly: { label: 'Miloute Premium — Mensuel', amountCents: 499 },
  yearly:  { label: 'Miloute Premium — Annuel', amountCents: 3999 },
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
    const { plan, profileId, userId } = req.body;
    const planInfo = PLANS[plan];
    if (!planInfo) return res.status(400).json({ error: 'Plan inconnu' });
    if (!profileId || !userId) return res.status(400).json({ error: 'profileId and userId are required' });
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: planInfo.label },
          unit_amount: planInfo.amountCents,
        },
        quantity: 1,
      }],
      metadata: { type: 'premium', plan, profileId, userId },
      success_url: `${req.headers.origin}?premium=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}?premium=cancel`,
    });
    return res.status(200).json({ checkoutUrl: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return res.status(500).json({ error: err.message });
  }
};
