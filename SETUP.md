# CaptionCraft AI - Setup Guide

## 🚀 Full-Stack Video Caption SaaS Platform

This is a complete implementation of a monetizable video caption generator with:
- User authentication & authorization
- Stripe payment integration
- Usage-based quota system
- AI-powered caption generation (Gemini 2.0 Flash)
- Real-time caption editor
- Multi-tier subscription system

---

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Gemini API key (get from https://ai.google.dev/)
- Stripe account (for payments)

---

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Configuration

#### Frontend (.env)
Create `.env` in the root directory:

```env
VITE_API_URL=http://localhost:3001/api
```

#### Backend (backend/.env)
Create `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Gemini API
GEMINI_API_KEY=your-gemini-api-key-here

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_STARTER_PRICE_ID=price_starter_monthly
STRIPE_PRO_PRICE_ID=price_pro_monthly
STRIPE_CREDIT_PACK_SMALL=price_credit_50min
STRIPE_CREDIT_PACK_MEDIUM=price_credit_150min
STRIPE_CREDIT_PACK_LARGE=price_credit_500min
```

---

## 🎯 Setting Up Stripe

### 1. Create Products & Prices in Stripe Dashboard

Go to Stripe Dashboard → Products → Add Product

**Create these products:**

1. **Starter Subscription**
   - Name: Starter
   - Price: $14/month (recurring)
   - Copy the Price ID to `STRIPE_STARTER_PRICE_ID`

2. **Pro Subscription**
   - Name: Pro
   - Price: $39/month (recurring)
   - Copy the Price ID to `STRIPE_PRO_PRICE_ID`

3. **Credit Pack - Small**
   - Name: 50 Minutes Credit Pack
   - Price: $8 (one-time)
   - Copy the Price ID to `STRIPE_CREDIT_PACK_SMALL`

4. **Credit Pack - Medium**
   - Name: 150 Minutes Credit Pack
   - Price: $20 (one-time)
   - Copy the Price ID to `STRIPE_CREDIT_PACK_MEDIUM`

5. **Credit Pack - Large**
   - Name: 500 Minutes Credit Pack
   - Price: $60 (one-time)
   - Copy the Price ID to `STRIPE_CREDIT_PACK_LARGE`

### 2. Set Up Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `http://localhost:3001/api/payment/webhook` (for development)
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

---

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

---

## 📊 Database

The app uses SQLite by default (file-based, no setup needed).

Database file will be created at: `backend/data/captioncraftai.db`

To reset the database, simply delete this file and restart the backend.

### Migration to PostgreSQL (Production)

To use PostgreSQL instead:
1. Install `pg` package
2. Update `backend/src/config/database.ts`
3. Set `DATABASE_URL` in environment variables

---

## 🧪 Testing the Flow

### 1. Create an Account
- Go to http://localhost:5173
- Click "Get Started"
- Register with email/password

### 2. Test Free Tier
- You start with 10 minutes free
- Upload a video
- Generate AI captions
- Edit and export

### 3. Test Subscription Upgrade
- Go to Pricing page
- Click "Get Started" on Starter plan
- Use Stripe test cards:
  - Success: `4242 4242 4242 4242`
  - Requires auth: `4000 0027 6000 3184`

### 4. Test Usage Tracking
- Process multiple videos
- Watch minutes quota decrease
- Check dashboard for stats

---

## 🌐 Deployment

### Backend (Railway / Render)

1. Push code to GitHub
2. Connect Railway/Render to your repo
3. Set environment variables
4. Update `FRONTEND_URL` to your production domain
5. Update Stripe webhook URL to production endpoint

### Frontend (Vercel / Netlify)

1. Connect to GitHub repo
2. Set `VITE_API_URL` to your backend URL
3. Deploy

### Important for Production

- Change `JWT_SECRET` to a strong random string
- Use production Stripe keys
- Enable HTTPS
- Set up proper CORS origins
- Add rate limiting
- Set up monitoring (Sentry, LogRocket)

---

## 💰 Pricing Tiers

| Tier | Price | Minutes | Features |
|------|-------|---------|----------|
| Free | $0 | 10/mo | 720p, watermark |
| Starter | $14/mo | 90/mo | 1080p, no watermark, priority |
| Pro | $39/mo | 360/mo | 4K, API access, batch processing |

### Credit Packs (One-time)
- 50 minutes: $8
- 150 minutes: $20
- 500 minutes: $60

---

## 🔑 API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/usage` - Get usage stats

### Video
- `POST /api/video/generate-captions` - Generate captions
- `GET /api/video/history` - Get video history
- `GET /api/video/transactions` - Get transaction history

### Payment
- `GET /api/payment/pricing` - Get pricing info
- `POST /api/payment/create-checkout-session` - Create Stripe session
- `POST /api/payment/create-portal-session` - Billing portal
- `POST /api/payment/webhook` - Stripe webhook

---

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**Database locked error:**
- Stop all backend processes
- Delete `backend/data/captioncraftai.db`
- Restart backend

**Stripe webhook not working locally:**
- Use Stripe CLI: `stripe listen --forward-to localhost:3001/api/payment/webhook`
- Or use ngrok for testing

**CORS errors:**
- Check `FRONTEND_URL` in backend .env
- Make sure frontend is running on correct port

---

## 📈 Next Steps

1. **Add Analytics** - Google Analytics, Mixpanel
2. **Email Notifications** - Welcome emails, quota alerts
3. **Social Auth** - Google, GitHub OAuth
4. **API Documentation** - Swagger/OpenAPI
5. **Admin Dashboard** - User management, analytics
6. **Referral Program** - Track referrals, rewards
7. **Template Library** - Pre-styled caption templates
8. **Multi-language** - Auto-translate captions

---

## 📝 License

MIT License - feel free to use this for your own projects!

---

## 🎉 You're All Set!

Start the backend and frontend, create an account, and start generating captions!

For questions or issues, check the console logs or open an issue on GitHub.
