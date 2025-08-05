// Redirect to our API route for sitemap generation
import { redirect } from 'next/navigation'

export async function GET() {
  redirect('/api/sitemap')
}