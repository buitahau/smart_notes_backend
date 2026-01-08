import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../types/env';

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
