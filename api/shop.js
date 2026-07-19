// api/shop.js
//
// Boutique Miloute — vrai catalogue de cadeaux individuels (nourriture +
// cadeaux), chacun avec son propre prix et son propre stock
// (profiles.gift_inventory). Regroupé en une seule fonction serverless pour
// rester sous la limite de 12 fonctions du plan Vercel Hobby. L'action
// voulue est précisée dans le corps de la requête via `action`.
//
// Le Boost de visibilité a été retiré pour l'instant (pas assez d'utilisateurs
// pour que ça ait un sens) — à réintroduire plus tard si besoin.

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Vrai catalogue de cadeaux — chacun a son propre prix et sa propre identité,
// stocké individuellement dans profiles.gift_inventory (ex: {"bone": 3}).
const GIFT_CATALOG = {
  bone:    { label: 'Os doré',            emoji: '🦴', amountCents: 99 },
  chicken: { label: 'Poulet rôti',        emoji: '🍗', amountCents: 119 },
  steak:   { label: 'Steak XXL',          emoji: '🥩', amountCents: 229 },
  bacon:   { label: 'Bacon',              emoji: '🥓', amountCents: 109 },
  fish:    { label: 'Poisson premium',    emoji: '🐟', amountCents: 99 },
  cheese:  { label: 'Fromage',            emoji: '🧀', amountCents: 89 },
  shrimp:  { label: 'Crevette',          emoji: '🍤', amountCents: 179 },
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
    // ── Créer la session de paiement pour un cadeau précis ────────────────
    if (action === 'create-checkout') {
      const { itemId, profileId, userId, successUrl, cancelUrl } = req.body;
      const item = GIFT_CATALOG[itemId];
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
        metadata: { itemId, profileId, userId },
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
        const { data: profile } = await supabase.from('profiles').select('gift_inventory').eq('id', existing.profile_id).single();
        return res.status(200).json({ paid: true, alreadyProcessed: true, giftInventory: profile?.gift_inventory, itemId: existing.pack_id });
      }

      const meta = session.metadata;
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

      return res.status(200).json({ paid: true, giftInventory: newInventory, itemId: meta.itemId });
    }

    // ── Consommer un cadeau précis de l'inventaire ─────────────────────────
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
