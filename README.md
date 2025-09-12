# Budget Tracker Application

A modern, full-stack budget tracking application built with Next.js, TypeScript, and Supabase. This application helps users manage their projects, track payments, and monitor financial transactions.

## Features

- 🔐 Authentication with Supabase Auth
- 📊 Project and transaction management
- 📱 Responsive design for all devices
- ⚡ Optimized for performance
- 🔒 Secure with proper authentication and authorization
- 📈 Analytics and reporting
- 🔄 Real-time updates

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel
- **Analytics**: Google Analytics, PostHog (optional)
- **Monitoring**: Sentry (optional)

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account
- Vercel account (for deployment)
- Google Analytics account (optional)
- PostHog account (optional)
- Sentry account (optional)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/budget-tracker.git
cd budget-tracker
```

### 2. Install dependencies

```bash
npm install
# or
yarn
# or
pnpm install
```

### 3. Set up environment variables

Copy the `.env.example` file to `.env.local` and update the values:

```bash
cp .env.example .env.local
```

Update the following environment variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Optional: Error Tracking
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 4. Set up the database

1. Create a new project in Supabase
2. Run the SQL migrations from the `migrations` folder in the Supabase SQL editor
3. Enable Row Level Security (RLS) on your tables
4. Set up the necessary storage buckets if using file uploads

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Deployment

### Deploy to Vercel

The easiest way to deploy this application is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

1. Push your code to a GitHub/GitLab/Bitbucket repository
2. Import the project into Vercel
3. Add your environment variables in the Vercel project settings
4. Deploy!

### Environment Variables for Production

Make sure to set the following environment variables in your production environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)
- `NODE_ENV=production`

## Database Migrations

To create and run new database migrations:

1. Create a new migration file in the `migrations` folder with the format `YYYYMMDD_description.sql`
2. Run the migration in the Supabase SQL editor

## Testing

Run the test suite with:

```bash
npm run test
# or
yarn test
# or
pnpm test
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/yourusername/budget-tracker/issues) on GitHub.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
