# Apex Intelligence - TCG Market Intel Platform

A cyberpunk-themed TCG market intelligence platform built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Cyberpunk aesthetic** with neon accents and dark mode design
- **Newsletter integration** ready for Substack or custom backend
- **Responsive design** optimized for all devices
- **Performance optimized** with Next.js App Router
- **SEO ready** with metadata and OpenGraph tags
- **Animated UI** using Framer Motion

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Vercel account (for deployment)

## 🛠️ Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Run development server:**
```bash
npm run dev
```

3. **Open your browser:**
Navigate to `http://localhost:3000`

## 📝 Configuration

### Newsletter Integration

1. Get your Substack embed code or API integration
2. Replace the form in `/app/subscribe/page.tsx` with your embed code
3. Update the `handleSubmit` function for your backend integration

### Content Management

- Edit articles in `/app/intel/page.tsx`
- Add new pages in the `/app` directory
- Customize colors in `/tailwind.config.js`

### Styling

Colors can be customized in `tailwind.config.js`:
- `neon-pink`: #FF006E
- `neon-cyan`: #00F5FF
- `neon-purple`: #B026FF
- `cyber-dark`: #0A0E27

## 🚀 Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel
```

4. **Deploy to production:**
```bash
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Configure project:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Click "Deploy"

### Custom Domain Setup

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add `apexintelligence.io`
4. Follow DNS configuration instructions
5. Wait for DNS propagation (can take up to 48 hours)

## 📁 Project Structure

```
apex-intelligence/
├── app/
│   ├── about/          # About page
│   ├── intel/          # Intelligence archive
│   ├── subscribe/      # Newsletter signup
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Homepage
│   └── globals.css     # Global styles
├── components/
│   ├── Navigation.tsx  # Main navigation
│   └── ui/            # Reusable UI components
├── public/            # Static assets
├── data/              # Content data
└── package.json
```

## 🎨 Customization

### Adding New Articles

Edit the `articles` array in `/app/intel/page.tsx`:

```typescript
{
  slug: 'article-url-slug',
  title: 'Article Title',
  excerpt: 'Brief description...',
  date: 'Oct 25, 2024',
  readTime: '8 min read',
  category: 'Market Analysis',
  isPremium: false
}
```

### Creating New Pages

1. Create a new folder in `/app/your-page`
2. Add a `page.tsx` file
3. The route will automatically be `/your-page`

### Modifying Navigation

Edit the `navItems` array in `/components/Navigation.tsx`

## 🔧 Environment Variables

Create a `.env.local` file for environment variables:

```env
NEXT_PUBLIC_SITE_URL=https://apexintelligence.io
# Add your API keys and secrets here
```

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### Build errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Deployment issues
- Check Vercel logs in dashboard
- Ensure all environment variables are set
- Verify Node.js version (18+)

## 📄 License

Private project - All rights reserved

## 🤝 Support

For issues or questions:
- Twitter: [@TCGAISociety](https://twitter.com/TCGAISociety)
- Website: [apexintelligence.io](https://apexintelligence.io)

---

Built with ❤️ for the TCG community
