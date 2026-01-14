import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wkrdwlnlcjggfdmoojkq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcmR3bG5sY2pnZ2ZkbW9vamtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODAwNzQsImV4cCI6MjA4MjY1NjA3NH0.a9s7-Ss6tYQLiVGD9l1MtChQfRo2JYHGv-mR5zaGgVQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Connecting to Supabase...');

try {
    const { data, error } = await supabase.from('bikes').select('*');

    if (error) {
        console.error('Error fetching bikes:', error);
    } else {
        console.log('Bikes data retrieved:', data.length, 'records');

        // Check for available bikes
        const availableBikes = data.filter(bike => bike.status === 'available');

        if (availableBikes.length > 0) {
            console.log('YES, there are bikes with status "available":');
            console.log(availableBikes);
        } else {
            console.log('NO bikes with status "available".');
            console.log('Current statuses:');
            data.forEach(bike => {
                console.log(`ID: ${bike.id}, Status: ${bike.status}, Name: ${bike.name || 'N/A'}`);
            });
        }

        console.log('Full Data Dump:', JSON.stringify(data, null, 2));
    }
} catch (err) {
    console.error('Unexpected error:', err);
}
