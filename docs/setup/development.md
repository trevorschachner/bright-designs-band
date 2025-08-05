# Local Development Setup

## Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database
- Supabase account (for authentication and storage)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/trevorschachner/bright-designs-band.git
   cd bright-designs-band
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   pnpm db:migrate
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

## Development Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linting
- `pnpm type-check` - Run TypeScript checks
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open database studio

## Project Structure

```
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── components/     # App-specific components
│   └── (pages)/        # Page components
├── components/         # Reusable UI components
│   ├── ui/            # Base UI components (shadcn/ui)
│   └── filters/       # Filter system components
├── lib/               # Utility libraries
│   ├── db/           # Database configuration
│   ├── filters/      # Filtering system
│   └── auth/         # Authentication utilities
├── hooks/            # Custom React hooks
├── docs/             # Documentation
└── public/           # Static assets
```

## Database

The application uses PostgreSQL with Drizzle ORM. Key tables:
- `shows` - Show information
- `arrangements` - Arrangement details
- `tags` - Tag system
- `files` - File management
- `shows_to_tags` - Many-to-many relationship

## Authentication

Authentication is handled through Supabase with support for:
- Email/password authentication
- OAuth providers (Google, etc.)
- Role-based access control

## File Storage

File uploads are managed through Supabase Storage with:
- Secure file uploads
- Public/private file access
- Automatic file optimization

---

**Need Help?** Check the troubleshooting section or create an issue on GitHub.