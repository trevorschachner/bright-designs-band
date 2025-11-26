import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileQuestion, ArrowLeft, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-32 flex items-center justify-center min-h-[70vh]">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        
        <h1 className="text-4xl font-heading font-bold mb-4">Page Not Found</h1>
        <p className="text-lg text-muted-foreground mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contact">
              Contact Support
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

