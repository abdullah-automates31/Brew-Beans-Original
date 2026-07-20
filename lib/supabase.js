import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rtqbpviegxwgaknmrrsg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7ob1dFT-sGzEZaKMH0Y8EA_hAmTu2XT';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SUPABASE_URL_CONST = SUPABASE_URL;
