// Supabase query functions - replacing Drizzle
import { createClient } from '@/lib/utils/supabase/client';
import { createClient as createServerClient } from '@/lib/utils/supabase/server';

// Types for our database tables
export interface Show {
  id: number;
  title: string;
  year?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: string;
  description?: string;
  price?: number;
  thumbnail_url?: string;
  composer?: string;
  song_title?: string;
  created_at: string;
}

export interface Arrangement {
  id: number;
  title: string;
  type?: string;
  price?: number;
  show_id: number;
}

export interface FileRecord {
  id: number;
  file_name: string;
  original_name: string;
  file_type: 'image' | 'audio' | 'youtube' | 'pdf' | 'score' | 'other';
  file_size: number;
  mime_type: string;
  url: string;
  storage_path: string;
  show_id?: number;
  arrangement_id?: number;
  is_public: boolean;
  description?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface ContactSubmission {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
  privacy_agreed: boolean;
  ip_address?: string;
  user_agent?: string;
  email_sent: boolean;
  email_sent_at?: string;
  email_error?: string;
  status: string;
  admin_notes?: string;
  interested_show_id?: number;
  interested_arrangement_id?: number;
  created_at: string;
  updated_at: string;
}

// =======================================
// SHOWS QUERIES
// =======================================

export async function getAllShows(): Promise<Show[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching shows:', error);
    throw error;
  }

  return data || [];
}

export async function getShowById(id: number): Promise<Show | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No rows found
    }
    console.error('Error fetching show by ID:', error);
    throw error;
  }

  return data;
}

export async function getShowsWithFilters(filters: {
  difficulty?: string;
  searchTerm?: string;
  year?: string;
}): Promise<Show[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('shows')
    .select('*');

  if (filters.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }

  if (filters.year) {
    query = query.eq('year', filters.year);
  }

  if (filters.searchTerm) {
    query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%,composer.ilike.%${filters.searchTerm}%`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching filtered shows:', error);
    throw error;
  }

  return data || [];
}

// =======================================
// ARRANGEMENTS QUERIES
// =======================================

export async function getArrangementsByShowId(showId: number): Promise<Arrangement[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('arrangements')
    .select('*')
    .eq('show_id', showId);

  if (error) {
    console.error('Error fetching arrangements:', error);
    throw error;
  }

  return data || [];
}

export async function getAllArrangements(): Promise<Arrangement[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('arrangements')
    .select('*');

  if (error) {
    console.error('Error fetching all arrangements:', error);
    throw error;
  }

  return data || [];
}

export async function getArrangementById(id: number): Promise<Arrangement | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('arrangements')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching arrangement by ID:', error);
    throw error;
  }

  return data;
}

// =======================================
// FILES QUERIES
// =======================================

export async function getPublicFilesByShowId(showId: number): Promise<FileRecord[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('show_id', showId)
    .eq('is_public', true)
    .order('display_order');

  if (error) {
    console.error('Error fetching public files:', error);
    throw error;
  }

  return data || [];
}

export async function getFilesByArrangementId(arrangementId: number): Promise<FileRecord[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('arrangement_id', arrangementId)
    .eq('is_public', true)
    .order('display_order');

  if (error) {
    console.error('Error fetching arrangement files:', error);
    throw error;
  }

  return data || [];
}

// =======================================
// TAGS QUERIES
// =======================================

export async function getAllTags(): Promise<Tag[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tags')
    .select('*');

  if (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }

  return data || [];
}

// =======================================
// STATISTICS QUERIES
// =======================================

export async function getDashboardStats() {
  const supabase = createClient();
  
  const [showsResult, arrangementsResult, contactsResult, filesResult] = await Promise.all([
    supabase.from('shows').select('id', { count: 'exact', head: true }),
    supabase.from('arrangements').select('id', { count: 'exact', head: true }),
    supabase.from('contact_submissions').select('id', { count: 'exact', head: true }),
    supabase.from('files').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalShows: showsResult.count || 0,
    totalArrangements: arrangementsResult.count || 0,
    totalContacts: contactsResult.count || 0,
    totalFiles: filesResult.count || 0,
  };
}

// =======================================
// CONTACT SUBMISSIONS QUERIES
// =======================================

export async function createContactSubmission(data: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
  privacy_agreed: boolean;
  ip_address?: string;
  user_agent?: string;
  interested_show_id?: number;
  interested_arrangement_id?: number;
}): Promise<ContactSubmission> {
  const supabase = createClient();
  
  const { data: result, error } = await supabase
    .from('contact_submissions')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating contact submission:', error);
    throw error;
  }

  return result;
}

export async function getContactSubmissions(limit = 50): Promise<ContactSubmission[]> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching contact submissions:', error);
    throw error;
  }

  return data || [];
}

export async function updateContactSubmissionStatus(
  id: number,
  status: string,
  adminNotes?: string
): Promise<ContactSubmission> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('contact_submissions')
    .update({
      status,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating contact submission:', error);
    throw error;
  }

  return data;
}

// =======================================
// EXAMPLE USAGE IN A NEXT.JS PAGE
// =======================================

// How to use these in a page component:
/*
// app/shows/page.tsx
import { getAllShows } from '@/lib/database/supabase-queries';

export default async function ShowsPage() {
  const shows = await getAllShows();
  
  return (
    <div>
      {shows.map(show => (
        <div key={show.id}>
          <h2>{show.title}</h2>
          <p>{show.description}</p>
          <p>Year: {show.year}</p>
          <p>Difficulty: {show.difficulty}</p>
        </div>
      ))}
    </div>
  );
}
*/

// =======================================
// EXAMPLE USAGE IN AN API ROUTE
// =======================================

// How to use these in an API route:
/*
// app/api/shows/route.ts
import { getAllShows } from '@/lib/database/supabase-queries';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const shows = await getAllShows();
    return NextResponse.json(shows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch shows' }, 
      { status: 500 }
    );
  }
}
*/
