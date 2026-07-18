// api/check-connect-status.js
//
// Appelée au retour de l'onboarding Stripe Connect (return_url), pour vérifier
// si le prestataire a bien terminé les étapes nécessaires pour recevoir des
// paiements, et mettre à jour son profil en conséquence.

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
    const { profileId } = req.body;
    if (!profileId) return res.status(400).json({ error: 'profileId is required' });

    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id')
      .eq('id', profileId)
      .single();
    if (fetchError) throw fetchError;
    if (!profile.stripe_connect_account_id) {
      return res.status(200).json({ onboarded: false });
    }

    const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
    const onboarded = !!(account.charges_enabled && account.payouts_enabled);

    await supabase.from('profiles').update({ stripe_connect_onboarded: onboarded }).eq('id', profileId);

    return res.status(200).json({ onboarded });
  } catch (err) {
    console.error('check-connect-status error:', err);
    return res.status(500).json({ error: err.message });
  }
};
