import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = Object.fromEntries(
    envContent.split('\n').map(line => line.split('=').map(part => part.trim()))
);

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

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
