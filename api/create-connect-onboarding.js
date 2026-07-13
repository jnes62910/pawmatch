// api/create-connect-onboarding.js
//
// Crée (si besoin) un compte Stripe Connect Express pour un prestataire, puis
// renvoie un lien d'onboarding Stripe pour qu'il renseigne ses infos (identité,
// coordonnées bancaires) — nécessaire avant de pouvoir recevoir des paiements.
//
// Variables d'environnement requises : STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY
// (identiques à tes autres fonctions Stripe/Supabase)

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profileId, email, returnUrl, refreshUrl } = req.body;
    if (!profileId || !email) {
      return res.status(400).json({ error: 'profileId and email are required' });
    }

    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id')
      .eq('id', profileId)
      .single();
    if (fetchError) throw fetchError;

    let accountId = profile.stripe_connect_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await supabase.from('profiles').update({ stripe_connect_account_id: accountId }).eq('id', profileId);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (err) {
    console.error('create-connect-onboarding error:', err);
    return res.status(500).json({ error: err.message });
  }
};
