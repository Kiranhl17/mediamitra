/**
 * MediaMitra — /api/contact.js
 * ─────────────────────────────────────────────────────────────────
 * Receives form submissions and sends a lead email to Gmail.
 *
 * SETUP (5 minutes):
 * 1. Google Account → Security → 2-Step Verification → Turn ON
 * 2. Go to: https://myaccount.google.com/apppasswords
 * 3. Select App: Mail, Device: Other → name it "MediaMitra" → Generate
 * 4. Copy the 16-character password shown
 *
 * Add these in Vercel Dashboard → Project → Settings → Environment Variables:
 *   GMAIL_USER     →  mediamitra05@gmail.com
 *   GMAIL_PASS     →  abcdefghijklmnop  (16-char app password, no spaces)
 *   NOTIFY_EMAIL   →  mediamitra05@gmail.com
 *   ALLOWED_ORIGIN →  https://your-site.vercel.app
 */

import nodemailer from 'nodemailer';

function sanitise(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen).replace(/[<>]/g, '');
}
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }
function isValidPhone(p) { return /^[\d\s\+\-\(\)]{7,20}$/.test(p); }

function buildEmailHTML({ firstName, lastName, email, phone, service, budget, message, submittedAt }) {
  return `
  <!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:620px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#0D47A1,#1565C0);padding:32px 36px;">
        <h1 style="color:#fff;margin:0;font-size:1.4rem;font-weight:800;">🎯 New Lead Alert!</h1>
        <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:0.85rem;">MediaMitra — Book Free Strategy Call</p>
      </div>
      <div style="padding:32px 36px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;width:140px;font-size:0.78rem;font-weight:700;color:#9CA3AF;text-transform:uppercase;">Name</td>
              <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-weight:700;color:#111827;">${firstName} ${lastName || ''}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:0.78rem;font-weight:700;color:#9CA3AF;text-transform:uppercase;">Email</td>
              <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;"><a href="mailto:${email}" style="color:#0D47A1;font-weight:600;">${email}</a></td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:0.78rem;font-weight:700;color:#9CA3AF;text-transform:uppercase;">Phone</td>
              <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;"><a href="tel:${phone}" style="color:#0D47A1;font-weight:600;">${phone}</a></td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:0.78rem;font-weight:700;color:#9CA3AF;text-transform:uppercase;">Service</td>
              <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;"><span style="background:#EFF6FF;color:#1D4ED8;padding:4px 12px;border-radius:50px;font-size:0.85rem;font-weight:600;">${service || 'Not specified'}</span></td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:0.78rem;font-weight:700;color:#9CA3AF;text-transform:uppercase;">Budget</td>
              <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;"><span style="background:#FFF7ED;color:#C2410C;padding:4px 12px;border-radius:50px;font-size:0.85rem;font-weight:600;">${budget || 'Not specified'}</span></td></tr>
          ${message ? `<tr><td style="padding:12px 0;vertical-align:top;font-size:0.78rem;font-weight:700;color:#9CA3AF;text-transform:uppercase;">Message</td>
              <td style="padding:12px 0;color:#374151;line-height:1.65;">${message}</td></tr>` : ''}
        </table>
      </div>
      <div style="padding:0 36px 32px;display:flex;gap:12px;">
        <a href="mailto:${email}?subject=Re: Your MediaMitra Consultation"
           style="display:inline-block;background:#FF6F00;color:#fff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:700;font-size:0.95rem;">
          ✉️ Reply to ${firstName} →
        </a>
      </div>
      <div style="background:#F9FAFB;padding:20px 36px;border-top:1px solid #E5E7EB;">
        <p style="margin:0;font-size:0.78rem;color:#9CA3AF;">
          Submitted: ${new Date(submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
        </p>
      </div>
    </div>
  </body></html>`;
}

export default async function handler(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ success: false, message: 'Method not allowed' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ success: false, message: 'Invalid request' }); }

  const firstName   = sanitise(body.firstName, 80);
  const lastName    = sanitise(body.lastName, 80);
  const email       = sanitise(body.email, 200);
  const phone       = sanitise(body.phone, 30);
  const service     = sanitise(body.service, 100);
  const budget      = sanitise(body.budget, 100);
  const message     = sanitise(body.message, 2000);
  const submittedAt = body.submittedAt || new Date().toISOString();

  const errors = [];
  if (!firstName)           errors.push('First name is required');
  if (!isValidEmail(email)) errors.push('Valid email is required');
  if (!isValidPhone(phone)) errors.push('Valid phone is required');
  if (errors.length) return res.status(422).json({ success: false, message: errors[0] });
  if (body._hp)      return res.status(200).json({ success: true });

  // Dev mode — no env vars set yet
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.log('[DEV MODE] Lead received:', { firstName, email, phone, service, budget });
    return res.status(200).json({ success: true, message: 'Thank you! We will contact you within 2 hours.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
    });

    await transporter.sendMail({
      from:    `"MediaMitra Leads" <${process.env.GMAIL_USER}>`,
      to:      process.env.NOTIFY_EMAIL || process.env.GMAIL_USER,
      replyTo: email,
      subject: `🎯 New Lead: ${firstName} ${lastName} — ${service || 'General Enquiry'}`,
      html:    buildEmailHTML({ firstName, lastName, email, phone, service, budget, message, submittedAt }),
    });

    console.log(JSON.stringify({ event: 'new_lead', name: `${firstName} ${lastName}`, email, phone, service }));
    return res.status(200).json({ success: true, message: 'Thank you! We will contact you within 2 hours.' });

  } catch (err) {
    console.error('Email error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not send. Please contact us on WhatsApp.' });
  }
}
