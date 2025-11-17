# 🚀 Deployment Guide - CaptionCraft AI

Complete guide to deploying your video caption SaaS to production.

---

## 📦 Deployment Architecture

**Recommended Stack:**
- **Frontend:** Vercel (free tier works great)
- **Backend:** Railway or Render (Railway has better free tier)
- **Database:** SQLite (included) or upgrade to PostgreSQL
- **Storage:** Cloudflare R2 or AWS S3 (for production)
- **Payments:** Stripe (production mode)

---

## 🔧 Backend Deployment (Railway)

### Step 1: Prepare Backend

1. Create `backend/.gitignore` if not exists:
```
node_modules/
dist/
.env
data/
uploads/
*.db
```

2. Ensure `backend/package.json` has these scripts:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "tsx watch src/server.ts"
  }
}
```

### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set root directory to `backend`
5. Railway will auto-detect Node.js

### Step 3: Configure Environment Variables

In Railway dashboard, add these variables:

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.vercel.app
JWT_SECRET=generate-a-strong-random-string-here
GEMINI_API_KEY=your-actual-gemini-key
STRIPE_SECRET_KEY=sk_live_your-production-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_STARTER_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_CREDIT_PACK_SMALL=price_xxxxxxxxxxxxx
STRIPE_CREDIT_PACK_MEDIUM=price_xxxxxxxxxxxxx
STRIPE_CREDIT_PACK_LARGE=price_xxxxxxxxxxxxx
```

### Step 4: Get Your Backend URL

Railway will give you a URL like: `https://your-app.up.railway.app`

Copy this URL - you'll need it for frontend.

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Update Environment Variables

Create `.env.production`:
```env
VITE_API_URL=https://your-backend.up.railway.app/api
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Framework preset: Vite
5. Root directory: `./` (leave as is)
6. Build command: `npm run build`
7. Output directory: `dist`

### Step 3: Add Environment Variable

In Vercel dashboard:
- Go to Settings → Environment Variables
- Add `VITE_API_URL` = `https://your-backend.up.railway.app/api`
- Redeploy

---

## 💳 Stripe Production Setup

### Step 1: Activate Live Mode

1. Go to Stripe Dashboard
2. Toggle to "Live mode" (top right)
3. Complete account verification

### Step 2: Create Production Products

Create the same products as in test mode:

**Subscriptions:**
1. Starter - $14/month recurring
2. Pro - $39/month recurring

**Credit Packs:**
1. 50 minutes - $8 one-time
2. 150 minutes - $20 one-time
3. 500 minutes - $60 one-time

Copy all Price IDs to Railway environment variables.

### Step 3: Set Up Production Webhook

1. Go to Stripe → Developers → Webhooks
2. Add endpoint: `https://your-backend.up.railway.app/api/payment/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy webhook secret to Railway

### Step 4: Update API Keys

1. Get live secret key: Stripe → Developers → API keys
2. Update `STRIPE_SECRET_KEY` in Railway

---

## 🗄️ Database (Optional: PostgreSQL)

### For Scalability, Upgrade to PostgreSQL

**Using Railway:**
1. In Railway, click "New" → "Database" → "PostgreSQL"
2. Railway will provide `DATABASE_URL`
3. Install pg: `npm install pg`
4. Update `backend/src/config/database.ts` to use PostgreSQL
5. Add `DATABASE_URL` to environment variables

**Migration:**
```typescript
// Example PostgreSQL connection
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

---

## 🔐 Security Checklist

### Before Going Live:

- [ ] Generate strong `JWT_SECRET` (use: `openssl rand -base64 32`)
- [ ] Use Stripe live keys (not test keys)
- [ ] Enable HTTPS everywhere
- [ ] Set proper CORS origins (not `*`)
- [ ] Add rate limiting (already included)
- [ ] Enable Stripe webhook signature verification
- [ ] Set up error monitoring (Sentry)
- [ ] Add logging (Winston, Datadog)
- [ ] Enable SQL injection protection
- [ ] Sanitize user inputs
- [ ] Set secure HTTP headers (helmet already included)

### Update CORS Settings

In `backend/src/server.ts`:
```typescript
app.use(
  cors({
    origin: ['https://your-domain.com', 'https://your-frontend.vercel.app'],
    credentials: true,
  })
);
```

---

## 📊 Monitoring & Analytics

### 1. Error Tracking (Sentry)

```bash
npm install @sentry/node @sentry/tracing
```

