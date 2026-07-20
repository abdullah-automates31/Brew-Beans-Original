// Shared Supabase client for the static admin/staff pages (admin.html, admin-dashboard.html, staff.html).
// Same project + publishable key as lib/supabase.js — keep these two in sync if the project ever changes.
const supabaseClient = supabase.createClient(
  'https://rtqbpviegxwgaknmrrsg.supabase.co',
  'sb_publishable_7ob1dFT-sGzEZaKMH0Y8EA_hAmTu2XT'
);
