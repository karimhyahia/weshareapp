
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSites() {
    const { data: sites, error } = await supabase
        .from('sites')
        .select('*');

    if (error) {
        console.error('Error fetching sites:', error);
        return;
    }

    console.log('Found sites:', sites.length);
    sites.forEach(site => {
        console.log(`ID: ${site.id}, UserID: ${site.user_id}`);
        console.log(`Internal Name: ${site.internal_name}`);
        console.log(`Profile Name: ${site.data?.profile?.name}`);
        console.log('---');
    });
}

debugSites();
