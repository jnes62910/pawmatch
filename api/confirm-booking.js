// api/confirm-booking.js
//
// Gère trois actions du cycle de vie d'une réservation, dans un seul fichier
// pour rester sous la limite de 12 fonctions serverless du plan Vercel Hobby :
//
// - "confirm" (par défaut, comportement historique) : le client OU le
//   prestataire confirme que la prestation a bien eu lieu. Dès que les DEUX
//   ont confirmé, les fonds retenus sont transférés au prestataire (moins la
//   commission Miloute) via un virement Stripe Connect.
//
// - "cancel" : annule une réservation et rembourse intégralement le client,
//   tant que ni le client ni le prestataire n'ont encore confirmé que la
//   prestation a eu lieu — passé ce stade, l'annulation en libre-service
//   n'est plus proposée (il faudrait alors un vrai support humain, pas un
//   bouton automatique).
//
// - "auto-release" : appelée uniquement par le Cron Vercel (voir vercel.json),
//   jamais par le client. Filet de sécurité contre l'argent bloqué
//   indéfiniment quand UNE SEULE des deux parties confirme : relance l'autre
//   partie à J+3, libère automatiquement les fonds à J+7 sans attendre sa
//   confirmation.
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getFirebaseApp() {
  if (admin.apps.length > 0) return admin.apps[0];
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

async function sendPush(targetUserId, title, body, data) {
  try {
    const { data: tokenRows } = await supabase.from('device_tokens').select('token').eq('user_id', targetUserId);
    if (!tokenRows || tokenRows.length === 0) return;
    getFirebaseApp();
    const messaging = admin.messaging();
    for (const row of tokenRows) {
      try {
        await messaging.send({
          token: row.token,
          notification: { title, body, imageUrl: 'https://miloute.app/logo-notif.png' },
          data: data || {},
          android: { priority: 'high', notification: { imageUrl: 'https://miloute.app/logo-notif.png' } },
        });
      } catch (err) {
        if (err.code !== 'messaging/registration-token-not-registered') console.error('sendPush error:', err.message);
      }
    }
  } catch (err) {
    console.error('sendPush lookup error:', err.message);
  }
}

// Vire les fonds au prestataire et marque la réservation "released". Utilisée
// à la fois par la double-confirmation normale et par la libération
// automatique — un seul endroit qui sait comment payer un prestataire.
async function releaseFunds(booking) {
  const { data: providerProfile } = await supabase
    .from('profiles').select('stripe_connect_account_id').eq('id', booking.provider_profile_id).single();
  if (!providerProfile?.stripe_connect_account_id) {
    return { booking, error: "Le prestataire n'a pas de compte de paiement configuré." };
  }
  try {
    const transfer = await stripe.transfers.create({
      amount: booking.provider_payout_cents,
      currency: 'eur',
      destination: providerProfile.stripe_connect_account_id,
      transfer_group: booking.id,
    });
    const { data: released, error: releaseError } = await supabase
      .from('bookings').update({ status: 'released', stripe_transfer_id: transfer.id }).eq('id', booking.id).select().single();
    if (releaseError) throw releaseError;
    return { booking: released };
  } catch (transferErr) {
    console.error('Stripe transfer failed:', transferErr);
    return {
      booking,
      error: transferErr.message?.includes('Insufficient funds')
        ? "Virement impossible pour l'instant : en mode test Stripe, utilisez la carte 4000 0000 0000 0077 pour créditer le solde disponible immédiatement, sinon le paiement reste \"en attente\" quelques jours (comportement normal de Stripe, pas un bug)."
        : "Le virement vers le prestataire a échoué : " + transferErr.message,
    };
  }
}

module.exports = async (req, res) => {
  // Autorise les appels depuis l'app Android native (origine "https://localhost",
  // différente du site web) — sans ça, le navigateur/WebView bloque la requête
  // avant même qu'elle n'atteigne ce code (erreur CORS).
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Requête de vérification envoyée automatiquement par le navigateur avant
  // la vraie requête POST — il faut y répondre correctement (200, avec les
  // en-têtes ci-dessus) pour que la vraie requête soit ensuite autorisée.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── Cron d'auto-libération (GET, jamais appelé par l'app) ────────────────
  // Vercel Cron envoie une requête GET avec l'en-tête Authorization défini
  // automatiquement à partir de la variable d'env CRON_SECRET — donc
  // impossible à déclencher depuis l'extérieur sans connaître ce secret.
  if (req.method === 'GET' && req.query.action === 'auto-release') {
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const REMINDER_AFTER_HOURS = 72;  // J+3 : relance la partie qui n'a pas confirmé
    const RELEASE_AFTER_HOURS = 168;  // J+7 : libération automatique, sans attendre
    const now = Date.now();
    try {
      const { data: pending, error: pendingError } = await supabase
        .from('bookings').select('*')
        .eq('status', 'paid_held')
        .or('client_confirmed_at.not.is.null,provider_confirmed_at.not.is.null');
      if (pendingError) throw pendingError;

      let reminded = 0, released = 0, releaseErrors = 0;
      for (const booking of pending || []) {
        // Une seule des deux dates est renseignée dans ce lot (filtré par le
        // OR ci-dessus) — sauf si les deux le sont, auquel cas confirm-booking
        // aurait déjà libéré les fonds normalement ; on ignore ce cas ici.
        if (booking.client_confirmed_at && booking.provider_confirmed_at) continue;
        const confirmedAt = booking.client_confirmed_at || booking.provider_confirmed_at;
        const waitingUserId = booking.client_confirmed_at ? booking.provider_user_id : booking.client_user_id;
        const hoursSince = (now - new Date(confirmedAt).getTime()) / 3600000;

        if (hoursSince >= RELEASE_AFTER_HOURS) {
          const { booking: result, error } = await releaseFunds(booking);
          if (error) { releaseErrors++; continue; }
          await supabase.from('bookings').update({ auto_released: true }).eq('id', booking.id);
          released++;
          sendPush(booking.client_user_id, 'Prestation validée automatiquement', `"${booking.service_title}" a été confirmée automatiquement après 7 jours sans réponse de votre part.`, { type: 'booking_auto_released', bookingId: booking.id });
          sendPush(booking.provider_user_id, 'Fonds libérés automatiquement', `"${booking.service_title}" a été confirmée automatiquement, les fonds vous ont été reversés.`, { type: 'booking_auto_released', bookingId: booking.id });
        } else if (hoursSince >= REMINDER_AFTER_HOURS && !booking.reminder_sent_at) {
          await sendPush(waitingUserId, 'Confirmez votre prestation', `"${booking.service_title}" attend votre confirmation — sans réponse, elle sera validée automatiquement dans quelques jours.`, { type: 'booking_reminder', bookingId: booking.id });
          await supabase.from('bookings').update({ reminder_sent_at: new Date().toISOString() }).eq('id', booking.id);
          reminded++;
        }
      }
      return res.status(200).json({ checked: (pending || []).length, reminded, released, releaseErrors });
    } catch (err) {
      console.error('auto-release error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

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
    // ── Date de RDV convenue ─────────────────────────────────────────────────
    // Champ partagé, réglable par n'importe laquelle des deux parties, sans
    // étape de validation formelle — l'accord se fait via le chat, ce champ
    // ne fait que le rendre visible et permettre de trier "Mes réservations"
    // par vraie date plutôt que par ordre de paiement.
    if (action === 'set-agreed-date') {
      const { agreedAt } = req.body;
      if (booking.status === 'cancelled') return res.status(400).json({ error: 'Réservation annulée.' });
      const { data: updated, error } = await supabase
        .from('bookings').update({ agreed_at: agreedAt || null }).eq('id', bookingId).select().single();
      if (error) throw error;
      const recipientUserId = isClient ? booking.provider_user_id : booking.client_user_id;
      if (agreedAt) {
        sendPush(recipientUserId, 'Date de rendez-vous mise à jour', `Nouvelle date convenue pour "${booking.service_title}".`, { type: 'booking_date_set', bookingId });
      }
      return res.status(200).json({ booking: updated });
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
    const { booking: resultBooking, error: releaseError } = await releaseFunds(current);
    return res.status(200).json(releaseError ? { booking: resultBooking, error: releaseError } : { booking: resultBooking });
  } catch (err) {
    console.error('confirm-booking error:', err);
    return res.status(500).json({ error: err.message });
  }
};
