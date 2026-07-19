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
  steak:    { label: 'Steak Royal',       emoji: '🥩', amountCents: 299 },
  bacon:    { label: 'Bacon Croustillant', emoji: '🥓', amountCents: 199 },
  meatbone: { label: 'Viande Tendresse',  emoji: '🍖', amountCents: 199 },
  fish:     { label: 'Poisson Miloute',   emoji: '🐟', amountCents: 99 },
  turkeypate: { label: 'Pâté de dinde',      emoji: '🥫', amountCents: 99 },
  sushi:    { label: "Sushi d'Amour",     emoji: '🍣', amountCents: 199 },
  shrimp:   { label: 'Crevette Coquine',  emoji: '🍤', amountCents: 199 },
  milk:     { label: 'Lait Doux Miloute', emoji: '🥛', amountCents: 99 },
  Gourmetdish:  { label: 'Plateau Gourmet',    emoji: '🍱', amountCents: 299 },
  tennisball: { label: 'Balle Rebelle',   emoji: '🥎', amountCents: 199 },
  frisbee:    { label: 'Frisbee Fou',     emoji: '🥏', amountCents: 199 },
  chewrope:   { label: 'Corde à Mâchouiller', emoji: '🪢', amountCents: 199 },
  yarn:       { label: 'Pelote Magique',  emoji: '🧶', amountCents: 199 },
  mouse:      { label: 'Souris Fuyante',  emoji: '🐭', amountCents: 199 },
  feather:    { label: 'Plume Chatouille', emoji: '🪶', amountCents: 199 },
  bouquet: { label: 'Bouquet des Amoureux', emoji: '💐', amountCents: 199 },
  crown:   { label: 'Couronne Miloute',   emoji: '👑', amountCents: 299 },
  ribbon:  { label: 'Ruban Chic',         emoji: '🎀', amountCents: 199 },
  cake:    { label: 'Gâteau Fiesta',      emoji: '🎂', amountCents: 199 },
  rose:    { label: 'Rose des Amoureux',  emoji: '🌹', amountCents: 199 },
  coeur:   { label: 'Cœur Miloute',       emoji: '💕', amountCents: 199 },
  medal:   { label: 'Médaille Miloute',   emoji: '🏅', amountCents: 299 },
  plush:   { label: 'Doudou Câlin',       emoji: '🧸', amountCents: 199 },
  bed:      { label: 'Panier Douillet',   emoji: '☁️', amountCents: 199 },
  doghouse: { label: 'Niche Royale',      emoji: '🏠', amountCents: 299 },
  cattree:  { label: 'Arbre Royal',       emoji: '🌳', amountCents: 299 },
  collar:   { label: 'Collier Cœur Miloute', emoji: '📿', amountCents: 199 },
};

// Packs groupés — plusieurs articles réunis à prix légèrement réduit. Un seul
// achat, mais crédite chaque article du pack individuellement dans l'inventaire.
const GIFT_BUNDLES = {
  gourmet_dog_pack: { label: 'Pack Gourmand', items: ['bone', 'chicken', 'bacon'], amountCents: 399 },
  gourmet_cat_pack: { label: 'Pack Gourmand', items: ['fish', 'turkeypate', 'milk'], amountCents: 199 },
  player_dog_pack:  { label: 'Pack Joueur', items: ['tennisball', 'frisbee', 'chewrope'], amountCents: 499 },
  player_cat_pack:  { label: 'Pack Joueur', items: ['yarn', 'mouse', 'feather'], amountCents: 499 },
  romance_pack:     { label: 'Pack Romantique', items: ['bouquet', 'rose', 'coeur'], amountCents: 499 },
  luxury_dog_pack:  { label: 'Pack Luxe', items: ['crown', 'steak', 'doghouse'], amountCents: 699 },
  luxury_cat_pack:  { label: 'Pack Luxe', items: ['crown', 'Gourmetdish', 'cattree'], amountCents: 699 },
};

// Quêtes ponctuelles — chacune ne peut être récompensée qu'une seule fois par
// profil (suivi dans profiles.quests_completed). Pas de série quotidienne, pas
// de notification de rappel : uniquement de vraies étapes utiles du parcours.
const QUESTS = {
  profile_complete: { rewardLabel: '1 friandise' },
  first_match:      { rewardItemId: 'bouquet', rewardLabel: '1 Bouquet des Amoureux' },
  first_video:      { rewardItemId: 'collar', rewardLabel: '1 Collier Cœur Miloute' },
  first_review:     { rewardItemId: 'rose', rewardLabel: '1 Rose des Amoureux' },
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

    // ── Réclamer la récompense d'une quête ponctuelle ─────────────────────
    if (action === 'claim-quest') {
      const { profileId, userId, questId } = req.body;
      const quest = QUESTS[questId];
      if (!quest) return res.status(400).json({ error: 'Quête inconnue' });
      if (!profileId || !userId) return res.status(400).json({ error: 'profileId and userId are required' });

      const { data: profile, error: fetchError } = await supabase
        .from('profiles').select('*').eq('id', profileId).single();
      if (fetchError || !profile) throw fetchError || new Error('Profil introuvable');
      if (profile.user_id !== userId) return res.status(403).json({ error: 'Ce profil ne vous appartient pas.' });

      const completed = profile.quests_completed || {};
      if (completed[questId]) {
        return res.status(200).json({ claimed: false, alreadyClaimed: true });
      }

      // Vérification serveur de l'éligibilité réelle — jamais fait confiance
      // au client seul pour valider qu'une quête est bien accomplie.
      let eligible = false;
      let rewardItemId = quest.rewardItemId;

      if (questId === 'profile_complete') {
        const score = (profile.photos?.length > 0 ? 25 : 0) + (profile.video ? 20 : 0) + (profile.bio ? 20 : 0)
          + (profile.temper?.length > 0 ? 15 : 0) + (profile.vaccinated ? 10 : 0)
          + (profile.repro?.active && profile.repro?.price ? 10 : 0);
        eligible = score >= 100;
        rewardItemId = profile.species === 'cat' ? 'fish' : 'bone';
      } else if (questId === 'first_match') {
        const { count } = await supabase.from('matches').select('id', { count: 'exact', head: true })
          .or(`user_a.eq.${userId},user_b.eq.${userId}`);
        eligible = (count || 0) >= 1;
      } else if (questId === 'first_video') {
        eligible = !!profile.video;
      } else if (questId === 'first_review') {
        const { count } = await supabase.from('provider_reviews').select('*', { count: 'exact', head: true }).eq('user_id', userId);
        eligible = (count || 0) >= 1;
      }

      if (!eligible) return res.status(200).json({ claimed: false, eligible: false });

      const inventory = profile.gift_inventory || {};
      const newInventory = { ...inventory, [rewardItemId]: (inventory[rewardItemId] || 0) + 1 };
      const newCompleted = { ...completed, [questId]: true };

      const { error: updateError } = await supabase
        .from('profiles').update({ gift_inventory: newInventory, quests_completed: newCompleted }).eq('id', profileId);
      if (updateError) throw updateError;

      return res.status(200).json({ claimed: true, giftInventory: newInventory, questsCompleted: newCompleted, rewardItemId });
    }

    return res.status(400).json({ error: 'Action inconnue' });
  } catch (err) {
    console.error('shop.js error:', err);
    return res.status(500).json({ error: err.message });
  }
};
