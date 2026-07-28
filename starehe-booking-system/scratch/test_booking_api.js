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
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

const anonClient = createClient(supabaseUrl, supabaseAnonKey);

const email = 'temp_patron_test@example.com';
const password = 'Password123!';
const clubName = 'Test Drama Club';

async function run() {
  let userId = null;
  try {
    console.log('1. Checking if test user already exists...');
    const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email);
    
    if (existingUser) {
      console.log('User exists. Deleting user...');
      await serviceClient.auth.admin.deleteUser(existingUser.id);
    }

    console.log('2. Creating new test user via admin client...');
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'club_patron',
        club_name: clubName,
        full_name: clubName
      }
    });

    if (authError) throw authError;
    userId = authData.user.id;
    console.log('Created auth user:', userId);

    // Wait a brief moment for triggers to run
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('3. Checking if public profile created...');
    const { data: userProfile, error: profileErr } = await serviceClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileErr) throw profileErr;
    console.log('Public user row:', userProfile);

    const { data: patronRow, error: patronErr } = await serviceClient
      .from('club_patrons')
      .select('*')
      .eq('id', userId)
      .single();

    if (patronErr) throw patronErr;
    console.log('Club Patron row:', patronRow);

    console.log('4. Signing in with client to get session token...');
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) throw signInError;
    const token = signInData.session.access_token;
    console.log('Successfully signed in. JWT length:', token.length);

    console.log('5. Making POST request to Next.js API using custom auth header...');
    // We send request to localhost dev server
    const bookingPayload = {
      functionName: 'Test Annual Drama Play',
      functionDate: '2026-08-20', // Must satisfy 3-day rule (Aug 20 is > 3 days from July 28)
      venue: 'Main Hall',
      purpose: 'Drama performance practice',
      expectedStudents: 45,
      resources: ['projector'],
      quantity: 1,
      specialRequirements: 'Needs audio system too'
    };

    const response = await fetch('http://localhost:3000/api/bookings/club-function', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-qhvvrnpimsgfioxkajne-auth-token=${JSON.stringify([token, null, null, null, null])}`
      },
      body: JSON.stringify(bookingPayload)
    });

    console.log('API Status:', response.status);
    const responseBody = await response.text();
    console.log('API Response Body:');
    console.log(responseBody);

  } catch (err) {
    console.error('Run failed with error:', err);
  } finally {
    if (userId) {
      console.log('6. Cleaning up test user...');
      const { error: delErr } = await serviceClient.auth.admin.deleteUser(userId);
      if (delErr) {
        console.error('Cleanup error:', delErr);
      } else {
        console.log('Cleanup completed successfully.');
      }
    }
  }
}

run();
