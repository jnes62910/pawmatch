// api/shop.js
//
// Regroupe les 3 actions de la boutique (achat de boosts/friandises à
// l'unité) dans une seule fonction serverless, pour rester sous la limite de
// 12 fonctions du plan Vercel Hobby. L'action voulue est précisée dans le
// corps de la requête via `action`.

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Catalogue de la boutique — jamais fait confiance à un prix envoyé par le
// navigateur, tout est défini ici côté serveur.
const PACKS = {
  boost_1:    { label: '1 Boost',       amountCents: 299, boosts: 1, treats: 0 },
  boost_5:    { label: '5 Boosts',      amountCents: 999, boosts: 5, treats: 0 },
  treats_10:  { label: '10 Friandises', amountCents: 199, boosts: 0, treats: 10 },
  treats_30:  { label: '30 Friandises', amountCents: 499, boosts: 0, treats: 30 },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body;

  try {
    // ── Créer la session de paiement ──────────────────────────────────────
    if (action === 'create-checkout') {
      const { packId, profileId, userId, successUrl, cancelUrl } = req.body;
      const pack = PACKS[packId];
      if (!pack) return res.status(400).json({ error: 'Pack inconnu' });
      if (!profileId || !userId) return res.status(400).json({ error: 'profileId and userId are required' });

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: { name: `Miloute — ${pack.label}` },
            unit_amount: pack.amountCents,
          },
          quantity: 1,
        }],
        metadata: { packId, profileId, userId },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return res.status(200).json({ checkoutUrl: session.url });
    }

    // ── Vérifier le paiement et créditer l'achat ──────────────────────────
    if (action === 'verify-session') {
      const { sessionId } = req.body;
      if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        return res.status(200).json({ paid: false });
      }

      // Idempotence : déjà traité ?
      const { data: existing } = await supabase
        .from('shop_purchases').select('*').eq('stripe_checkout_session_id', sessionId).maybeSingle();
      if (existing) {
        const { data: profile } = await supabase.from('profiles').select('boost_credits, treat_credits').eq('id', existing.profile_id).single();
        return res.status(200).json({ paid: true, alreadyProcessed: true, boostCredits: profile?.boost_credits, treatCredits: profile?.treat_credits });
      }

      const meta = session.metadata;
      const pack = PACKS[meta.packId];
      if (!pack) return res.status(400).json({ error: 'Pack inconnu' });

      const { data: profile, error: fetchError } = await supabase
        .from('profiles').select('boost_credits, treat_credits').eq('id', meta.profileId).single();
      if (fetchError) throw fetchError;

      const newBoostCredits = (profile.boost_credits || 0) + pack.boosts;
      const newTreatCredits = (profile.treat_credits || 0) + pack.treats;

      const { error: updateError } = await supabase
        .from('profiles').update({ boost_credits: newBoostCredits, treat_credits: newTreatCredits }).eq('id', meta.profileId);
      if (updateError) throw updateError;

      await supabase.from('shop_purchases').insert({
        user_id: meta.userId,
        profile_id: meta.profileId,
        pack_id: meta.packId,
        stripe_checkout_session_id: sessionId,
        amount_cents: pack.amountCents,
        credited_boosts: pack.boosts,
        credited_treats: pack.treats,
      });

      return res.status(200).json({ paid: true, boostCredits: newBoostCredits, treatCredits: newTreatCredits });
    }

    // ── Consommer un crédit (boost ou friandise) ──────────────────────────
    if (action === 'spend-credit') {
      const { profileId, userId, creditType } = req.body;
      if (!profileId || !userId || !['boost', 'treat'].includes(creditType)) {
        return res.status(400).json({ error: 'profileId, userId and a valid creditType are required' });
      }

      const column = creditType === 'boost' ? 'boost_credits' : 'treat_credits';

      const { data: profile, error: fetchError } = await supabase
        .from('profiles').select(`id, user_id, ${column}`).eq('id', profileId).single();
      if (fetchError || !profile) throw fetchError || new Error('Profil introuvable');
      if (profile.user_id !== userId) return res.status(403).json({ error: 'Ce profil ne vous appartient pas.' });

      const current = profile[column] || 0;
      if (current <= 0) return res.status(400).json({ error: 'Aucun crédit disponible.' });

      const { data: updated, error: updateError } = await supabase
        .from('profiles').update({ [column]: current - 1 }).eq('id', profileId).select(column).single();
      if (updateError) throw updateError;

      return res.status(200).json({ success: true, remaining: updated[column] });
    }

    return res.status(400).json({ error: 'Action inconnue' });
  } catch (err) {
    console.error('shop.js error:', err);
    return res.status(500).json({ error: err.message });
  }
};
