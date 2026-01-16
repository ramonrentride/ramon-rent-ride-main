
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wkrdwlnlcjggfdmoojkq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcmR3bG5sY2pnZ2ZkbW9vamtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODAwNzQsImV4cCI6MjA4MjY1NjA3NH0.a9s7-Ss6tYQLiVGD9l1MtChQfRo2JYHGv-mR5zaGgVQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkBookings() {
    console.log('Checking bookings via public RPC...');

    const startDate = '2026-01-01';
    const endDate = '2026-02-01';

    console.log(`Querying range: ${startDate} to ${endDate}`);

    const { data, error } = await supabase.rpc('get_public_availability_by_size', {
        _start_date: startDate,
        _end_date: endDate,
    });

    if (error) {
        console.error('Error fetching availability:', error);
        return;
    }

    console.log('Availability Data:', JSON.stringify(data, null, 2));

    const totalBookings = data ? data.reduce((sum, item) => sum + item.booked_count, 0) : 0;

    if (totalBookings > 0) {
        console.log(`\nSUCCESS: Found ${totalBookings} booked slots. Data exists!`);
        console.log('This indicates an RLS or Display issue in the Dashboard.');
    } else {
        console.log('\nWARNING: 0 bookings found in this range. Potential data loss or empty database.');
    }
}

checkBookings();
