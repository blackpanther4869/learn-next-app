import { createClient } from '@supabase/supabase-js';

// 環境変数は Next.js の仕様に従い、先頭に NEXT_PUBLIC_ を付けることでクライアントサイドでも利用可能になります
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);