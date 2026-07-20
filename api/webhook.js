// api/webhook.js
//
// Filet de sécurité pour les 3 circuits de paiement de Miloute (Premium,
// réservations, boutique). Stripe appelle cette adresse directement, sans
// passer par le navigateur de l'utilisateur — donc même si la personne
// ferme l'onglet juste après avoir payé (avant que la page de retour ait pu
// vérifier et créditer côté serveur), ce webhook s'en charge quand même,
// avec un peu de délai.
//
// Chaque action reprend exactement la même logique d'idempotence que sa
// fonction "verify" respective (verify-session.js, verify-booking-session.js,
// et l'action verify-session du shop.js) : si le navigateur a déjà tout
// réglé normalement, ce webhook ne fait rien de plus, jamais de double
// crédit.
//
// Important : nécessite que STRIPE_WEBHOOK_SECRET soit configuré dans les
// Environment Variables de Vercel — voir les instructions fournies à côté
// de ce fichier pour le récupérer depuis le tableau de bord Stripe.

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Nécessaire pour vérifier la signature Stripe : on a besoin du corps brut
// de la requête, pas du JSON déjà parsé par Vercel.
module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function handlePremium(session) {
  const meta = session.metadata;
  if (!meta?.profileId) return;

  const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', meta.profileId).single();
  if (profile?.is_premium) return; // déjà activé par le navigateur, rien à faire

  await supabase.from('profiles').update({ is_premium: true }).eq('id', meta.profileId);
  console.log(`[webhook] Premium activé en secours pour le profil ${meta.profileId}`);
}

async function handleBooking(session) {
  const meta = session.metadata;

  const { data: existing } = await supabase
    .from('bookings').select('id').eq('stripe_checkout_session_id', session.id).maybeSingle();
  if (existing) return; // déjà créée par le navigateur, rien à faire

  const { data: settingRow } = await supabase
    .from('platform_settings').select('value').eq('key', 'commission_rate_percent').maybeSingle();
  const commissionRate = settingRow ? parseFloat(settingRow.value) : 15;

  const { data: service } = await supabase.from('provider_services').select('title').eq('id', meta.serviceId).maybeSingle();

  const priceCents = session.amount_total;
  const commissionCents = Math.round(priceCents * (commissionRate / 100));
  const providerPayoutCents = priceCents - commissionCents;

  await supabase.from('bookings').insert({
    service_id: meta.serviceId,
    service_title: service?.title || 'Prestation',
    provider_profile_id: meta.providerProfileId,
    provider_user_id: meta.providerUserId,
    client_profile_id: meta.clientProfileId,
    client_user_id: meta.clientUserId,
    price_cents: priceCents,
    commission_cents: commissionCents,
    provider_payout_cents: providerPayoutCents,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent || null,
    status: 'paid_held',
  });
  console.log(`[webhook] Réservation créée en secours pour la session ${session.id}`);
}

const GIFT_BUNDLES_ITEMS = {
  gourmet_dog_pack: ['bone', 'chicken', 'bacon'],
  gourmet_cat_pack: ['fish', 'tunapate', 'milk'],
  player_dog_pack: ['tennisball', 'frisbee', 'chewrope'],
  player_cat_pack: ['yarn', 'mouse', 'feather'],
  romance_dog_pack: ['bouquet', 'rose', 'coeur_dog'],
  romance_cat_pack: ['bouquet', 'rose', 'coeur_cat'],
  luxury_dog_pack: ['crown', 'steak', 'doghouse'],
  luxury_cat_pack: ['crown', 'sushi', 'cattree'],
};

async function handleShop(session) {
  const meta = session.metadata;

  const { data: existing } = await supabase
    .from('shop_purchases').select('id').eq('stripe_checkout_session_id', session.id).maybeSingle();
  if (existing) return; // déjà crédité par le navigateur, rien à faire

  const { data: profile } = await supabase.from('profiles').select('gift_inventory').eq('id', meta.profileId).single();
  const inventory = profile?.gift_inventory || {};
  const newInventory = { ...inventory };

  if (meta.bundleId) {
    const items = GIFT_BUNDLES_ITEMS[meta.bundleId] || [];
    items.forEach(id => { newInventory[id] = (newInventory[id] || 0) + 1; });
    await supabase.from('profiles').update({ gift_inventory: newInventory }).eq('id', meta.profileId);
    await supabase.from('shop_purchases').insert({
      user_id: meta.userId, profile_id: meta.profileId, pack_id: meta.bundleId,
      stripe_checkout_session_id: session.id, amount_cents: session.amount_total, credited_treats: items.length,
    });
  } else if (meta.itemId) {
    newInventory[meta.itemId] = (newInventory[meta.itemId] || 0) + 1;
    await supabase.from('profiles').update({ gift_inventory: newInventory }).eq('id', meta.profileId);
    await supabase.from('shop_purchases').insert({
      user_id: meta.userId, profile_id: meta.profileId, pack_id: meta.itemId,
      stripe_checkout_session_id: session.id, amount_cents: session.amount_total, credited_treats: 1,
    });
  }
  console.log(`[webhook] Achat boutique crédité en secours pour la session ${session.id}`);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event;
  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] Signature invalide:', err.message);
    return res.status(400).json({ error: `Signature invalide : ${err.message}` });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.payment_status === 'paid') {
        const type = session.metadata?.type;
        if (type === 'premium') await handlePremium(session);
        else if (type === 'booking') await handleBooking(session);
        else if (type === 'shop') await handleShop(session);
        // Sessions plus anciennes sans "type" dans les métadonnées : ignorées
        // silencieusement, impossible de savoir à quoi elles correspondent.
      }
    }
    // Toujours répondre 200 rapidement pour accuser réception — Stripe
    // réessaiera automatiquement si on ne répond pas ou si on renvoie une erreur.
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhook] Erreur de traitement:', err);
    // On renvoie 500 volontairement : Stripe retentera cet événement plus
    // tard plutôt que de le considérer comme traité alors qu'il a échoué.
    return res.status(500).json({ error: err.message });
  }
};
