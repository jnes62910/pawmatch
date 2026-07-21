// api/confirm-booking.js
//
// Gère deux actions du cycle de vie d'une réservation, dans un seul fichier
// pour rester sous la limite de 12 fonctions serverless du plan Vercel Hobby :
//
// - "confirm" (par défaut, comportement historique) : le client OU le
//   prestataire confirme que la prestation a bien eu lieu. Dès que les DEUX
//   ont confirmé, les fonds retenus sont transférés au prestataire (moins la
//   commission Miloute) via un virement Stripe Connect.
//
// - "cancel" (nouveau) : annule une réservation et rembourse intégralement le
//   client, tant que ni le client ni le prestataire n'ont encore confirmé que
//   la prestation a eu lieu — passé ce stade, l'annulation en libre-service
//   n'est plus proposée (il faudrait alors un vrai support humain, pas un
//   bouton automatique).

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
    const { bookingId, userId, action = 'confirm' } = req.body;
    if (!bookingId || !userId) return res.status(400).json({ error: 'bookingId and userId are required' });

    const { data: booking, error: fetchError } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
    if (fetchError || !booking) throw fetchError || new Error('Réservation introuvable');

    const isClient = userId === booking.client_user_id;
    const isProvider = userId === booking.provider_user_id;
    if (!isClient && !isProvider) {
      return res.status(403).json({ error: 'Vous ne faites pas partie de cette réservation.' });
    }

    // ── Annulation ──────────────────────────────────────────────────────────
    if (action === 'cancel') {
      if (booking.status !== 'paid_held') {
        return res.status(400).json({ error: 'Cette réservation ne peut plus être annulée à ce stade.' });
      }
      if (booking.client_confirmed_at || booking.provider_confirmed_at) {
        return res.status(400).json({ error: "Impossible d'annuler : une confirmation a déjà eu lieu. Contactez le support pour ce cas précis." });
      }

      if (booking.stripe_payment_intent_id) {
        await stripe.refunds.create({ payment_intent: booking.stripe_payment_intent_id });
      }

      const { data: cancelled, error: cancelError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by_user_id: userId })
        .eq('id', bookingId).select().single();
      if (cancelError) throw cancelError;

      return res.status(200).json({ booking: cancelled });
    }

    // ── Confirmation (comportement historique, inchangé) ───────────────────
    if (booking.status !== 'paid_held') {
      return res.status(400).json({ error: 'Cette réservation ne peut plus être confirmée à ce stade.' });
    }

    // Étape 1 — on sauvegarde la confirmation tout de suite, quoi qu'il arrive ensuite.
    const confirmUpdates = {};
    if (isClient && !booking.client_confirmed_at) confirmUpdates.client_confirmed_at = new Date().toISOString();
    if (isProvider && !booking.provider_confirmed_at) confirmUpdates.provider_confirmed_at = new Date().toISOString();

    let current = booking;
    if (Object.keys(confirmUpdates).length > 0) {
      const { data: afterConfirm, error: confirmError } = await supabase
        .from('bookings').update(confirmUpdates).eq('id', bookingId).select().single();
      if (confirmError) throw confirmError;
      current = afterConfirm;
    }

    const bothConfirmed = !!current.client_confirmed_at && !!current.provider_confirmed_at;
    if (!bothConfirmed) {
      return res.status(200).json({ booking: current });
    }

    // Étape 2 — les deux ont confirmé : on tente le virement. S'il échoue, on
    // renvoie une erreur claire, mais la confirmation ci-dessus reste acquise
    // (le statut reste "paid_held", on pourra retenter plus tard).
    const { data: providerProfile } = await supabase
      .from('profiles').select('stripe_connect_account_id').eq('id', current.provider_profile_id).single();

    if (!providerProfile?.stripe_connect_account_id) {
      return res.status(200).json({ booking: current, error: "Le prestataire n'a pas de compte de paiement configuré." });
    }

    try {
      const transfer = await stripe.transfers.create({
        amount: current.provider_payout_cents,
        currency: 'eur',
        destination: providerProfile.stripe_connect_account_id,
        transfer_group: current.id,
      });

      const { data: released, error: releaseError } = await supabase
        .from('bookings').update({ status: 'released', stripe_transfer_id: transfer.id }).eq('id', bookingId).select().single();
      if (releaseError) throw releaseError;

      return res.status(200).json({ booking: released });
    } catch (transferErr) {
      console.error('Stripe transfer failed:', transferErr);
      // En mode test Stripe, un paiement standard reste en solde "en attente"
      // quelques jours et ne peut pas être viré tout de suite — c'est attendu.
      return res.status(200).json({
        booking: current,
        error: transferErr.message?.includes('Insufficient funds')
          ? "Virement impossible pour l'instant : en mode test Stripe, utilisez la carte 4000 0000 0000 0077 pour créditer le solde disponible immédiatement, sinon le paiement reste \"en attente\" quelques jours (comportement normal de Stripe, pas un bug)."
          : "Le virement vers le prestataire a échoué : " + transferErr.message,
      });
    }
  } catch (err) {
    console.error('confirm-booking error:', err);
    return res.status(500).json({ error: err.message });
  }
};
