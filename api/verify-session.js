// api/verify-session.js
//
// Vérifie le paiement Premium au retour de Stripe Checkout, et active
// is_premium directement côté serveur — corrigé : auparavant, cette
// activation se faisait depuis le navigateur (setPremiumInDb appelé
// directement par le client), ce qui aurait permis en théorie à quelqu'un
// d'activer Premium sans jamais payer. Désormais, seul ce serveur décide.

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.status(200).json({ paid: false });
    }

    const meta = session.metadata;
    if (!meta?.profileId) {
      // Session plus ancienne, créée avant ce correctif : impossible de savoir
      // à qui l'attribuer côté serveur. On confirme le paiement sans activer
      // quoi que ce soit, plutôt que de deviner.
      return res.status(200).json({ paid: true, activated: false });
    }

    const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', meta.profileId).single();
    if (profile?.is_premium) {
      return res.status(200).json({ paid: true, activated: true, alreadyProcessed: true });
    }

    const { error: updateError } = await supabase
      .from('profiles').update({ is_premium: true }).eq('id', meta.profileId);
    if (updateError) throw updateError;

    return res.status(200).json({ paid: true, activated: true });
  } catch (err) {
    console.error('verify-session error:', err);
    return res.status(500).json({ error: err.message });
  }
};
