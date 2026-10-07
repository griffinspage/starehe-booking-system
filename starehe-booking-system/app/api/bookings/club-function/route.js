export const dynamic = 'force-dynamic';

// app/api/bookings/club-function/route.js
// POST — creates a club function booking for the logged-in Club Patron.
// Enforces the three-day rule server-side too, since client-side checks can be bypassed.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  bookResourceSchema,
  validateThreeDayRule,
} from '@/utils/validation';

export async function POST(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            'You must be logged in to book a function.',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const parsed = bookResourceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      functionName,
      functionDate,
      venue,
      purpose,
      expectedStudents,
      resources,
      quantity,
      specialRequirements,
    } = parsed.data;

    const { valid, message } =
      validateThreeDayRule(functionDate);

    if (!valid) {
      return NextResponse.json(
        { error: message },
        { status: 422 }
      );
    }

    // Get the logged-in patron's club name
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('users')
      .select('club_name')
      .eq('id', user.id)
      .single();

    console.log('Logged in user:', user.id);
    console.log('Profile:', profile);

    if (profileError) {
      throw profileError;
    }

    // Create the booking
    const {
      data: booking,
      error: bookingError,
    } = await supabase
      .from('bookings')
      .insert({
        booking_type: 'club_function',
        club_patron_id: user.id,
        function_name: functionName,
        booking_date: functionDate,
        venue,
        purpose,
        expected_students: expectedStudents,
        resource_type: resources[0],
        quantity,
        special_requirements:
          specialRequirements || null,
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      throw bookingError;
    }

    // Automatically create the Master List
    const {
      error: masterListError,
    } = await supabase
      .from('master_lists')
      .insert({
        booking_id: booking.id,
        club_name: profile.club_name,
        function_name: functionName,
        venue,
        function_date: functionDate,
        purpose,
        expected_students: expectedStudents,
        status: 'draft',
      });

    if (masterListError) {
      throw masterListError;
    }

    // Seed the five-stage approval chain
    const chain = [
      { role: 'sm1', order: 1 },
      { role: 'sm2', order: 2 },
      { role: 'sm3', order: 3 },
      { role: 'sm4', order: 4 },
      { role: 'welfare_head', order: 5 },
    ];

    // Use the service-role client because approval records
    // are system-generated and patrons should not be able
    // to insert approval records directly.
    const adminSupabase = createAdminClient();

    const {
      error: approvalsError,
    } = await adminSupabase
      .from('approvals')
      .insert(
        chain.map((step) => ({
          booking_id: booking.id,
          approver_role: step.role,
          sequence_order: step.order,
          decision: 'pending',
        }))
      );

    if (approvalsError) {
      console.error(
        'Approval chain creation failed:',
        approvalsError
      );

      throw approvalsError;
    }

    console.log(
      'Approval chain created successfully for booking:',
      booking.id
    );

    return NextResponse.json(
      { booking },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'Club function booking error:',
      error
    );

    try {
      const fs = require('fs');
      const path = require('path');

      const logPath = path.join(
        process.cwd(),
        'scratch',
        'booking_error.log'
      );

      const logDir = path.dirname(logPath);

      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, {
          recursive: true,
        });
      }

      fs.appendFileSync(
        logPath,
        `[${new Date().toISOString()}] Club Function Error:
Message: ${error.message}
Stack: ${error.stack}
Details: ${JSON.stringify(error)}

`
      );
    } catch (logErr) {
      console.error(
        'Failed to write log file:',
        logErr
      );
    }

    return NextResponse.json(
      {
        error:
          'Something went wrong creating the booking.',
      },
      { status: 500 }
    );
  }
}