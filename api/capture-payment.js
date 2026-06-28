// api/capture-payment.js
// Libère les fonds bloqués en escrow — appelé quand les deux parties
// confirment que la prestation / saillie a bien eu lieu.
// C'est CE moment précis où le transfert vers le compte connecté se déclenche réellement.

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'paymentIntentId is required' });
    }

    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

    return res.status(200).json({
      status: paymentIntent.status,
      captured: paymentIntent.status === 'succeeded',
    });
  } catch (err) {
    console.error('Stripe capture error:', err);
    return res.status(500).json({ error: err.message });
  }
};
