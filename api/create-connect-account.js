// api/create-connect-account.js
// Crée un compte Stripe Connect Express pour un éleveur/prestataire,
// puis génère un lien d'onboarding (formulaire Stripe hébergé).
//
// Appelé depuis l'app quand l'utilisateur clique "Activer les paiements".

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, petId, returnUrl, refreshUrl } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    // 1. Créer le compte connecté Express
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: { petId: petId || '' },
    });

    // 2. Générer le lien d'onboarding (formulaire Stripe hébergé — pièce d'identité, IBAN...)
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl || 'https://jnes62910-pawmatch.vercel.app/onboarding-refresh',
      return_url: returnUrl || 'https://jnes62910-pawmatch.vercel.app/onboarding-success',
      type: 'account_onboarding',
    });

    return res.status(200).json({
      accountId: account.id,
      onboardingUrl: accountLink.url,
    });
  } catch (err) {
    console.error('Stripe Connect error:', err);
    return res.status(500).json({ error: err.message });
  }
};

