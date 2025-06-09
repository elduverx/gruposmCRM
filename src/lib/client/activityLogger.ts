import { ActivityType } from '@/types/activity';

interface LogActivityParams {
  type: ActivityType;
  description: string;
  relatedId?: string;
  relatedType?: string;
  metadata?: Record<string, unknown>;
  points?: number;
  goalId?: string;
}

export async function logActivity(params: LogActivityParams): Promise<any> {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      console.warn('No hay un token de autenticación, omitiendo registro de actividad');
      return null;
    }

    const response = await fetch('/api/activities/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error('Error al registrar la actividad');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al registrar actividad:', error);
    throw error;
  }
}
