import { createClient } from '@/lib/utils/supabase/server';
import { NextResponse } from 'next/server';
import { getArrangementById } from '@/lib/database/supabase-queries';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: arrangement, error } = await supabase
      .from('arrangements')
      .select(`
        *,
        show:shows(*),
        files(*)
      `)
      .eq('id', parseInt(id, 10))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Arrangement not found' }, { status: 404 });
      }
      console.error('Error fetching arrangement:', error);
      return NextResponse.json(
        { error: 'Failed to fetch arrangement' },
        { status: 500 }
      );
    }

    return NextResponse.json(arrangement);
  } catch (error) {
    console.error('Error fetching arrangement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arrangement' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is staff
    const userEmail = session.user?.email;
    if (!userEmail?.endsWith('@brightdesigns.band')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    const { data: updatedArrangement, error } = await supabase
      .from('arrangements')
      .update(body)
      .eq('id', parseInt(id, 10))
      .select()
      .single();

    if (error) {
      console.error('Error updating arrangement:', error);
      return NextResponse.json(
        { error: 'Failed to update arrangement' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedArrangement);
  } catch (error) {
    console.error('Error updating arrangement:', error);
    return NextResponse.json(
      { error: 'Failed to update arrangement' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is staff
    const userEmail = session.user?.email;
    if (!userEmail?.endsWith('@brightdesigns.band')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: deletedArrangement, error } = await supabase
      .from('arrangements')
      .delete()
      .eq('id', parseInt(id, 10))
      .select()
      .single();

    if (error) {
      console.error('Error deleting arrangement:', error);
      return NextResponse.json(
        { error: 'Failed to delete arrangement' },
        { status: 500 }
      );
    }

    return NextResponse.json(deletedArrangement);
  } catch (error) {
    console.error('Error deleting arrangement:', error);
    return NextResponse.json(
      { error: 'Failed to delete arrangement' },
      { status: 500 }
    );
  }
} 