// api/check-account-status.js
// Vérifie si un compte Connect a terminé son onboarding
// (pièce d'identité + IBAN validés) et peut donc recevoir des paiements.

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accountId } = req.query;
    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    const account = await stripe.accounts.retrieve(accountId);

    return res.status(200).json({
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (err) {
    console.error('Stripe account status error:', err);
    return res.status(500).json({ error: err.message });
  }
};
