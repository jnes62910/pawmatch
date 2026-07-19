// api/shop.js
//
// Boutique Miloute — vrai catalogue de cadeaux individuels (nourriture +
// cadeaux + confort), chacun avec son propre prix et son propre stock
// (profiles.gift_inventory), plus quelques packs groupés à prix réduit.
// Regroupé en une seule fonction serverless pour rester sous la limite de 12
// fonctions du plan Vercel Hobby. L'action voulue est précisée dans le corps
// de la requête via `action`.
//
// Le Boost de visibilité a été retiré pour l'instant (pas assez d'utilisateurs
// pour que ça ait un sens) — à réintroduire plus tard si besoin.
// Pas de monnaie virtuelle intermédiaire (type "Milouttes") : achat direct en
// euros, choix assumé pour rester simple et transparent.

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
  bone:     { label: 'Os Miloute',        emoji: '🦴', amountCents: 99 },
  chicken:  { label: 'Cuisse Dorée',      emoji: '🍗', amountCents: 199 },
  steak:    { label: 'Steak Câlin',       emoji: '🥩', amountCents: 299 },
  bacon:    { label: 'Bacon Croustillant', emoji: '🥓', amountCents: 199 },
  meatbone: { label: 'Viande Tendresse',  emoji: '🍖', amountCents: 199 },
  fish:     { label: 'Poisson Miloute',   emoji: '🐟', amountCents: 99 },
  tunapate: { label: 'Pâtée Câline',      emoji: '🥫', amountCents: 99 },
  sushi:    { label: "Sushi d'Amour",     emoji: '🍣', amountCents: 199 },
  shrimp:   { label: 'Crevette Coquine',  emoji: '🍤', amountCents: 199 },
  milk:     { label: 'Lait Doux Miloute', emoji: '🥛', amountCents: 99 },
  mixpate:  { label: 'Pâtée Surprise',    emoji: '🥫', amountCents: 99 },
  tennisball: { label: 'Balle Rebelle',   emoji: '🥎', amountCents: 199 },
  frisbee:    { label: 'Frisbee Fou',     emoji: '🥏', amountCents: 199 },
  yarn:       { label: 'Pelote Magique',  emoji: '🧶', amountCents: 199 },
  mouse:      { label: 'Souris Fuyante',  emoji: '🐭', amountCents: 199 },
  bouquet: { label: 'Bouquet des Amoureux', emoji: '💐', amountCents: 199 },
  crown:   { label: 'Couronne Miloute',   emoji: '👑', amountCents: 299 },
  ribbon:  { label: 'Ruban Chic',         emoji: '🎀', amountCents: 199 },
  cake:    { label: 'Gâteau Fiesta',      emoji: '🎂', amountCents: 199 },
  bed:      { label: 'Panier Douillet',   emoji: '☁️', amountCents: 199 },
  doghouse: { label: 'Niche Royale',      emoji: '🏠', amountCents: 299 },
  cattree:  { label: 'Arbre Royal',       emoji: '🌳', amountCents: 299 },
  collar:   { label: 'Collier Cœur Miloute', emoji: '📿', amountCents: 199 },
  coat:     { label: 'Manteau Chic',      emoji: '🧥', amountCents: 199 },
};

// Packs groupés — plusieurs articles réunis à prix légèrement réduit. Un seul
// achat, mais crédite chaque article du pack individuellement dans l'inventaire.
const GIFT_BUNDLES = {
  dog_pack:    { label: 'Pack Gourmand Chien', items: ['bone', 'chicken', 'bacon'], amountCents: 399 },
  cat_pack:    { label: 'Pack Gourmand Chat', items: ['fish', 'tunapate', 'milk'], amountCents: 199 },
  cuddle_pack: { label: 'Pack Câlin', items: ['bouquet', 'ribbon', 'cake'], amountCents: 499 },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body;

  try {
    // ── Créer la session de paiement (article seul ou pack groupé) ────────
    if (action === 'create-checkout') {
      const { itemId, bundleId, profileId, userId, successUrl, cancelUrl } = req.body;
      if (!profileId || !userId) return res.status(400).json({ error: 'profileId and userId are required' });

      let label, amountCents, metadata;
      if (bundleId) {
        const bundle = GIFT_BUNDLES[bundleId];
        if (!bundle) return res.status(400).json({ error: 'Pack inconnu' });
        label = bundle.label; amountCents = bundle.amountCents;
        metadata = { bundleId, profileId, userId };
      } else {
        const item = GIFT_CATALOG[itemId];
        if (!item) return res.status(400).json({ error: 'Article inconnu' });
        label = item.label; amountCents = item.amountCents;
        metadata = { itemId, profileId, userId };
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: { name: `Miloute — ${label}` },
            unit_amount: amountCents,
          },
          quantity: 1,
        }],
        metadata,
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

      if (meta.bundleId) {
        const bundle = GIFT_BUNDLES[meta.bundleId];
        if (!bundle) return res.status(400).json({ error: 'Pack inconnu' });

        const { data: profile, error: fetchError } = await supabase
          .from('profiles').select('gift_inventory').eq('id', meta.profileId).single();
        if (fetchError) throw fetchError;

        const inventory = profile.gift_inventory || {};
        const newInventory = { ...inventory };
        bundle.items.forEach(id => { newInventory[id] = (newInventory[id] || 0) + 1; });

        const { error: updateError } = await supabase
          .from('profiles').update({ gift_inventory: newInventory }).eq('id', meta.profileId);
        if (updateError) throw updateError;

        await supabase.from('shop_purchases').insert({
          user_id: meta.userId, profile_id: meta.profileId, pack_id: meta.bundleId,
          stripe_checkout_session_id: sessionId, amount_cents: bundle.amountCents, credited_treats: bundle.items.length,
        });

        return res.status(200).json({ paid: true, giftInventory: newInventory, itemId: meta.bundleId });
      }

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
