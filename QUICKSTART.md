# 🚀 QUICK START GUIDE - Deploy in 10 Minutes

## Step 1: Get Your Files Ready ✅

You already have the complete site! All files are in the `apex-intelligence` folder.

## Step 2: Install Dependencies (3 minutes)

```bash
cd apex-intelligence
npm install
```

This will install Next.js, React, Tailwind, and all dependencies.

## Step 3: Test Locally (2 minutes)

```bash
npm run dev
```

Open `http://localhost:3000` - Your site should be live locally!

## Step 4: Integrate Substack (5 minutes)

1. Go to your Substack settings
2. Find your "Subscribe" embed code
3. Open `/app/subscribe/page.tsx`
4. Replace the mock form around line 17-45 with your Substack embed

**Example Substack embed:**
```html
<iframe src="https://yourname.substack.com/embed" width="480" height="320" style="border:1px solid #EEE; background:white;" frameborder="0" scrolling="no"></iframe>
```

## Step 5: Deploy to Vercel (5 minutes)

### Option A: Vercel CLI (Fastest)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Option B: GitHub + Vercel Dashboard

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_URL
git push -u origin main
```

2. **Connect to Vercel:**
- Go to [vercel.com](https://vercel.com)
- Click "Import Project"
- Select your GitHub repo
- Click "Deploy"

## Step 6: Setup Custom Domain (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add `apexintelligence.io`
3. Add DNS records (Vercel will show you what to add)
4. Wait for DNS propagation (up to 24 hours)

---

## 🎯 IMMEDIATE NEXT STEPS

1. **Customize Content:**
   - Edit featured articles in `/app/page.tsx`
   - Add your story in `/app/about/page.tsx`
   - Update social proof in `/app/subscribe/page.tsx`

2. **Add Analytics:**
   - Vercel Analytics (built-in)
   - Google Analytics
   - Plausible

3. **SEO Setup:**
   - Update `/app/layout.tsx` metadata
   - Add `robots.txt`
   - Create `sitemap.xml`

4. **Newsletter Integration:**
   - Connect Substack
   - Or use ConvertKit, Mailchimp, etc.

---

## 🆘 TROUBLESHOOTING

### "Module not found" errors
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### Build fails on Vercel
- Check Node.js version (needs 18+)
- Review build logs in Vercel dashboard
- Ensure all files committed to git

### Styling looks broken
- Run `npm run build` locally first
- Clear browser cache
- Check Tailwind config

---

## 📱 WHAT TO TWEET

Once deployed, announce it on Twitter:

```
🚀 Just launched Apex Intelligence - your underground source for TCG market intel

Morning Brew aesthetic meets cyberpunk intelligence hub

✅ Free weekly analysis
✅ Market data & trends
✅ Collector community

Check it out → apexintelligence.io

Time to stop flying blind 🎯
```

---

## 🔥 BONUS: Add More Features

**Coming Soon (easy additions):**
- Discord integration
- Price tracking dashboard
- User accounts
- Comments on articles
- Search functionality

---

Need help? DM @apexcollectionz on Twitter!
