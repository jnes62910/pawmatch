// api/create-checkout-session.js
// Crée une session Stripe Checkout pour l'abonnement Premium PawMatch.
// L'argent va directement sur le compte de la plateforme — pas de Connect,
// pas de commission à répartir, c'est un paiement classique.

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Montants en centimes
const PLAN_AMOUNTS = {
  monthly: 499,   // 4,99 €
  yearly: 3999,   // 39,99 €
};

const PLAN_INTERVALS = {
  monthly: 'month',
  yearly: 'year',
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, successUrl, cancelUrl } = req.body;

    if (!plan || !PLAN_AMOUNTS[plan]) {
      return res.status(400).json({ error: 'plan must be "monthly" or "yearly"' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `PawMatch Premium — ${plan === 'monthly' ? 'Mensuel' : 'Annuel'}`,
              description: 'Swipes illimités, qui t\'a liké, boost de visibilité, reproduction complète',
            },
            unit_amount: PLAN_AMOUNTS[plan],
            recurring: { interval: PLAN_INTERVALS[plan] },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || 'https://jnes62910-pawmatch.vercel.app/?premium=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl || 'https://jnes62910-pawmatch.vercel.app/?premium=cancel',
    });

    return res.status(200).json({ checkoutUrl: session.url });
  } catch (err) {
    console.error('Stripe Checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
};
