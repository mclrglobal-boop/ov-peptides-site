// Webhook Stripe : decremente automatiquement le stock d'une formule et
// genere/envoie un code d'acces des qu'un paiement "checkout.session.completed"
// est confirme.
//
// Variables d'environnement requises (a definir dans Netlify > Site configuration
// > Environment variables) :
//   STRIPE_WEBHOOK_SECRET     -> "Signing secret" (whsec_...) de l'endpoint webhook Stripe
//   SUPABASE_SERVICE_ROLE_KEY -> cle service_role du projet Supabase (Project Settings > API)
//   SUPABASE_URL              -> https://hhtwuaehgkwueyfiixyw.supabase.co (deja fixee ci-dessous,
//                                 mais peut etre surchargee via variable d'environnement)
//   RESEND_API_KEY            -> cle API Resend pour l'envoi d'email (optionnelle : si absente,
//                                 le code est quand meme genere et affiche sur la page de
//                                 confirmation, mais aucun email n'est envoye)
//   RESEND_FROM                -> adresse d'expedition (optionnelle, defaut ci-dessous)

const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hhtwuaehgkwueyfiixyw.supabase.co';

// Correspondance entre l'ID du Payment Link Stripe et l'identifiant du stock dans Supabase.
const PAYMENT_LINK_TO_STOCK_ID = {
  'plink_1TpqWVDRtn3CRDmVi8QXfpzT': 'decouverte',
  'plink_1TpqYODRtn3CRDmV21DeMPxN': 'intermediaire',
  'plink_1TpqbADRtn3CRDmV0lQ3SAKD': 'pro',
};

const FORMULE_LABELS = {
  decouverte: 'Formule Decouverte',
  intermediaire: 'Formule Intermediaire',
  pro: 'Formule Pro',
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

  // Tolerance de 5 minutes pour eviter les attaques par rejeu.
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

async function decrementStock(stockId, serviceRoleKey) {
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
    }
  } catch (e) {
    console.error('Erreur reseau vers Supabase (decrement_stock):', e);
  }
}

async function generateAccessCode(sessionId, email, formule, serviceRoleKey) {
  try {
    var res = await fetch(SUPABASE_URL + '/rest/v1/rpc/create_access_code_for_session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: 'Bearer ' + serviceRoleKey,
      },
      body: JSON.stringify({ p_session_id: sessionId, p_email: email, p_formule: formule || null }),
    });
    if (!res.ok) {
      var errText = await res.text();
      console.error('Echec create_access_code_for_session Supabase:', res.status, errText);
      return null;
    }
    var code = await res.json();
    return code;
  } catch (e) {
    console.error('Erreur reseau vers Supabase (create_access_code_for_session):', e);
    return null;
  }
}

async function sendAccessCodeEmail(email, code, formuleLabel) {
  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY absente : le code est genere mais aucun email n\'a ete envoye.');
    return;
  }
  var fromAddress = process.env.RESEND_FROM || 'OV Peptides <onboarding@resend.dev>';
  try {
    var res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: 'Votre code d\'acces - OV Peptides',
        html:
          '<p>Merci pour votre commande (' + (formuleLabel || 'votre cure') + ').</p>' +
          '<p>Voici votre code d\'acces personnel pour creer votre espace membre et suivre votre cure :</p>' +
          '<p style="font-size:24px;font-weight:bold;letter-spacing:2px;">' + code + '</p>' +
          '<p>Rendez-vous sur la page d\'inscription du site et saisissez ce code avec la meme adresse email pour activer votre espace client.</p>',
      }),
    });
    if (!res.ok) {
      var errText = await res.text();
      console.error('Echec envoi email Resend:', res.status, errText);
    }
  } catch (e) {
    console.error('Erreur reseau vers Resend:', e);
  }
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  var webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  var serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookSecret || !serviceRoleKey) {
    console.error('Variables d\'environnement manquantes (STRIPE_WEBHOOK_SECRET / SUPABASE_SERVICE_ROLE_KEY).');
    return { statusCode: 500, body: 'Server misconfigured' };
  }

  var rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : (event.body || '');

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
  var customerEmail =
    session &&
    ((session.customer_details && session.customer_details.email) || session.customer_email);

  // 1) Decrement du stock (si le Payment Link correspond a une formule suivie).
  if (stockId) {
    await decrementStock(stockId, serviceRoleKey);
  }

  // 2) Generation du code d'acces + envoi email (si on a bien une adresse email et un ID de session).
  if (customerEmail && session && session.id) {
    var formuleLabel = stockId ? FORMULE_LABELS[stockId] : null;
    var code = await generateAccessCode(session.id, customerEmail, stockId, serviceRoleKey);
    if (code) {
      await sendAccessCodeEmail(customerEmail, code, formuleLabel);
    }
  }

  return { statusCode: 200, body: 'OK' };
};
