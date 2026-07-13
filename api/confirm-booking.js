// api/confirm-booking.js
//
// Appelée quand le client OU le prestataire confirme que la prestation a bien
// eu lieu. Dès que les DEUX ont confirmé, les fonds retenus sont transférés
// au prestataire (moins la commission Miloute) via un virement Stripe Connect.

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
    const { bookingId, userId } = req.body;
    if (!bookingId || !userId) return res.status(400).json({ error: 'bookingId and userId are required' });

    const { data: booking, error: fetchError } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
    if (fetchError || !booking) throw fetchError || new Error('Réservation introuvable');

    if (booking.status !== 'paid_held') {
      return res.status(400).json({ error: 'Cette réservation ne peut plus être confirmée à ce stade.' });
    }

    const isClient = userId === booking.client_user_id;
    const isProvider = userId === booking.provider_user_id;
    if (!isClient && !isProvider) {
      return res.status(403).json({ error: 'Vous ne faites pas partie de cette réservation.' });
    }

    const updates = {};
    if (isClient && !booking.client_confirmed_at) updates.client_confirmed_at = new Date().toISOString();
    if (isProvider && !booking.provider_confirmed_at) updates.provider_confirmed_at = new Date().toISOString();

    const willBeClientConfirmed = booking.client_confirmed_at || updates.client_confirmed_at;
    const willBeProviderConfirmed = booking.provider_confirmed_at || updates.provider_confirmed_at;

    if (willBeClientConfirmed && willBeProviderConfirmed) {
      const { data: providerProfile } = await supabase
        .from('profiles').select('stripe_connect_account_id').eq('id', booking.provider_profile_id).single();

      const transfer = await stripe.transfers.create({
        amount: booking.provider_payout_cents,
        currency: 'eur',
        destination: providerProfile.stripe_connect_account_id,
        transfer_group: booking.id,
      });

      updates.status = 'released';
      updates.stripe_transfer_id = transfer.id;
    }

    const { data: updated, error: updateError } = await supabase.from('bookings').update(updates).eq('id', bookingId).select().single();
    if (updateError) throw updateError;

    return res.status(200).json({ booking: updated });
  } catch (err) {
    console.error('confirm-booking error:', err);
    return res.status(500).json({ error: err.message });
  }
};
