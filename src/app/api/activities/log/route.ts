import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/activityLogger';
import { getCurrentUserId } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get activity data from request
    const activityData = await request.json();

    // Log the activity using the server-side logger
    const activity = await logActivity(activityData);

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error logging activity:', error);
    return NextResponse.json(
      { error: 'Error al registrar la actividad' },
      { status: 500 }
    );
  }
}
