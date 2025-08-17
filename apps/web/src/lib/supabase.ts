import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL as string | undefined;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

export const supabaseAdmin = url && serviceRoleKey
  ? createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;


