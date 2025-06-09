import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { ActivityType } from '@/types/activity';

// Custom error class for activity logging
class ActivityLoggerError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ActivityLoggerError';
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}

interface LogActivityParams {
  type: ActivityType;
  description: string;
  relatedId?: string;
  relatedType?: string;
  metadata?: Record<string, unknown>;
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
    const { userId } = await getCurrentUserId();
    if (!userId) {
      console.warn('No hay usuario autenticado, omitiendo registro de actividad');
      return null;
    }

    // Si no se proporcionó un goalId específico, buscar metas activas que correspondan
    let goalIds: string[] = [];
    if (!goalId) {
      goalIds = await findActiveGoalsForActivity(userId, type);
    } else {
      goalIds = [goalId];
    }

    type ActivityCreateInput = {
      userId: string;
      type: ActivityType;
      description: string;
      relatedId?: string | null;
      relatedType?: string | null;
      metadata?: string;
      points: number;
      goalId?: string;
    };

    // Si hay metas activas, crear una actividad por cada meta
    const activities: Array<any> = []; // Using any temporarily to handle Prisma types
    for (const gId of goalIds) {
      const activityData: ActivityCreateInput = {
        userId,
        type,
        description,
        relatedId: relatedId || null,
        relatedType: relatedType || null,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        points,
        goalId: gId
      };

      const activity = await prisma.userActivity.create({
        data: activityData
      });
      activities.push(activity);

      // Actualizar el progreso de cada meta
      await updateGoalProgress(gId);
    }

    // Si no hay metas activas, crear la actividad sin goalId
    if (goalIds.length === 0) {
      const activityData: Omit<ActivityCreateInput, 'goalId'> = {
        userId,
        type,
        description,
        relatedId: relatedId || null,
        relatedType: relatedType || null,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        points
      };

      const activity = await prisma.userActivity.create({
        data: activityData
      });
      activities.push(activity);
    }

    return activities[0]; // Retornar la primera actividad para mantener compatibilidad
  } catch (error) {
    throw new ActivityLoggerError('Error al registrar actividad', error);
  }
}

export async function updateGoalProgress(goalId: string): Promise<void> {
  try {
    // Contar actividades asociadas a esta meta usando Prisma count
    const count = await prisma.userActivity.count({
      where: {
        goalId: goalId
      }
    });
    
    // Obtener la meta actual
    const goal = await prisma.userGoal.findUnique({
      where: { id: goalId }
    });
    
    if (!goal) {
      throw new ActivityLoggerError('Meta no encontrada');
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
    throw new ActivityLoggerError('Error al actualizar progreso de meta', error);
  }
}

// Mapeo de tipos de actividad a categorías de metas
const activityTypeToGoalCategory = {
  DPV: 'DPV',
  NOTICIA: 'NEWS', 
  ENCARGO: 'ASSIGNMENTS',
  VISITA: 'VISITS',
  LLAMADA: 'CALLS',
  EMAIL: 'COMMUNICATIONS',
  OTROS: 'GENERAL'
} as const;

// Encuentra metas activas que correspondan al tipo de actividad
async function findActiveGoalsForActivity(userId: string, activityType: ActivityType): Promise<string[]> {
  try {
    const category = activityTypeToGoalCategory[activityType];

    const goals = await prisma.userGoal.findMany({
      where: {
        userId: userId,
        category: category,
        isCompleted: false,
        OR: [
          { endDate: null },
          { endDate: { gt: new Date() } }
        ]
      },
      select: { id: true }
    });

    return goals.map(g => g.id);
  } catch (error) {
    console.error('Error buscando metas activas:', error);
    return [];
  }
}