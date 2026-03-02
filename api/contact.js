/**
 * MediaMitra — /api/contact.js
 * Uses Resend API (free, no npm package needed — pure fetch)
 *
 * SETUP:
 * 1. Go to https://resend.com → Sign up free
 * 2. Click "API Keys" → Create API Key → copy it
 * 3. In Vercel: Settings → Environment Variables → ADD:
 *    RESEND_API_KEY  =  re_xxxxxxxxxxxxxxxxx
 *    NOTIFY_EMAIL    =  mediamitra05@gmail.com
 *    ALLOWED_ORIGIN  =  https://mediamitra.vercel.app
 */

function sanitise(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen).replace(/[<>]/g, '');
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

function isValidPhone(p) {
  return /^[\d\s\+\-\(\)]{7,20}$/.test(p);
}

function buildHTML({ firstName, lastName, email, phone, service, budget, message, submittedAt }) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0D47A1,#1565C0);padding:28px 32px;">
      <h1 style="color:#fff;margin:0;font-size:1.3rem;">🎯 New Lead — MediaMitra</h1>
      <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:0.85rem;">Book Free Strategy Call Form</p>
    </div>
    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#9CA3AF;font-size:0.8rem;text-transform:uppercase;width:130px;">Name</td>
            <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:700;color:#111;">${firstName} ${lastName || ''}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#9CA3AF;font-size:0.8rem;text-transform:uppercase;">Email</td>
            <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><a href="mailto:${email}" style="color:#0D47A1;font-weight:600;">${email}</a></td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#9CA3AF;font-size:0.8rem;text-transform:uppercase;">Phone</td>
            <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><a href="tel:${phone}" style="color:#0D47A1;font-weight:600;">${phone}</a></td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#9CA3AF;font-size:0.8rem;text-transform:uppercase;">Service</td>
            <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><span style="background:#EFF6FF;color:#1D4ED8;padding:3px 10px;border-radius:20px;font-size:0.85rem;">${service || 'Not specified'}</span></td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#9CA3AF;font-size:0.8rem;text-transform:uppercase;">Budget</td>
            <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><span style="background:#FFF7ED;color:#C2410C;padding:3px 10px;border-radius:20px;font-size:0.85rem;">${budget || 'Not specified'}</span></td></tr>
        ${message ? `<tr><td style="padding:10px 0;color:#9CA3AF;font-size:0.8rem;text-transform:uppercase;vertical-align:top;">Message</td>
            <td style="padding:10px 0;color:#374151;line-height:1.6;">${message}</td></tr>` : ''}
      </table>
    </div>
    <div style="padding:0 32px 28px;">
      <a href="mailto:${email}?subject=Re: MediaMitra Consultation" style="display:inline-block;background:#FF6F00;color:#fff;padding:12px 24px;border-radius:50px;text-decoration:none;font-weight:700;">✉️ Reply to ${firstName}</a>
    </div>
    <div style="background:#F9FAFB;padding:16px 32px;border-top:1px solid #E5E7EB;">
      <p style="margin:0;font-size:0.75rem;color:#9CA3AF;">Submitted: ${submittedAt} • mediamitra.vercel.app</p>
    </div>
  </div>
</body></html>`;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  // Parse
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ success: false, message: 'Invalid request' }); }

  // Sanitise
  const firstName   = sanitise(body.firstName, 80);
  const lastName    = sanitise(body.lastName, 80);
  const email       = sanitise(body.email, 200);
  const phone       = sanitise(body.phone, 30);
  const service     = sanitise(body.service, 100);
  const budget      = sanitise(body.budget, 100);
  const message     = sanitise(body.message, 2000);
  const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

  // Validate
  if (!firstName)           return res.status(422).json({ success: false, message: 'First name is required' });
  if (!isValidEmail(email)) return res.status(422).json({ success: false, message: 'Valid email is required' });
  if (!isValidPhone(phone)) return res.status(422).json({ success: false, message: 'Valid phone is required' });
  if (body._hp)             return res.status(200).json({ success: true });

  const apiKey      = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL || 'mediamitra05@gmail.com';

  // No API key — log only (dev mode)
  if (!apiKey) {
    console.log('LEAD:', JSON.stringify({ firstName, lastName, email, phone, service, budget, message }));
    return res.status(200).json({ success: true, message: 'Thank you! We will contact you within 2 hours.' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:     'MediaMitra Leads <onboarding@resend.dev>',
        to:       [notifyEmail],
        reply_to: email,
        subject:  `🎯 New Lead: ${firstName} ${lastName} — ${service || 'General Enquiry'}`,
        html:     buildHTML({ firstName, lastName, email, phone, service, budget, message, submittedAt }),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', JSON.stringify(data));
      throw new Error(data.message || 'Resend API failed');
    }

    console.log('Lead sent:', JSON.stringify({ firstName, email, phone, service }));
    return res.status(200).json({ success: true, message: 'Thank you! We will contact you within 2 hours.' });

  } catch (err) {
    console.error('Send error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not send. Please contact us on WhatsApp.' });
  }
}
