This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project ([create one here](https://app.supabase.com))
- An OpenAI API key

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new project at [Supabase](https://app.supabase.com)
   - Go to your project settings → API
   - Copy your project URL and anon key
   - Run the database migration:
     - Go to SQL Editor in your Supabase dashboard
     - Run the SQL from `supabase/migrations/001_create_sessions_table.sql`
     - Or use the Supabase CLI: `supabase db push`

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` and add:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `OPENAI_API_KEY` - Your OpenAI API key

4. **Run the development server:**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Features

- **User Authentication**: Sign up/sign in to access your session history across devices
- **Session History**: All your content analyses are saved and synced via Supabase
- **Migration**: Existing localStorage sessions are automatically migrated when you sign in
- **Offline Support**: Falls back to localStorage when not authenticated

### Database Schema

The app uses a `sessions` table in Supabase with Row Level Security (RLS) enabled. Each user can only access their own sessions. See `supabase/migrations/001_create_sessions_table.sql` for the schema.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
