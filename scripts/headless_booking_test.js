
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = "https://wkrdwlnlcjggfdmoojkq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcmR3bG5sY2pnZ2ZkbW9vamtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODAwNzQsImV4cCI6MjA4MjY1NjA3NH0.a9s7-Ss6tYQLiVGD9l1MtChQfRo2JYHGv-mR5zaGgVQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTest() {
    console.log("🚀 Starting Headless Booking Test...");

    // 1. Calculate a safe future date (20th of next month)
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 20);
    const dateStr = nextMonth.toISOString().split('T')[0];
    console.log(`📅 Selecting Date: ${dateStr}`);

    console.log("🔍 Checking Availability via RPC (Public)...");
    // Note: create_booking_public does internal availability checking now, so we can try to call it directly.
    // But strictly, the UI calls get_public_availability first. Let's try to just BOOK and see if it succeeds.

    // 2. Prepare Booking Payload
    // Rider: "AutoTester", Height: 175 (Size M)
    // We need to know what size 175 maps to. Based on logic, 175 is usually M.
    // We'll trust the RPC to validate availability for 'M'.
    const riders = [
        {
            id: "test-rider-1",
            name: "AutoTester Headless",
            height: 175,
            assignedSize: "M", // We manually assign M for this test
            assignedBike: null // RPC assigns bike? No, UI assigns bike! 
            // WAIT. The logic in BookingPage.tsx assigns the bike ID *before* sending to RPC?
            // Let's check BookingPage.tsx again.
            // Yes: "ridersWithAssignedBikes" includes "assignedBike".
            // BUT `create_booking_public` RPC definition shows it takes `_riders JSONB`.
            // Does the RPC *use* the assigned bike ID?
            // The NEW RPC I wrote CHECKS availability by counting *bookings*. It does NOT assign specific bike IDs in the DB in that RPC?
            // The RPC inserts the JSON.
            // BookingPage.tsx Line 811: "update({ active_order_id: ... }) .in('id', assignedBikeIds)"
            // So the UI picks the bike, sends the booking to create the record, THEN updates the bike status locally??
            // NO. My new RPC validates availability by COUNTING.
            // So I need to send a payload that matches what the UI sends.
        }
    ];

    // UI Logic RECAP:
    // 1. UI finds specific bike (e.g. ID 5) for the rider.
    // 2. UI sends booking with rider data (including assignedBike object) to `create_booking_public`.
    // 3. RPC validates availability (counts vs total).
    // 4. RPC inserts booking.
    // 5. UI (client) receives ID.
    // 6. UI (client) updates `bikes` table to set `active_order_id` (only if today).

    // For this test (Future Booking), step 6 doesn't happen.
    // So I just need to send the booking structure.

    const bookingPayload = {
        _date: dateStr,
        _session: "morning",
        _riders: riders,
        _picnic: { quantity: 0, items: [] },
        _status: "confirmed",
        _total_price: 100,
        _security_hold: 0,
        _phone: "0500000000",
        _email: "headless@test.com",
        _legal_accepted: true,
        _payment_method: "credit_card",
        _coupon_code: null
    };

    console.log("📝 Payload:", JSON.stringify(bookingPayload, null, 2));

    try {
        const { data, error } = await supabase.rpc('create_booking_public', bookingPayload);

        if (error) {
            console.error("❌ Booking Failed:", error.message, error.details, error.hint);
            process.exit(1);
        }

        console.log("✅ Booking Successful!");
        console.log("🆔 Booking ID:", data);

        // Optional: Cancel it to clean up?
        // Anonymous user might not be able to cancel depending on RLS.
        // capturing ID is enough proof.

    } catch (err) {
        console.error("❌ Unexpected Error:", err);
        process.exit(1);
    }
}

runTest();
