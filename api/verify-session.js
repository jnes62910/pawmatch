// api/verify-session.js
// Vérifie auprès de Stripe qu'une session de paiement a réellement été payée,
// au lieu de faire confiance à l'URL de retour (qui peut être falsifiée par
// n'importe qui en tapant ?premium=success dans la barre d'adresse).

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    const paid = session.payment_status === 'paid' || session.status === 'complete';

    return res.status(200).json({
      paid,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      customerEmail: session.customer_details?.email || null,
    });
  } catch (err) {
    console.error('Stripe session verify error:', err);
    // Si la session n'existe pas ou est invalide, on considère que ce n'est pas payé
    return res.status(200).json({ paid: false, error: err.message });
  }
};
