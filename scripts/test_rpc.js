

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load .env manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envConfig = envContent.split('\n').reduce((acc, line) => {
    const [key, val] = line.split('=');
    if (key && val) acc[key.trim()] = val.trim().replace(/"/g, ''); // Simple parsing
    return acc;
}, {});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
    console.log('Testing get_public_availability_by_size...');

    // Check Fleet Status
    const { data: bikes, error: bikeError } = await supabase.rpc('get_public_bikes');
    if (bikeError) console.error('Bikes Error:', bikeError);
    else {
        const active = bikes.filter(b => b.status !== 'maintenance' && b.status !== 'unavailable').length;
        console.log('Total Active Bikes:', active);
        console.log('Bikes Breakdown:', bikes.map(b => `${b.size}: ${b.status}`).join(', '));
    }

    // Test for a range (e.g., this month)
    const startDate = '2024-01-01'; // Wide range back
    const endDate = '2026-12-31'; // Wide range forward

    const { data, error } = await supabase.rpc('get_public_availability_by_size', {
        _start_date: startDate,
        _end_date: endDate
    });

    if (error) {
        console.error('RPC Error:', error);
        return;
    }

    console.log('RPC Data:', JSON.stringify(data, null, 2));
}

testRpc();
