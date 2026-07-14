const crypto = require('crypto');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hhtwuaehgkwueyfiixyw.supabase.co';
const PAYMENT_LINK_TO_STOCK_ID = {
'plink_1TpqWVDRtn3CRDmVi8QXfpzT': 'decouverte',
'plink_1TpqYODRtn3CRDmV21DeMPxN': 'intermediaire',
'plink_1TpqbADRtn3CRDmV0lQ3SAKD': 'pro',
};
function verifyStripeSignature(rawBody, signatureHeader, secret) {
if (!signatureHeader) return false;
var parts = signatureHeader.split(',').reduce(function (acc, part) {
var kv = part.split('=');
if (kv[0] === 't') acc.timestamp = kv[1];
if (kv[0] === 'v1') acc.signatures.push(kv.slice(1).join('='));
return acc;
}, { timestamp: null, signatures: [] });
if (!parts.timestamp || parts.signatures.length === 0) return false;
var age = Math.abs(Date.now() / 1000 - Number(parts.timestamp));
if (age > 300) return false;
var signedPayload = parts.timestamp + '.' + rawBody;
var expected = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
var expectedBuf = Buffer.from(expected, 'utf8');
return parts.signatures.some(function (sig) {
var sigBuf = Buffer.from(sig, 'utf8');
if (sigBuf.length !== expectedBuf.length) return false;
return crypto.timingSafeEqual(sigBuf, expectedBuf);
});
}
exports.handler = async function (event) {
if (event.httpMethod !== 'POST') {
return { statusCode: 405, body: 'Method Not Allowed' };
}
var webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
var serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!webhookSecret || !serviceRoleKey) {
console.error('Variables denvironnement manquantes.');
return { statusCode: 500, body: 'Server misconfigured' };
}
var rawBody = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
var signatureHeader = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
if (!verifyStripeSignature(rawBody, signatureHeader, webhookSecret)) {
console.error('Signature Stripe invalide.');
return { statusCode: 400, body: 'Invalid signature' };
}
var stripeEvent;
try {
stripeEvent = JSON.parse(rawBody);
} catch (e) {
return { statusCode: 400, body: 'Invalid JSON' };
}
if (stripeEvent.type !== 'checkout.session.completed') {
return { statusCode: 200, body: 'Ignored (event type not handled)' };
}
var session = stripeEvent.data && stripeEvent.data.object;
var paymentLinkId = session && session.payment_link;
var stockId = paymentLinkId && PAYMENT_LINK_TO_STOCK_ID[paymentLinkId];
if (!stockId) {
return { statusCode: 200, body: 'Ignored (payment link not tracked)' };
}
try {
var res = await fetch(SUPABASE_URL + '/rest/v1/rpc/decrement_stock', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
apikey: serviceRoleKey,
Authorization: 'Bearer ' + serviceRoleKey,
},
body: JSON.stringify({ p_id: stockId, p_qty: 1 }),
});
if (!res.ok) {
var errText = await res.text();
console.error('Echec decrement_stock Supabase:', res.status, errText);
return { statusCode: 500, body: 'Supabase update failed' };
}
} catch (e) {
console.error('Erreur reseau vers Supabase:', e);
return { statusCode: 500, body: 'Supabase request error' };
}
return { statusCode: 200, body: 'Stock decremente pour ' + stockId };
};
