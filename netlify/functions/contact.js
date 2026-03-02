/**
 * netlify/functions/contact.js
 * Netlify Functions wrapper — same logic as /api/contact.js but adapted
 * to Netlify's event/context signature.
 *
 * Environment variables (set in Netlify dashboard → Site Settings → Env Vars):
 *   RESEND_API_KEY    — from resend.com
 *   NOTIFY_EMAIL      — e.g. hello@mediamitra.in
 *   ALLOWED_ORIGIN    — e.g. https://mediamitra.in
 */

function sanitise(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen).replace(/[<>]/g, '');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidPhone(phone) {
  return /^[\d\s\+\-\(\)]{7,20}$/.test(phone);
}

async function sendEmail({ firstName, lastName, email, phone, service, budget, message, submittedAt }) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL || 'hello@mediamitra.in';

  if (!apiKey) {
    console.log('[DEV] Would send email:', { firstName, email });
    return;
  }

  const htmlBody = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:#0D47A1;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:1.3rem;">🚀 New Lead — MediaMitra</h1>
      </div>
      <div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;width:130px;">Name</td>
              <td style="padding:8px 0;font-weight:600;">${firstName} ${lastName}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;">Email</td>
              <td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;">Phone</td>
              <td style="padding:8px 0;">${phone}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;">Service</td>
              <td style="padding:8px 0;">${service || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;">Budget</td>
              <td style="padding:8px 0;">${budget || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;vertical-align:top;">Message</td>
              <td style="padding:8px 0;">${message || '—'}</td></tr>
        </table>
      </div>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    'MediaMitra Leads <leads@mediamitra.in>',
      to:      [notifyEmail],
      replyTo: email,
      subject: `🎯 New Lead: ${firstName} ${lastName} — ${service || 'General Enquiry'}`,
      html:    htmlBody,
    }),
  });

  if (!res.ok) throw new Error(`Resend ${res.status}`);
}

exports.handler = async function (event) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin':  allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ success: false, message: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ success: false, message: 'Invalid JSON' }) };
  }

  const firstName   = sanitise(body.firstName,  80);
  const lastName    = sanitise(body.lastName,    80);
  const email       = sanitise(body.email,       200);
  const phone       = sanitise(body.phone,       30);
  const service     = sanitise(body.service,     100);
  const budget      = sanitise(body.budget,      100);
  const message     = sanitise(body.message,     2000);
  const submittedAt = sanitise(body.submittedAt, 50);

  const errors = [];
  if (!firstName)              errors.push('First name required');
  if (!email)                  errors.push('Email required');
  if (!isValidEmail(email))    errors.push('Invalid email');
  if (!phone)                  errors.push('Phone required');
  if (!isValidPhone(phone))    errors.push('Invalid phone');

  if (errors.length) {
    return { statusCode: 422, headers: corsHeaders, body: JSON.stringify({ success: false, message: errors[0] }) };
  }

  if (body._hp) {
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
  }

  try {
    await sendEmail({ firstName, lastName, email, phone, service, budget, message, submittedAt });
  } catch (err) {
    console.error('Email error:', err);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ success: false, message: 'Send failed. Contact us directly.' }) };
  }

  console.log(JSON.stringify({ event: 'new_lead', name: `${firstName} ${lastName}`, email, service, timestamp: submittedAt }));

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ success: true, message: 'Thank you! We will contact you within 2 hours.' }),
  };
};
