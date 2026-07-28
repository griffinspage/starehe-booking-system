const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const user = {
  id: '2bed31c0-fc9b-40fb-9bff-743904a99e13', // Wildlife club patron
};

const bookingData = {
  functionName: 'Test Wildlife Event',
  functionDate: '2026-08-10',
  venue: 'Wildlife Hall',
  purpose: 'To teach conservation',
  expectedStudents: 40,
  resources: ['projector'],
  quantity: 1,
  specialRequirements: 'None',
};

async function testInsert() {
  try {
    console.log('1. Fetching profile for user', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('club_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return;
    }
    console.log('Profile fetched:', profile);

    console.log('2. Inserting booking...');
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_type: 'club_function',
        club_patron_id: user.id,
        function_name: bookingData.functionName,
        booking_date: bookingData.functionDate,
        venue: bookingData.venue,
        purpose: bookingData.purpose,
        expected_students: bookingData.expectedStudents,
        resource_type: bookingData.resources[0],
        quantity: bookingData.quantity,
        special_requirements: bookingData.specialRequirements || null,
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking insert error:', bookingError);
      return;
    }
    console.log('Booking inserted:', booking);

    console.log('3. Inserting master list...');
    const { data: ml, error: mlError } = await supabase
      .from('master_lists')
      .insert({
        booking_id: booking.id,
        club_name: profile.club_name,
        function_name: bookingData.functionName,
        venue: bookingData.venue,
        function_date: bookingData.functionDate,
        purpose: bookingData.purpose,
        expected_students: bookingData.expectedStudents,
        status: 'draft',
      })
      .select()
      .single();

    if (mlError) {
      console.error('Master list insert error:', mlError);
      return;
    }
    console.log('Master list inserted:', ml);

    console.log('4. Inserting approvals...');
    const chain = [
      { role: 'sm1', order: 1 },
      { role: 'sm2', order: 2 },
      { role: 'sm3', order: 3 },
      { role: 'sm4', order: 4 },
      { role: 'welfare_head', order: 5 },
    ];

    const { data: approvals, error: approvalsError } = await supabase
      .from('approvals')
      .insert(
        chain.map((step) => ({
          booking_id: booking.id,
          approver_role: step.role,
          sequence_order: step.order,
        }))
      )
      .select();

    if (approvalsError) {
      console.error('Approvals insert error:', approvalsError);
      return;
    }
    console.log('Approvals inserted successfully:', approvals);

    // Clean up
    console.log('Cleaning up...');
    await supabase.from('bookings').delete().eq('id', booking.id);
    console.log('Cleanup completed.');

  } catch (err) {
    console.error('Catch error:', err);
  }
}

testInsert();
