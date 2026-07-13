// api/verify-booking-session.js
//
// Appelée au retour de Stripe Checkout. Vérifie que le paiement a bien
// abouti (jamais confiance dans l'URL seule), puis crée la réservation avec
// le statut "paid_held" — l'argent est chez Miloute, en attente de la double
// confirmation (voir confirm-booking.js) avant d'être reversé au prestataire.

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
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });
    if (session.payment_status !== 'paid') {
      return res.status(200).json({ paid: false });
    }

    // Idempotence : si cette session a déjà généré une réservation (retour
    // sur la même page après rechargement), on la renvoie telle quelle.
    const { data: existing } = await supabase
      .from('bookings').select('*').eq('stripe_checkout_session_id', sessionId).maybeSingle();
    if (existing) {
      return res.status(200).json({ paid: true, booking: existing });
    }

    const meta = session.metadata;
    const { data: settingRow } = await supabase
      .from('platform_settings').select('value').eq('key', 'commission_rate_percent').maybeSingle();
    const commissionRate = settingRow ? parseFloat(settingRow.value) : 15;

    const { data: service } = await supabase.from('provider_services').select('title').eq('id', meta.serviceId).maybeSingle();

    const priceCents = session.amount_total;
    const commissionCents = Math.round(priceCents * (commissionRate / 100));
    const providerPayoutCents = priceCents - commissionCents;

    const { data: booking, error: insertError } = await supabase.from('bookings').insert({
      service_id: meta.serviceId,
      service_title: service?.title || 'Prestation',
      provider_profile_id: meta.providerProfileId,
      provider_user_id: meta.providerUserId,
      client_profile_id: meta.clientProfileId,
      client_user_id: meta.clientUserId,
      price_cents: priceCents,
      commission_cents: commissionCents,
      provider_payout_cents: providerPayoutCents,
      stripe_checkout_session_id: sessionId,
      stripe_payment_intent_id: session.payment_intent?.id || null,
      status: 'paid_held',
    }).select().single();
    if (insertError) throw insertError;

    return res.status(200).json({ paid: true, booking });
  } catch (err) {
    console.error('verify-booking-session error:', err);
    return res.status(500).json({ error: err.message });
  }
};
