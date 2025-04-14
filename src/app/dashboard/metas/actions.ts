'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma-users';
import { JWT_SECRET } from '@/lib/auth';
import { UserGoal, UserActivity, CreateUserGoalInput, CreateUserActivityInput } from '@/types/user';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Obtener el ID del usuario actual basado en el token de autenticación
async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return null;
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (typeof decoded === 'object' && decoded.userId) {
        return decoded.userId;
      }
      return null;
    } catch (error) {
      return null;
    }
  } catch (error) {
    return null;
  }
}

// Obtener todas las metas
export async function getUserGoals(): Promise<UserGoal[]> {
  try {
    const userId = await getCurrentUserId();
    
    // Si no hay usuario autenticado, devolver una lista vacía
    if (!userId) {
      return [];
    }
    
    const goals = await prisma.$queryRaw`
      SELECT g.*, COUNT(a.id) as activityCount
      FROM UserGoal g 
      LEFT JOIN UserActivity a ON g.id = a.goalId
      WHERE g.userId = ${userId}
      GROUP BY g.id
      ORDER BY g.createdAt DESC
    `;

    // Obtener actividades recientes para cada meta
    const goalsWithActivities = await Promise.all(
      Array.isArray(goals) ? goals.map(async (goal: any) => {
        const activities = await prisma.$queryRaw`
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
          progress: calculateProgress(goal.currentCount, goal.targetCount),
          activities: Array.isArray(activities) ? activities.map((act: any) => mapActivityToDTO(act)) : [],
        };
      }) : []
    );

    return goalsWithActivities;
  } catch (error) {
    console.error('Error al obtener metas:', error);
    // Devolver un arreglo vacío en lugar de lanzar un error
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
    
    const result = await prisma.$executeRaw`
      INSERT INTO UserGoal (
        id, userId, title, description, targetCount, currentCount, 
        startDate, endDate, isCompleted, category, createdAt, updatedAt
      ) VALUES (
        UUID(), ${userId}, ${data.title}, ${data.description || null}, ${data.targetCount}, 0,
        NOW(), ${data.endDate ? new Date(data.endDate) : null}, false, ${data.category || 'GENERAL'}, 
        NOW(), NOW()
      )
    `;
    
    const newGoal = await prisma.$queryRaw`
      SELECT * FROM UserGoal 
      WHERE userId = ${userId}
      ORDER BY createdAt DESC
      LIMIT 1
    `;
    
    const goal = Array.isArray(newGoal) && newGoal.length > 0 ? newGoal[0] : null;
    if (!goal) throw new Error('Error al crear meta');

    revalidatePath('/dashboard/metas');
    
    return {
      ...goal,
      createdAt: new Date(goal.createdAt).toISOString(),
      updatedAt: new Date(goal.updatedAt).toISOString(), 
      startDate: new Date(goal.startDate).toISOString(),
      endDate: goal.endDate ? new Date(goal.endDate).toISOString() : null,
      progress: calculateProgress(goal.currentCount, goal.targetCount),
    };
  } catch (error) {
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
    
    // Crear la actividad
    const result = await prisma.$executeRaw`
      INSERT INTO UserActivity (
        id, userId, goalId, type, description, timestamp, 
        metadata, relatedId, relatedType, points
      ) VALUES (
        UUID(), ${userId}, ${data.goalId || null}, ${data.type}, ${data.description || null}, NOW(),
        ${data.metadata ? JSON.stringify(data.metadata) : '{}'}, ${data.relatedId || null}, 
        ${data.relatedType || null}, ${data.points || 1}
      )
    `;
    
    // Obtener la actividad recién creada
    const newActivity = await prisma.$queryRaw`
      SELECT * FROM UserActivity 
      WHERE userId = ${userId}
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    
    const activity = Array.isArray(newActivity) && newActivity.length > 0 ? newActivity[0] : null;
    if (!activity) throw new Error('Error al crear actividad');

    // Si está asociada a una meta, actualizar el contador de la meta
    if (data.goalId) {
      await updateGoalProgress(data.goalId);
    }

    revalidatePath('/dashboard/metas');
    
    return mapActivityToDTO(activity);
  } catch (error) {
    console.error('Error al registrar actividad:', error);
    throw new Error(`Error al registrar actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
    
    const activities = await prisma.$queryRaw`
      SELECT a.*, g.title as goalTitle 
      FROM UserActivity a
      LEFT JOIN UserGoal g ON a.goalId = g.id
      WHERE a.userId = ${userId}
      ORDER BY a.timestamp DESC
      LIMIT ${limit}
    `;

    return Array.isArray(activities) ? activities.map((act: any) => ({
      ...mapActivityToDTO(act),
      goalTitle: act.goalTitle,
    })) : [];
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    // Devolver un arreglo vacío en lugar de lanzar un error
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
    const goalResult = await prisma.$queryRaw`
      SELECT * FROM UserGoal WHERE id = ${goalId} AND userId = ${userId}
    `;
    
    const goal = Array.isArray(goalResult) && goalResult.length > 0 ? goalResult[0] : null;
    
    if (!goal) {
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
    console.error('Error al eliminar meta:', error);
    throw new Error(`Error al eliminar meta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Actualizar el progreso de una meta
async function updateGoalProgress(goalId: string): Promise<void> {
  try {
    // Contar actividades asociadas a esta meta
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM UserActivity 
      WHERE goalId = ${goalId}
    `;
    
    const count = Array.isArray(countResult) && countResult.length > 0 
      ? Number(countResult[0].count) : 0;
    
    // Obtener la meta actual
    const goalResult = await prisma.$queryRaw`
      SELECT * FROM UserGoal WHERE id = ${goalId}
    `;
    
    const goal = Array.isArray(goalResult) && goalResult.length > 0 ? goalResult[0] : null;
    
    if (!goal) {
      throw new Error('Meta no encontrada');
    }
    
    // Actualizar el contador y verificar si se completó
    const isCompleted = count >= goal.targetCount;
    
    await prisma.$executeRaw`
      UPDATE UserGoal 
      SET currentCount = ${count}, isCompleted = ${isCompleted ? 1 : 0}, updatedAt = NOW()
      WHERE id = ${goalId}
    `;
    
  } catch (error) {
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

function mapActivityToDTO(activity: any): UserActivity {
  return {
    id: activity.id,
    userId: activity.userId,
    goalId: activity.goalId,
    type: activity.type,
    description: activity.description,
    timestamp: new Date(activity.timestamp).toISOString(),
    relatedId: activity.relatedId,
    relatedType: activity.relatedType,
    points: activity.points,
    metadata: activity.metadata ? 
      (typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : activity.metadata) 
      : undefined,
  };
} 