Add to `backend/src/server.ts`:
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 2. Analytics (Google Analytics)

Add to `src/App.tsx`:
```typescript
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');
```

### 3. Uptime Monitoring

Use:
- UptimeRobot (free)
- Better Uptime
- Pingdom

Monitor endpoint: `https://your-backend.up.railway.app/api/health`

---

## 🚀 Post-Deployment Checklist

### Test Everything:

1. **Registration Flow**
   - [ ] Sign up with new email
   - [ ] Receive welcome (if implemented)
   - [ ] Login with credentials

2. **Free Tier**
   - [ ] Upload video
   - [ ] Generate captions
   - [ ] Export with watermark
   - [ ] Verify 10-minute quota

3. **Payment Flow**
   - [ ] Go to pricing page
   - [ ] Click "Get Started" on Starter
   - [ ] Complete Stripe checkout
   - [ ] Verify subscription in database
   - [ ] Check Stripe dashboard

4. **Subscription Features**
   - [ ] Upload video on paid tier
   - [ ] Verify no watermark
   - [ ] Check quota increased to 90 minutes
   - [ ] Export video

5. **Dashboard**
   - [ ] View usage stats
   - [ ] See transaction history
   - [ ] Access billing portal

6. **Webhooks**
   - [ ] Test subscription update
   - [ ] Test subscription cancellation
   - [ ] Verify database updates

---

## 💰 Cost Estimation

### Monthly Costs (Starter Scale: 100 users)

**Infrastructure:**
- Railway/Render: $5-20/month (free tier initially)
- Vercel: Free (upgrade at $20/mo for teams)
- Cloudflare R2: ~$1/month (optional)

**APIs:**
- Gemini API: ~$150/month (based on 1,500 min @ $0.075/min)
- Stripe fees: 2.9% + $0.30 per transaction

**Total:** ~$200-250/month for 100 paying users

**Revenue (100 users @ $14 avg):** $1,400/month

**Profit Margin:** ~82% 🎉

### At Scale (1,000 users):

- Revenue: $14,000/month
- Costs: ~$1,500/month (including Gemini volume discounts)
- **Profit:** ~$12,500/month

---

## 🎯 Growth Tips

### 1. Optimize Gemini Costs

- Negotiate volume pricing with Google (at 10k+ minutes)
- Cache common transcriptions
- Offer lower-quality transcription option

### 2. SEO Strategy

- Blog content targeting "how to add captions to video"
- YouTube tutorials
- Guest posts on creator blogs

### 3. Referral Program

```typescript
// Give 1 month free for every 3 referrals
if (referralCount >= 3) {
  grantFreeMonth(userId);
}
```

### 4. Partnerships

- Integrate with course platforms (Teachable, Kajabi)
- Partner with video editing tools
- Affiliate program (30% recurring)

---

## 🐛 Common Production Issues

### Issue: Database locked errors

**Solution:** Migrate to PostgreSQL in production

### Issue: Webhook not firing

**Solution:**
1. Check Stripe webhook URL
2. Verify endpoint is POST-accessible
3. Check webhook secret matches

### Issue: CORS errors

**Solution:**
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Issue: Large video uploads failing

**Solution:**
1. Increase Nginx/Railway body size limit
2. Implement chunked uploads
3. Use direct S3 uploads

---

## 📈 Scaling Beyond 1,000 Users

### When to Upgrade:

**10,000 users:**
- Move to dedicated PostgreSQL
- Add Redis for caching
- Implement queue system (Bull/RabbitMQ)
- CDN for video storage (CloudFront)

**100,000 users:**
- Kubernetes deployment
- Microservices architecture
- Dedicated Gemini instance
- Multi-region deployment

---

## ✅ Launch Checklist

- [ ] Backend deployed to Railway/Render
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] Stripe webhooks configured
- [ ] Production Stripe keys active
- [ ] Custom domain configured (optional)
- [ ] SSL certificates active
- [ ] Error monitoring set up
- [ ] Analytics installed
- [ ] Uptime monitoring configured
- [ ] Tested complete user journey
- [ ] Legal pages added (Terms, Privacy)
- [ ] Support email configured

---

## 🎉 You're Live!

Congratulations! Your SaaS is now in production.

### Next Steps:

1. Share on Product Hunt
2. Post in relevant communities
3. Reach out to first 10 customers personally
4. Iterate based on feedback
5. Scale when you hit 100 users

**Good luck building your business! 🚀**
