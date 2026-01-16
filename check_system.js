
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wkrdwlnlcjggfdmoojkq.supabase.co";
// Using the ANON key from .env which we read earlier
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcmR3bG5sY2pnZ2ZkbW9vamtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODAwNzQsImV4cCI6MjA4MjY1NjA3NH0.a9s7-Ss6tYQLiVGD9l1MtChQfRo2JYHGv-mR5zaGgVQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSystemHealth() {
    console.log('--- DIAGNOSTIC START ---');

    // 1. Check Bookings via Public RPC
    const startDate = '2026-01-01';
    const endDate = '2026-02-01';

    console.log(`\n1. Checking Bookings (Range: ${startDate} to ${endDate})...`);
    const { data: bookingsData, error: bookingsError } = await supabase.rpc('get_public_availability_by_size', {
        _start_date: startDate,
        _end_date: endDate,
    });

    if (bookingsError) {
        console.error('CRITICAL: Error fetching bookings via RPC:', bookingsError);
    } else {
        const totalBookings = bookingsData ? bookingsData.reduce((sum, item) => sum + item.booked_count, 0) : 0;
        console.log(`Status: ${totalBookings > 0 ? 'SUCCESS' : 'WARNING'}`);
        console.log(`Count: ${totalBookings} active bookings found.`);
    }

    // 2. Check Bikes Public Inventory
    console.log('\n2. Checking Public Bike Inventory...');
    try {
        const { data: bikesData, error: bikesError } = await supabase.rpc('get_public_bikes');
        if (bikesError) {
            console.error('CRITICAL: Error fetching public bikes:', bikesError);
        } else {
            const bikeCount = bikesData ? bikesData.length : 0;
            console.log(`Status: ${bikeCount > 0 ? 'SUCCESS' : 'WARNING'}`);
            console.log(`Count: ${bikeCount} bikes found in inventory.`);
            if (bikeCount > 0) {
                const statuses = {};
                bikesData.forEach(b => statuses[b.status] = (statuses[b.status] || 0) + 1);
                console.log('Statuses:', statuses);
            }
        }
    } catch (err) {
        console.error('Error invoking get_public_bikes:', err);
    }

    console.log('\n--- DIAGNOSTIC END ---');
}

checkSystemHealth();
