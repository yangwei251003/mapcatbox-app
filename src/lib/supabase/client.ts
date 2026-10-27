import { createBrowserClient } from '@supabase/ssr';
import { cloudEnabled } from '@/lib/runtime-config';

export function createClient() {
  if (!cloudEnabled) throw new Error('离线合成演示不创建云客户端');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('个人云模式需要自行配置 URL 与公开 anon key；不得使用 service role key');
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton for client-side
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!_client) {
    _client = createClient();
  }
  return _client;
}
