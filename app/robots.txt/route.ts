// Redirect to our API route for robots.txt generation
import { redirect } from 'next/navigation'

export async function GET() {
  redirect('/api/robots')
}