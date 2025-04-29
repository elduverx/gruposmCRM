'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma-users';
import { JWT_SECRET } from '@/lib/auth';
import { UserGoal, UserActivity, CreateUserGoalInput, CreateUserActivityInput } from '@/types/user';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

// Obtener el ID del usuario actual basado en el token de autenticación
async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return null;
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error) {
      return null;
    }
  } catch (error) {
    return null;
  }
}

// Interfaces for database results
interface RawUserGoal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  targetCount: number;
  currentCount: number;
  startDate: string;
  endDate: string | null;
  isCompleted: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
  activityCount?: number;
}

interface RawUserActivity {
  id: string;
  userId: string;
  goalId: string | null;
  type: string;
  description: string | null;
  timestamp: string;
  metadata: string | null;
  relatedId: string | null;
  relatedType: string | null;
  points: number;
  goalTitle?: string;
}

// Type guard functions
function isRawUserGoal(obj: unknown): obj is RawUserGoal {
  if (obj === null || typeof obj !== 'object') return false;
  const goal = obj as Record<string, unknown>;
  return (
    typeof goal.id === 'string' &&
    typeof goal.userId === 'string' &&
    typeof goal.title === 'string' &&
    typeof goal.targetCount === 'number' &&
    typeof goal.currentCount === 'number' &&
    typeof goal.startDate === 'string' &&
    typeof goal.isCompleted === 'boolean' &&
    typeof goal.category === 'string'
  );
}

function isRawUserActivity(obj: unknown): obj is RawUserActivity {
  if (obj === null || typeof obj !== 'object') return false;
  const activity = obj as Record<string, unknown>;
  return (
    typeof activity.id === 'string' &&
    typeof activity.userId === 'string' &&
    typeof activity.type === 'string' &&
    typeof activity.timestamp === 'string' &&
    typeof activity.points === 'number'
  );
}

// Obtener todas las metas
export async function getUserGoals(): Promise<UserGoal[]> {
  try {
    const userId = await getCurrentUserId();
    
    // Si no hay usuario autenticado, devolver una lista vacía
    if (!userId) {
      return [];
    }
    
    const goals = await prisma.$queryRaw<RawUserGoal[]>`
      SELECT g.*, COUNT(a.id) as activityCount
      FROM UserGoal g 
      LEFT JOIN UserActivity a ON g.id = a.goalId
      WHERE g.userId = ${userId}
      GROUP BY g.id
      ORDER BY g.createdAt DESC
    `;

    // Obtener actividades recientes para cada meta
    const goalsWithActivities = await Promise.all(
      goals.map(async (goal) => {
        const activities = await prisma.$queryRaw<RawUserActivity[]>`
          SELECT * FROM UserActivity 
          WHERE goalId = ${goal.id}
          ORDER BY timestamp DESC
          LIMIT 5
        `;
        
        return {
          ...goal,
          createdAt: new Date(goal.createdAt).toISOString(),
          updatedAt: new Date(goal.updatedAt).toISOString(),
          startDate: new Date(goal.startDate).toISOString(),
          endDate: goal.endDate ? new Date(goal.endDate).toISOString() : null,
          progress: calculateProgress(
            Number(goal.currentCount), 
            Number(goal.targetCount)
          ),
          activities: activities.map(mapActivityToDTO),
        };
      })
    );

    return goalsWithActivities;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al obtener metas:', error);
    return [];
  }
}

