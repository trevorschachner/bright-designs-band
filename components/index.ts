// ============================================================================
// BRIGHT DESIGNS BAND - COMPONENT INDEX
// ============================================================================
// Central export hub for all components to improve developer experience
// Usage: import { Button, ShowCard } from '@/components'

// ============================================================================
// UI COMPONENTS (shadcn/ui)
// ============================================================================
export { Button, buttonVariants } from './ui/button'
export { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
export { Badge, badgeVariants } from './ui/badge'
export { Input } from './ui/input'
export { Label } from './ui/label'
export { Textarea } from './ui/textarea'
export { Alert, AlertDescription, AlertTitle } from './ui/alert'
export { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from './ui/alert-dialog'
export { AspectRatio } from './ui/aspect-ratio'
export { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
export { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './ui/breadcrumb'
export { Checkbox } from './ui/checkbox'
export { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from './ui/dialog'
export { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu'
export { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from './ui/form'
export { Progress } from './ui/progress'
export { RadioGroup, RadioGroupItem } from './ui/radio-group'
export { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select'
export { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
export { Skeleton } from './ui/skeleton'
export { Switch } from './ui/switch'
export { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableFooter, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table'
export { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
export { toast, useToast } from './ui/use-toast'
export { Toaster } from './ui/toaster'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================
export { SiteHeader } from './layout/site-header'
export { SiteFooter } from './layout/site-footer'

// ============================================================================
// FEATURE COMPONENTS
// ============================================================================

// Shows & Arrangements
export { ShowCard, ShowCardSkeleton } from './features/shows/ShowCard'
export { AddToPlanButton } from './features/shows/AddToPlanButton'

// File Management
export { FileGallery } from './features/file-gallery'
export { FileUpload } from './features/file-upload'
export { YouTubeUpload } from './features/youtube-upload'

// Media Players
export { AudioPlayerComponent } from './features/audio-player'
export { YouTubePlayer } from './features/youtube-player'

// Filtering & Search
export { FilterBar } from './features/filters/filter-bar'
export { FilterForm } from './features/filters/filter-form'
export { Pagination } from './features/filters/pagination'

// Navigation
export { MainNav } from './features/main-nav'

// Content
export { WhatIsIncluded } from './features/what-is-included'
export { Testimonials } from './features/testimonials'
export { MarchingFormation } from './features/marching-formation'

// Admin
export { AdminTable } from './features/admin/AdminTable'

// SEO
export { JsonLd } from './features/seo/JsonLd'
export { GoogleAnalytics } from './features/seo/GoogleAnalytics'
export { SEOHead } from './features/seo/SEOHead'

// Resource Management
export { ResourcePage } from './features/resources/ResourcePage'

// ============================================================================
// FORM COMPONENTS
// ============================================================================
export { InquiryForm } from './forms/inquiry-form'
export { CheckAvailabilityModal } from './forms/check-availability-modal'

// ============================================================================
// THEME & PROVIDERS
// ============================================================================
export { ThemeProvider } from './theme-provider'

// ============================================================================
// COMPONENT USAGE GUIDE
// ============================================================================
/*
## Usage Examples

### Basic Components
```tsx
import { Button, Card, Badge } from '@/components'

<Card>
  <CardHeader>
    <CardTitle>Show Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Badge>2024</Badge>
    <Button>Learn More</Button>
  </CardContent>
</Card>
```

### Forms with Validation
```tsx
import { Form, FormField, Input, Button } from '@/components'

<Form {...form}>
  <FormField name="email" render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
    </FormItem>
  )} />
  <Button type="submit">Submit</Button>
</Form>
```

### Loading States
```tsx
import { ShowCard, ShowCardSkeleton } from '@/components'

{isLoading ? <ShowCardSkeleton /> : <ShowCard item={show} />}
```

### Navigation
```tsx
import { Breadcrumb, BreadcrumbList, BreadcrumbItem } from '@/components'

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### Tooltips for Help
```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components'

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      <HelpCircle className="h-4 w-4" />
    </TooltipTrigger>
    <TooltipContent>
      <p>Helpful explanation</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```
*/
