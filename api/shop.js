// api/shop.js
//
// Regroupe les actions de la boutique (boosts + vrai catalogue de cadeaux
// individuels) dans une seule fonction serverless, pour rester sous la
// limite de 12 fonctions du plan Vercel Hobby. L'action voulue est précisée
// dans le corps de la requête via `action`.

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Boosts — restent un simple crédit générique (pas d'identité visuelle à choisir).
const BOOST_PACKS = {
  boost_1: { label: '1 Boost',  amountCents: 299, boosts: 1 },
  boost_5: { label: '5 Boosts', amountCents: 999, boosts: 5 },
};

// Vrai catalogue de cadeaux — chacun a son propre prix et sa propre identité,
// stocké individuellement dans profiles.gift_inventory (ex: {"bone": 3}).
const GIFT_CATALOG = {
  bone:    { label: 'Os doré',            emoji: '🦴', amountCents: 99 },
  chicken: { label: 'Poulet rôti',        emoji: '🍗', amountCents: 119 },
  steak:   { label: 'Steak XXL',          emoji: '🥩', amountCents: 229 },
  bacon:   { label: 'Bacon',              emoji: '🥓', amountCents: 109 },
  fish:    { label: 'Poisson premium',    emoji: '🐟', amountCents: 99 },
  cheese:  { label: 'Fromage',            emoji: '🧀', amountCents: 89 },
  shrimp:  { label: 'Crevettes',          emoji: '🍤', amountCents: 179 },
  milk:    { label: 'Bol de lait',        emoji: '🥛', amountCents: 89 },
  tennisball: { label: 'Balle de tennis', emoji: '🎾', amountCents: 129 },
  frisbee:    { label: 'Frisbee',         emoji: '🥏', amountCents: 179 },
  yarn:       { label: 'Pelote de laine', emoji: '🧶', amountCents: 119 },
  mouse:      { label: 'Souris en peluche', emoji: '🐭', amountCents: 139 },
  bouquet: { label: 'Bouquet de fleurs',  emoji: '💐', amountCents: 149 },
  crown:   { label: 'Couronne royale',    emoji: '👑', amountCents: 249 },
  ribbon:  { label: 'Ruban élégant',      emoji: '🎀', amountCents: 129 },
  cake:    { label: "Gâteau d'anniversaire", emoji: '🎂', amountCents: 199 },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body;

  try {
    // ── Créer la session de paiement (boost ou cadeau précis) ─────────────
    if (action === 'create-checkout') {
      const { itemId, itemType, profileId, userId, successUrl, cancelUrl } = req.body;
      const catalog = itemType === 'boost' ? BOOST_PACKS : GIFT_CATALOG;
      const item = catalog[itemId];
      if (!item) return res.status(400).json({ error: 'Article inconnu' });
      if (!profileId || !userId) return res.status(400).json({ error: 'profileId and userId are required' });

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: { name: `Miloute — ${item.label}` },
            unit_amount: item.amountCents,
          },
          quantity: 1,
        }],
        metadata: { itemId, itemType, profileId, userId },
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
        const { data: profile } = await supabase.from('profiles').select('boost_credits, gift_inventory').eq('id', existing.profile_id).single();
        return res.status(200).json({ paid: true, alreadyProcessed: true, boostCredits: profile?.boost_credits, giftInventory: profile?.gift_inventory });
      }

      const meta = session.metadata;

      if (meta.itemType === 'boost') {
        const pack = BOOST_PACKS[meta.itemId];
        if (!pack) return res.status(400).json({ error: 'Article inconnu' });

        const { data: profile, error: fetchError } = await supabase
          .from('profiles').select('boost_credits').eq('id', meta.profileId).single();
        if (fetchError) throw fetchError;

        const newBoostCredits = (profile.boost_credits || 0) + pack.boosts;
        const { error: updateError } = await supabase
          .from('profiles').update({ boost_credits: newBoostCredits }).eq('id', meta.profileId);
        if (updateError) throw updateError;

        await supabase.from('shop_purchases').insert({
          user_id: meta.userId, profile_id: meta.profileId, pack_id: meta.itemId,
          stripe_checkout_session_id: sessionId, amount_cents: pack.amountCents, credited_boosts: pack.boosts,
        });

        return res.status(200).json({ paid: true, boostCredits: newBoostCredits });
      } else {
        const gift = GIFT_CATALOG[meta.itemId];
        if (!gift) return res.status(400).json({ error: 'Article inconnu' });

        const { data: profile, error: fetchError } = await supabase
          .from('profiles').select('gift_inventory').eq('id', meta.profileId).single();
        if (fetchError) throw fetchError;

        const inventory = profile.gift_inventory || {};
        const newInventory = { ...inventory, [meta.itemId]: (inventory[meta.itemId] || 0) + 1 };

        const { error: updateError } = await supabase
          .from('profiles').update({ gift_inventory: newInventory }).eq('id', meta.profileId);
        if (updateError) throw updateError;

        await supabase.from('shop_purchases').insert({
          user_id: meta.userId, profile_id: meta.profileId, pack_id: meta.itemId,
          stripe_checkout_session_id: sessionId, amount_cents: gift.amountCents, credited_treats: 1,
        });

        return res.status(200).json({ paid: true, giftInventory: newInventory });
      }
    }

    // ── Consommer un crédit (boost) ou un cadeau précis de l'inventaire ───
    if (action === 'spend-credit') {
      const { profileId, userId, creditType } = req.body;
      if (!profileId || !userId || creditType !== 'boost') {
        return res.status(400).json({ error: 'profileId, userId and creditType=boost are required' });
      }

      const { data: profile, error: fetchError } = await supabase
        .from('profiles').select('id, user_id, boost_credits').eq('id', profileId).single();
      if (fetchError || !profile) throw fetchError || new Error('Profil introuvable');
      if (profile.user_id !== userId) return res.status(403).json({ error: 'Ce profil ne vous appartient pas.' });

      const current = profile.boost_credits || 0;
      if (current <= 0) return res.status(400).json({ error: 'Aucun crédit disponible.' });

      const { data: updated, error: updateError } = await supabase
        .from('profiles').update({ boost_credits: current - 1 }).eq('id', profileId).select('boost_credits').single();
      if (updateError) throw updateError;

      return res.status(200).json({ success: true, remaining: updated.boost_credits });
    }

    if (action === 'spend-gift') {
      const { profileId, userId, giftId } = req.body;
      if (!profileId || !userId || !GIFT_CATALOG[giftId]) {
        return res.status(400).json({ error: 'profileId, userId and a valid giftId are required' });
      }

      const { data: profile, error: fetchError } = await supabase
        .from('profiles').select('id, user_id, gift_inventory').eq('id', profileId).single();
      if (fetchError || !profile) throw fetchError || new Error('Profil introuvable');
      if (profile.user_id !== userId) return res.status(403).json({ error: 'Ce profil ne vous appartient pas.' });

      const inventory = profile.gift_inventory || {};
      const current = inventory[giftId] || 0;
      if (current <= 0) return res.status(400).json({ error: "Vous n'avez plus ce cadeau en stock." });

      const newInventory = { ...inventory, [giftId]: current - 1 };
      const { error: updateError } = await supabase
        .from('profiles').update({ gift_inventory: newInventory }).eq('id', profileId);
      if (updateError) throw updateError;

      return res.status(200).json({ success: true, giftInventory: newInventory });
    }

    return res.status(400).json({ error: 'Action inconnue' });
  } catch (err) {
    console.error('shop.js error:', err);
    return res.status(500).json({ error: err.message });
  }
};
