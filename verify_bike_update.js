
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wkrdwlnlcjggfdmoojkq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcmR3bG5sY2pnZ2ZkbW9vamtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODAwNzQsImV4cCI6MjA4MjY1NjA3NH0.a9s7-Ss6tYQLiVGD9l1MtChQfRo2JYHGv-mR5zaGgVQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkBikes() {
    console.log('🚲 Checking Bikes Table for active orders...');
    const { data: bikes, error } = await supabase
        .from('bikes')
        .select('id, sticker_number, status, active_order_id, active_phone')
        .neq('active_order_id', null);

    if (error) {
        console.error('Error fetching bikes:', error);
        return;
    }

    if (bikes.length === 0) {
        console.log('No bikes found with active orders.');
    } else {
        console.table(bikes);
    }
}

checkBikes();
