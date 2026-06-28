// api/create-payment.js
// Crée un paiement (saillie, prestation...) avec :
//  - répartition automatique de la commission Miloute (application_fee_amount)
//  - capture manuelle = "escrow" : l'argent est autorisé mais pas transféré
//    tant que toi/l'app ne déclenches pas la confirmation (capture).
//
// amount et commission sont en CENTIMES (ex: 50000 = 500,00€)

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const COMMISSION_RATE = 0.10; // 10% — ajustable selon ton modèle (reproduction / prestataires)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, connectedAccountId, description } = req.body;

    if (!amount || !connectedAccountId) {
      return res.status(400).json({ error: 'amount and connectedAccountId are required' });
    }

    const commission = Math.round(amount * COMMISSION_RATE);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,                         // montant total payé par l'utilisateur (centimes)
      currency: 'eur',
      capture_method: 'manual',       // ← ESCROW : autorisé mais pas capturé
      application_fee_amount: commission, // ta commission, prélevée automatiquement à la capture
      transfer_data: {
        destination: connectedAccountId, // le compte Connect de l'éleveur/prestataire
      },
      description: description || 'Paiement Miloute',
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      commission,
      netAmount: amount - commission,
    });
  } catch (err) {
    console.error('Stripe payment error:', err);
    return res.status(500).json({ error: err.message });
  }
};