// Crear una nueva meta 
export async function createUserGoal(data: CreateUserGoalInput): Promise<UserGoal> {
  try {
    const userId = await getCurrentUserId();
    
    // Si no hay usuario autenticado, no se permite crear metas
    if (!userId) {
      throw new Error('Debes iniciar sesión para crear una meta');
    }
    
    console.log('Creando meta con datos:', {
      userId,
      title: data.title,
      description: data.description,
      targetCount: data.targetCount,
      endDate: data.endDate,
      category: data.category
    });
    
    // Usar el cliente Prisma directamente
    const newGoal = await prisma.userGoal.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        targetCount: data.targetCount,
        currentCount: 0,
        startDate: new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isCompleted: false,
        category: data.category
      }
    });
    
    console.log('Meta creada:', newGoal);
    
    // Convertir a UserGoal
    const goal: UserGoal = {
      ...newGoal,
      createdAt: new Date(newGoal.createdAt).toISOString(),
      updatedAt: new Date(newGoal.updatedAt).toISOString(),
      startDate: new Date(newGoal.startDate).toISOString(),
      endDate: newGoal.endDate ? new Date(newGoal.endDate).toISOString() : null,
      progress: calculateProgress(
        Number(newGoal.currentCount),
        Number(newGoal.targetCount)
      ),
      activities: []
    };
    
    revalidatePath('/dashboard/metas');
    
    return goal;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al crear meta:', error);
    throw new Error(`Error al crear meta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Registrar una nueva actividad
export async function createUserActivity(data: CreateUserActivityInput): Promise<UserActivity> {
  try {
    const userId = await getCurrentUserId();
    
    // Si no hay usuario autenticado, no se permite crear actividades
    if (!userId) {
      throw new Error('Debes iniciar sesión para registrar una actividad');
    }
    
    // Preparar los datos para la creación
    const activityData = {
      userId,
      goalId: data.goalId,
      type: data.type,
      description: data.description,
      timestamp: new Date(),
      relatedId: data.relatedId,
      relatedType: data.relatedType,
      points: data.points || 0,
      metadata: undefined as unknown as Prisma.InputJsonValue
    };
    
    // Manejar el metadata correctamente
    if (data.metadata !== undefined && data.metadata !== null) {
      if (typeof data.metadata === 'string') {
        // Si ya es una cadena, verificar que sea JSON válido
        try {
          JSON.parse(data.metadata);
          activityData.metadata = data.metadata as unknown as Prisma.InputJsonValue;
        } catch {
          activityData.metadata = null as unknown as Prisma.InputJsonValue;
        }
      } else if (typeof data.metadata === 'object') {
        try {
          // Si es un objeto, convertirlo a JSON
          activityData.metadata = data.metadata as unknown as Prisma.InputJsonValue;
        } catch {
          activityData.metadata = null as unknown as Prisma.InputJsonValue;
        }
      }
    }
    
    // Usar el cliente Prisma directamente
    const newActivity = await prisma.userActivity.create({
      data: activityData
    });
    
    // Si está asociada a una meta, actualizar el contador de la meta
    if (data.goalId) {
      await updateGoalProgress(data.goalId);
    }

    revalidatePath('/dashboard/metas');
    
    // Convertir a UserActivity
    const activity: UserActivity = {
      id: newActivity.id,
      userId: newActivity.userId,
      goalId: newActivity.goalId,
      type: newActivity.type,
      description: newActivity.description,
      timestamp: newActivity.timestamp.toISOString(),
      metadata: newActivity.metadata ? JSON.parse(newActivity.metadata as string) : undefined,
      relatedId: newActivity.relatedId,
      relatedType: newActivity.relatedType,
      points: newActivity.points
    };
    
    return activity;
  } catch (error) {
    throw new Error('Error al crear la actividad: ' + (error instanceof Error ? error.message : 'Error desconocido'));
  }
}

// Obtener el historial de actividades
export async function getUserActivities(limit = 50): Promise<UserActivity[]> {
  try {
    const userId = await getCurrentUserId();
    
    // Si no hay usuario autenticado, devolver una lista vacía
    if (!userId) {
      return [];
    }
    
    const activities = await prisma.$queryRaw<RawUserActivity[]>`
      SELECT a.*, g.title as goalTitle 
      FROM UserActivity a
      LEFT JOIN UserGoal g ON a.goalId = g.id
      WHERE a.userId = ${userId}
      ORDER BY a.timestamp DESC
      LIMIT ${limit}
    `;

    return activities.map(mapActivityToDTO);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al obtener actividades:', error);
    return [];
  }
}

// Eliminar una meta del usuario
export async function deleteUserGoal(goalId: string): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    
    // Si no hay usuario autenticado, no se permite eliminar metas
    if (!userId) {
      throw new Error('Debes iniciar sesión para eliminar una meta');
    }
    
    // Verificar que la meta pertenece al usuario actual
    const goalResult = await prisma.$queryRaw<RawUserGoal[]>`
      SELECT * FROM UserGoal WHERE id = ${goalId} AND userId = ${userId}
    `;
    
    const goal = Array.isArray(goalResult) && goalResult.length > 0 ? goalResult[0] : null;
    
    if (!goal || !isRawUserGoal(goal)) {
      throw new Error('Meta no encontrada o no tienes permiso para eliminarla');
    }
    
    // Eliminar las actividades asociadas a la meta
    await prisma.$executeRaw`
      DELETE FROM UserActivity WHERE goalId = ${goalId}
    `;
    
    // Eliminar la meta
    await prisma.$executeRaw`
      DELETE FROM UserGoal WHERE id = ${goalId} AND userId = ${userId}
    `;
    
    revalidatePath('/dashboard/metas');
    
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al eliminar meta:', error);
    throw new Error(`Error al eliminar meta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Actualizar el progreso de una meta
async function updateGoalProgress(goalId: string): Promise<void> {
  try {
    console.log('Actualizando progreso de meta:', goalId);
    
    // Contar actividades asociadas a esta meta
    const count = await prisma.userActivity.count({
      where: {
        goalId: goalId
      }
    });
    
    console.log('Número de actividades encontradas:', count);
    
    // Obtener la meta actual
    const goal = await prisma.userGoal.findUnique({
      where: {
        id: goalId
      }
    });
    
    if (!goal) {
      console.error('Meta no encontrada:', goalId);
      throw new Error('Meta no encontrada');
    }
    
    console.log('Meta encontrada:', goal);
    
    // Actualizar el contador y verificar si se completó
    const isCompleted = count >= goal.targetCount;
    
    await prisma.userGoal.update({
      where: {
        id: goalId
      },
      data: {
        currentCount: count,
        isCompleted: isCompleted,
        updatedAt: new Date()
      }
    });
    
    console.log('Progreso actualizado correctamente');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al actualizar progreso de meta:', error);
    throw new Error(`Error al actualizar progreso: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Funciones auxiliares
function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  const progress = Math.min(Math.floor((current / target) * 100), 100);
  return progress;
}

function mapActivityToDTO(activity: RawUserActivity): UserActivity {
  let parsedMetadata: Record<string, unknown> | undefined;
  
  if (activity.metadata) {
    try {
      if (typeof activity.metadata === 'string') {
        const parsed = JSON.parse(activity.metadata) as Record<string, unknown>;
        if (typeof parsed === 'object' && parsed !== null) {
          parsedMetadata = parsed;
        }
      } else if (typeof activity.metadata === 'object' && activity.metadata !== null) {
        parsedMetadata = activity.metadata as Record<string, unknown>;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error parsing metadata:', error);
      parsedMetadata = undefined;
    }
  }

  return {
    id: activity.id,
    userId: activity.userId,
    goalId: activity.goalId,
    type: activity.type,
    description: activity.description,
    timestamp: new Date(activity.timestamp).toISOString(),
    relatedId: activity.relatedId,
    relatedType: activity.relatedType,
    points: Number(activity.points),
    metadata: parsedMetadata,
  };
}

// Eliminar una actividad del usuario
export async function deleteUserActivity(activityId: string): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    
    // Si no hay usuario autenticado, no se permite eliminar actividades
    if (!userId) {
      throw new Error('Debes iniciar sesión para eliminar una actividad');
    }
    
    // Verificar que la actividad pertenece al usuario actual
    const activityResult = await prisma.$queryRaw<RawUserActivity[]>`
      SELECT * FROM UserActivity WHERE id = ${activityId} AND userId = ${userId}
    `;
    
    const activity = Array.isArray(activityResult) && activityResult.length > 0 ? activityResult[0] : null;
    
    if (!activity || !isRawUserActivity(activity)) {
      throw new Error('Actividad no encontrada o no tienes permiso para eliminarla');
    }
    
    // Obtener el goalId antes de eliminar la actividad
    const goalId = activity.goalId;
    
    // Eliminar la actividad
    await prisma.$executeRaw`
      DELETE FROM UserActivity WHERE id = ${activityId} AND userId = ${userId}
    `;
    
    // Si la actividad estaba asociada a una meta, actualizar el progreso
    if (goalId) {
      await updateGoalProgress(goalId);
    }
    
    revalidatePath('/dashboard/progreso/actividades');
    
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al eliminar actividad:', error);
    throw new Error(`Error al eliminar actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
} 