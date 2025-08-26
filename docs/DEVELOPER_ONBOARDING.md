# Developer Onboarding Guide - Bright Designs Band

Welcome to the Bright Designs Band codebase! This guide will help you understand the project structure and get up to speed quickly.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (package manager)
- TypeScript knowledge
- React/Next.js experience

### Setup
```bash
git clone <repository>
cd bright-designs-band
pnpm install
pnpm dev
```

## 📁 Project Structure

```
├── app/                    # Next.js 13+ App Router
│   ├── (routes)/          # Page components
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui primitives
│   ├── features/         # Business logic components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── index.ts          # Component exports hub
├── lib/                   # Utilities and configuration
│   ├── database/         # Database schema and queries
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Helper functions
│   └── types/            # TypeScript definitions
├── docs/                  # Documentation
└── config/               # Site configuration
```

## 🎨 Component System

### Design System
We use **shadcn/ui** components with custom styling:
- Consistent color palette
- Responsive design patterns
- Accessible by default

### Component Categories

#### 1. **UI Primitives** (`components/ui/`)
- Button, Card, Input, etc.
- Pre-built, customizable
- Import from component index

#### 2. **Feature Components** (`components/features/`)
- Business-specific functionality
- ShowCard, AudioPlayer, FileUpload
- Composed of UI primitives

#### 3. **Layout Components** (`components/layout/`)
- SiteHeader, SiteFooter
- Page structure components

#### 4. **Form Components** (`components/forms/`)
- InquiryForm, CheckAvailabilityModal
- Validation with Zod schemas

### Import Pattern
```tsx
// ✅ Good - Use component index
import { Button, Card, ShowCard } from '@/components'

// ❌ Avoid - Direct imports
import { Button } from '@/components/ui/button'
```

## 🔧 Key Patterns

### 1. **Loading States**
Always implement skeleton loading:
```tsx
import { ShowCard, ShowCardSkeleton } from '@/components'

{isLoading ? <ShowCardSkeleton /> : <ShowCard item={data} />}
```

### 2. **Error Handling**
Use toast notifications:
```tsx
import { toast } from '@/components'

toast({
  title: "Success!",
  description: "Operation completed",
})
```

### 3. **Navigation**
Use breadcrumbs for complex pages:
```tsx
import { Breadcrumb, BreadcrumbList, BreadcrumbItem } from '@/components'

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Current Page</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### 4. **Form Validation**
All forms use Zod + react-hook-form:
```tsx
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
})

const form = useForm<FormData>({
  resolver: zodResolver(schema),
})
```

### 5. **Help Text**
Use tooltips for user guidance:
```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components'

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      <HelpCircle className="h-4 w-4" />
    </TooltipTrigger>
    <TooltipContent>
      <p>Helpful explanation here</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## 🗄️ Database

### Technology Stack
- **Supabase** - PostgreSQL database
- **Drizzle ORM** - Type-safe database operations
- **Zod** - Runtime validation

### Schema Location
- `lib/database/schema.ts` - Table definitions
- `lib/database/queries.ts` - Common queries
- `supabase/migrations/` - Database migrations

### Query Pattern
```tsx
import { db } from '@/lib/database'
import { shows } from '@/lib/database/schema'

const featuredShows = await db.query.shows.findMany({
  limit: 6,
  with: {
    showsToTags: {
      with: { tag: true }
    }
  }
})
```

## 🎯 Key Features

### 1. **Show Management**
- Show listings with filtering
- Detailed show pages
- Audio/video integration
- File management

### 2. **User System**
- Authentication via Supabase Auth
- Role-based permissions
- Profile management

### 3. **Contact System**
- Inquiry forms
- Email integration with Resend
- Lead management

### 4. **SEO Optimization**
- Structured data
- Meta tag management
- Performance monitoring

## 🚨 Important Notes

### Do's ✅
- Use TypeScript for all new code
- Implement loading states with skeletons
- Add proper error handling
- Use the component index for imports
- Follow existing naming conventions
- Add tooltips for complex UI elements

### Don'ts ❌
- Don't create duplicate components
- Don't bypass the design system
- Don't skip error handling
- Don't hardcode strings (use config)
- Don't ignore accessibility
- Don't create files with -2 suffix

## 🔍 Common Tasks

### Adding a New Page
1. Create page in `app/` directory
2. Add to navigation config if needed
3. Implement breadcrumbs
4. Add loading states
5. Test responsive design

### Creating a Component
1. Determine category (ui/features/forms/layout)
2. Use TypeScript interfaces
3. Add to component index
4. Include loading/error states
5. Document props

### Database Changes
1. Update schema in `lib/database/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Apply migration: `pnpm db:push`
4. Update types if needed

### Adding Features
1. Plan component structure
2. Create reusable primitives first
3. Compose into feature components
4. Add proper validation
5. Test all states (loading, error, success)

## 📚 Resources

- **Design System**: Browse `components/ui/` for available primitives
- **Examples**: Look at existing pages in `app/`
- **Types**: Check `lib/types/` for data structures
- **Config**: Site configuration in `config/site.ts`
- **Docs**: Feature documentation in `docs/features/`

## 🐛 Troubleshooting

### Common Issues
1. **Import errors**: Use component index (`@/components`)
2. **Type errors**: Check schema definitions
3. **Database errors**: Verify connection and permissions
4. **Build errors**: Check TypeScript and linting

### Getting Help
1. Check existing documentation
2. Look at similar implementations
3. Review code patterns in the codebase
4. Ask questions with specific context

---

**Welcome to the team! Happy coding! 🎵**
