# VN Aroma — Luxury Perfume E-commerce Store

A full-stack, responsive, boutique fragrance house e-commerce platform built for the premium unisex brand **VN Aroma** ("For Men & Women"). Positioned with a clean, high-contrast, black, cream, and gold aesthetic inspired by Byredo, Le Labo, and Jo Malone.

## 🚀 Tech Stack

- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS, Lucide icons, Framer Motion
- **Database**: Cloudflare D1 (serverless SQLite) + Drizzle ORM
- **Authentication**: JWT session tokens (jose) + Web Crypto API PBKDF2 password hashing (Edge-native)
- **Email Delivery**: Resend API calls via native `fetch` (Edge-compatible)
- **Payment Processing**: Razorpay Checkout integration with cryptographic signature verification (Edge-compatible)
- **Deployment Platform**: Cloudflare Pages / Workers (Runs fully on the Edge Runtime)

---

## 🛠️ Getting Started Locally

### 1. Install Dependencies
Run the package installation:
```bash
npm install
```

### 2. Configure Local Environment Variables
Create a `.env` file at the root of the project:
```bash
cp .env.example .env
```
Ensure the `.env` file has the following variables (mock placeholders can be kept to test checkout instantly):
```env
AUTH_SECRET="your_jwt_auth_secret_at_least_32_characters"
RAZORPAY_KEY_ID="rzp_test_placeholder"
RAZORPAY_KEY_SECRET="razorpay_secret_placeholder"
RESEND_API_KEY="re_placeholder"
EMAIL_FROM="VN Aroma <onboarding@resend.dev>"
```

### 3. Initialize & Seed D1 Database Bindings
We use Cloudflare's development platform simulation.
To boot the local development server (which spins up Miniflare under the hood to simulate the database and inject D1 bindings):
```bash
npm run dev
```

While the dev server is running, visit the database initialization URL in your web browser:
👉 **`http://localhost:3000/api/seed`**

This will automatically:
1. Create all SQLite database tables (`users`, `products`, `variants`, `orders`, `order_items`, `cart_items`) if they do not exist.
2. Hash and create the default admin user:
   - **Email**: `admin@vnaroma.com`
   - **Password**: `admin123`
3. Seed the database with 10 luxury perfumes (Lune Bleue, Épice Noire, Inhale, Bois Sacré, Ombre Rose, etc.), size variants (30ml, 50ml, 100ml), and the Discovery Trio gift set bundle.

---

## 🧪 Testing the E-commerce Flow Offline

We designed a built-in **Mock Payment Bypass** that triggers if the Razorpay credentials in your `.env` are left as placeholders:
1. Browse perfumes, select a size (e.g. 100ml Lune Bleue), and click **Add to Bag**.
2. Visit the **Bag** page and click **Proceed to Checkout**.
3. Fill out the shipping address and click **Pay with Razorpay**.
4. Since the keys are mock values, the checkout will automatically bypass the banking portal, create a mock payment, verify the signature, reduce stock levels, write the order to the database, print the purchase confirmation email to your console logs, and redirect you to the **Success** page!
5. Log in using `admin@vnaroma.com` / `admin123` and navigate to the **Admin Panel** (`/admin`) to inspect analytics, change order status, or restock item variants!

---

## ☁️ Deploying to Cloudflare Pages

### 1. Create a D1 Database
Create a production D1 instance in your Cloudflare dashboard or via Wrangler:
```bash
npx wrangler d1 create vn-aroma-db
```
Take the `database_id` returned and paste it into your `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "vn-aroma-db"
database_id = "your-database-id"
```

### 2. Configure Production Secrets
In the Cloudflare dashboard (under Pages Project > Settings > Functions > Variables) or via Wrangler, set your production secrets:
- `AUTH_SECRET` (generate a secure 32+ character random string)
- `RAZORPAY_KEY_ID` (your real test/live Razorpay Key ID)
- `RAZORPAY_KEY_SECRET` (your real test/live Razorpay Key Secret)
- `RESEND_API_KEY` (your real Resend API Key)
- `EMAIL_FROM` (your verified Resend domain email sender)

### 3. Deploy
Execute the Cloudflare compile and deployment script:
```bash
npm run pages:build
# Deploy via Wrangler
npx wrangler pages deploy .vercel/output
```
Once deployed, visit your production domain `/api/seed` once to execute production database seeding.
