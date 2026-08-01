// api/create-booking-checkout.js
//
// Crée une session Stripe Checkout pour réserver une prestation. L'argent est
// encaissé sur le compte Miloute (pas directement chez le prestataire) — il
// sera reversé plus tard, une fois la prestation validée par les deux parties
// (voir confirm-booking.js).
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { serviceId, clientProfileId, clientUserId, successUrl, cancelUrl } = req.body;
    if (!serviceId || !clientProfileId || !clientUserId) {
      return res.status(400).json({ error: 'serviceId, clientProfileId and clientUserId are required' });
    }
    const { data: service, error: serviceError } = await supabase
      .from('provider_services')
      .select('*, profiles(id, user_id, pet_name, stripe_connect_onboarded)')
      .eq('id', serviceId)
      .single();
    if (serviceError || !service) throw serviceError || new Error('Service introuvable');
    if (!service.active) return res.status(400).json({ error: 'Cette prestation n\'est plus disponible' });
    const provider = service.profiles;
    if (!provider?.stripe_connect_onboarded) {
      return res.status(400).json({ error: 'Ce prestataire n\'a pas encore activé ses paiements' });
    }
    if (provider.user_id === clientUserId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas réserver votre propre prestation' });
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: service.title, description: service.description || undefined },
          unit_amount: service.price_cents,
        },
        quantity: 1,
      }],
      metadata: {
        type: 'booking',
        serviceId, clientProfileId, clientUserId,
        providerProfileId: provider.id, providerUserId: provider.user_id,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return res.status(200).json({ checkoutUrl: session.url });
  } catch (err) {
    console.error('create-booking-checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
};
