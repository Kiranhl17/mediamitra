# 🚀 MediaMitra — Launch Guide
> Deploy by tomorrow. Follow these steps in order. Total time: ~25 minutes.

---

## 📁 Project Structure

```
mediamitra/
├── public/
│   └── index.html          ← Your entire website
├── api/
│   └── contact.js          ← Vercel serverless endpoint
├── netlify/
│   └── functions/
│       └── contact.js      ← Netlify serverless endpoint
├── .env.example            ← Env var template (safe to commit)
├── .gitignore              ← Keeps secrets out of Git
├── netlify.toml            ← Netlify config
├── vercel.json             ← Vercel config
├── package.json
└── README.md               ← This file
```

---

## ✅ STEP 1 — Get a Free Email API Key (5 min)

The contact form sends lead notifications to your inbox via **Resend** (free).

1. Go to **https://resend.com** → Sign Up (free)
2. Verify your email
3. Go to **API Keys** → Create API Key → copy it (starts with `re_`)
4. Go to **Domains** → Add your domain (e.g. `mediamitra.in`) → verify DNS
   - If you don't have a domain yet, Resend lets you send from `onboarding@resend.dev` for testing

> 💡 **Alternative:** Skip email for now and just check leads in your hosting dashboard logs. The form still works — leads are logged even without `RESEND_API_KEY`.

---

## ✅ STEP 2 — Push to GitHub (3 min)

```bash
# In the mediamitra/ folder:
git init
git add .
git commit -m "feat: initial launch — MediaMitra website"

# Create a new repo at github.com (name: mediamitra)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/mediamitra.git
git branch -M main
git push -u origin main
```

---

## ✅ STEP 3A — Deploy on Vercel (RECOMMENDED — 10 min)

Vercel is the easiest, fastest, and free for this use case.

### 3A.1 — Connect Repository
1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **"Add New Project"**
3. Import your `mediamitra` repo
4. Framework Preset: **Other** (it's a static site)
5. Root Directory: leave blank (`.`)
6. Click **Deploy**

### 3A.2 — Add Environment Variables
After deploy, go to:
**Project Settings → Environment Variables** → Add these:

| Name | Value |
|------|-------|
| `RESEND_API_KEY` | `re_your_key_here` |
| `NOTIFY_EMAIL` | `hello@mediamitra.in` |
| `ALLOWED_ORIGIN` | `https://mediamitra.vercel.app` *(update after adding custom domain)* |

Click **Save** → **Redeploy**

### 3A.3 — Add Custom Domain (optional, recommended)
1. Vercel Dashboard → Project → **Settings → Domains**
2. Add `mediamitra.in` and `www.mediamitra.in`
3. Vercel shows DNS records — add them in your domain registrar (GoDaddy / Namecheap / BigRock)
4. SSL is automatic ✅

**Your site is live at:** `https://mediamitra.vercel.app` (or your domain)

---

## ✅ STEP 3B — Deploy on Netlify (Alternative)

### 3B.1 — Connect Repository
1. Go to **https://netlify.com** → Sign up with GitHub
2. Click **"Add new site" → "Import an existing project"**
3. Connect GitHub → select `mediamitra`
4. Build command: *(leave blank)*
5. Publish directory: `public`
6. Click **Deploy site**

### 3B.2 — Add Environment Variables
**Site Settings → Environment variables** → Add:

| Key | Value |
|-----|-------|
| `RESEND_API_KEY` | `re_your_key_here` |
| `NOTIFY_EMAIL` | `hello@mediamitra.in` |
| `ALLOWED_ORIGIN` | `https://your-site.netlify.app` |

### 3B.3 — Add Custom Domain
**Domain settings → Add custom domain** → follow DNS instructions

---

## ✅ STEP 4 — Update WhatsApp Number (2 min)

In `public/index.html`, search for `wa.me/919999999999` and replace `919999999999` with your actual WhatsApp number:
- Format: country code + number, no spaces (e.g. India: `919876543210`)
- There are **2 instances** — replace both

---

## ✅ STEP 5 — Test the Contact Form (2 min)

1. Visit your live site
2. Fill the contact form with real details
3. Click submit
4. Check your `NOTIFY_EMAIL` inbox for the lead notification
5. Check Vercel/Netlify dashboard logs to confirm the API ran

---

## 🔐 Security Checklist

- [x] No API keys in frontend code
- [x] All form inputs sanitised (HTML injection stripped)
- [x] Email format validated server-side
- [x] Phone format validated server-side
- [x] Honeypot field to block basic bots
- [x] CORS headers restrict to your domain
- [x] Security headers (X-Frame-Options, CSP, etc.)
- [x] `.gitignore` prevents `.env` from being committed
- [ ] **TODO:** Add Cloudflare Turnstile or hCaptcha if spam becomes an issue

---

## 📊 Where to See Your Leads

| Source | Location |
|--------|----------|
| Email | Your `NOTIFY_EMAIL` inbox |
| Vercel logs | vercel.com → Project → Functions → contact → Logs |
| Netlify logs | app.netlify.com → Functions → contact → Logs |

---

## 🛠️ Local Development

```bash
# Install dev dependency
npm install

# Run locally (serves public/ on port 3000)
npm run dev

# Open http://localhost:3000
# Note: /api/contact won't work locally without Vercel CLI
```

### Testing API locally with Vercel CLI:
```bash
npm i -g vercel
vercel dev       # Runs site + API functions locally on port 3000
```

Create `.env.local` (copy from `.env.example`) with your test keys.

---

## 🚨 Troubleshooting

| Problem | Fix |
|---------|-----|
| Form shows error message | Check Vercel/Netlify function logs |
| Email not arriving | Verify `RESEND_API_KEY` is set; check Resend dashboard → Logs |
| CORS error in browser console | Make sure `ALLOWED_ORIGIN` matches your exact domain (no trailing slash) |
| 404 on `/api/contact` | Ensure `vercel.json` routes are correct; redeploy |
| Domain not resolving | DNS propagation takes up to 24h; use https://dnschecker.org |

---

## 📞 Quick Reference

- **Resend Dashboard:** https://resend.com/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard  
- **Netlify Dashboard:** https://app.netlify.com
- **DNS Checker:** https://dnschecker.org
- **SSL Test:** https://www.ssllabs.com/ssltest/

---

> Built with ❤️ for MediaMitra's launch day. Good luck! 🚀
