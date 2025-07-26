import { supabase } from '@/utils/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { data, error } = await supabase.from('todos').select('*');

    if (error) {
      console.error('Error fetching todos:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    console.error('Unexpected error in API route:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}