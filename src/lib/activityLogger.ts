import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

export type ActivityType = 
  | 'PROPERTY_CREATED'
  | 'PROPERTY_UPDATED'
  | 'PROPERTY_DELETED'
  | 'PROPERTY_ASSIGNED'
  | 'ZONE_CREATED'
  | 'ZONE_UPDATED'
  | 'ZONE_DELETED'
  | 'CLIENT_CREATED'
  | 'CLIENT_UPDATED'
  | 'CLIENT_DELETED'
  | 'TASK_CREATED'
  | 'TASK_COMPLETED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'NOTE_CREATED'
  | 'NOTE_UPDATED'
  | 'NOTE_DELETED'
  | 'MANUAL';

interface LogActivityParams {
  type: ActivityType;
  description: string;
  relatedId?: string;
  relatedType?: string;
  metadata?: Record<string, any>;
  points?: number;
  goalId?: string;
}

export async function logActivity({
  type,
  description,
  relatedId,
  relatedType,
  metadata,
  points = 1,
  goalId
}: LogActivityParams) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('No se pudo obtener el ID del usuario actual');
      return null;
    }

    const activity = await prisma.userActivity.create({
      data: {
        userId,
        type,
        description,
        relatedId,
        relatedType,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        points,
        goalId
      }
    });

    // Si la actividad está asociada a una meta, actualizar el progreso
    if (goalId) {
      await updateGoalProgress(goalId);
    }

    return activity;
  } catch (error) {
    console.error('Error al registrar actividad:', error);
    return null;
  }
}

async function updateGoalProgress(goalId: string): Promise<void> {
  try {
    // Contar actividades asociadas a esta meta
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM UserActivity 
      WHERE goalId = ${goalId}
    `;
    
    const count = Array.isArray(countResult) && countResult.length > 0 && typeof countResult[0] === 'object' && countResult[0] !== null
      ? Number((countResult[0] as { count: number }).count) 
      : 0;
    
    // Obtener la meta actual
    const goal = await prisma.userGoal.findUnique({
      where: { id: goalId }
    });
    
    if (!goal) {
      throw new Error('Meta no encontrada');
    }
    
    // Actualizar el contador y verificar si se completó
    const isCompleted = count >= goal.targetCount;
    
    await prisma.userGoal.update({
      where: { id: goalId },
      data: {
        currentCount: count,
        isCompleted,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error al actualizar progreso de meta:', error);
  }
} 