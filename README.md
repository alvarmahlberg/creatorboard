# CreatorBoard - Live Creator Coins Dashboard

Live market data dashboard for Zora ecosystem creator coins. Shows real-time market cap, volume, price changes, and age data for the top creator coins.

## Features

- **Live Market Data** - Real-time updates every 60 seconds
- **Top 100 Creator Coins** - Market cap and top gainers views
- **Interactive Sorting** - Sort by market cap, volume, price change, age
- **Mobile Optimized** - Responsive design for all devices
- **Dark Mode** - Default dark theme with toggle
- **Creator Profiles** - Avatars, handles, and display names

## Tech Stack

- **Next.js 14** - React framework
- **Zora SDK** - Blockchain data integration
- **SWR** - Data fetching and caching
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **TypeScript** - Type safety

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your ZORA_API_KEY to .env.local

# Run development server
pnpm dev
```

## Environment Variables

Create `.env.local` file:

```env
ZORA_API_KEY=your_zora_api_key_here
```

## API Endpoints

- `/api/top-creators` - Top 100 creator coins by market cap
- `/api/top-gainers` - Top 100 creator coins by 24h change
- `/api/creator/coin?identifier=...` - Single creator coin data
- `/api/creator/coins/batch?identifiers=a,b,c` - Batch creator coins data

## Deployment

This project is optimized for Vercel deployment. Simply connect your GitHub repository to Vercel for automatic deployments.

## License

MIT
