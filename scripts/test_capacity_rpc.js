
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(__dirname, '../.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
    envConfig.split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            const [key, ...val] = line.split('=');
            return [key.trim(), val.join('=').trim().replace(/^["']|["']$/g, '')];
        })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testCapacity() {
    console.log('Testing get_public_inventory_capacity RPC...');

    // 1. Fetch Capacity
    const { data, error } = await supabase.rpc('get_public_inventory_capacity');

    if (error) {
        console.error('RPC Error:', error);
        return;
    }

    console.log('RPC Result:', JSON.stringify(data, null, 2));

    // 2. Fetch Actual Bikes Table (as Service Role if possible, but here we use Anon)
    // Note: Anon cannot see 'bikes' table directly usually due to RLS, but let's try just in case checking if RLS is the issue
    const { data: bikes, error: bikeError } = await supabase.from('bikes').select('id, size, status');
    if (bikeError) {
        console.log('Direct Bike Access Error (Expected if RLS is on):', bikeError.message);
    } else {
        console.log('Direct Bike Access Success. Total:', bikes.length);
        const active = bikes.filter(b => b.status !== 'maintenance' && b.status !== 'unavailable');
        console.log('Active Bikes (JS Filter):', active.length);
    }
}

testCapacity();
