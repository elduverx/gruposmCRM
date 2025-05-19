'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma-users';
import { JWT_SECRET } from '@/lib/auth';
import { UserGoal, UserActivity, CreateUserGoalInput, CreateUserActivityInput } from '@/types/user';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

// Obtener el ID del usuario actual basado en el token de autenticación
async function getCurrentUserId(): Promise<{userId: string | null, isAdmin: boolean}> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return {userId: null, isAdmin: false};
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role?: string };
      return {
        userId: decoded.userId,
        isAdmin: decoded.role === 'ADMIN'
      };
    } catch (error) {
      return {userId: null, isAdmin: false};
    }
  } catch (error) {
    return {userId: null, isAdmin: false};
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
    const {userId} = await getCurrentUserId();
    
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
    throw new Error(`Error al obtener metas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Crear una nueva meta 
export async function createUserGoal(data: CreateUserGoalInput): Promise<UserGoal> {
  try {
    const {userId} = await getCurrentUserId();
    
    // Si no hay usuario autenticado, no se permite crear metas
    if (!userId) {
      throw new Error('Debes iniciar sesión para crear una meta');
    }
    
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
    throw new Error(`Error al crear meta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Registrar una nueva actividad
export async function createUserActivity(data: CreateUserActivityInput): Promise<UserActivity> {
  try {
    const {userId} = await getCurrentUserId();
    
    // Si no hay usuario autenticado, no se permite crear actividades
    if (!userId) {
      throw new Error('Debes iniciar sesión para registrar una actividad');
    }
    
    // Usar la fecha proporcionada o la fecha actual si no se proporciona
    const activityTimestamp = data.timestamp || new Date();
    
    // Preparar los datos para la creación
    const activityData = {
      userId,
      goalId: data.goalId,
      type: data.type,
      description: data.description,
      timestamp: activityTimestamp,
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
          // Si es un objeto, convertirlo a JSON string
          activityData.metadata = JSON.stringify(data.metadata) as unknown as Prisma.InputJsonValue;
        } catch {
          activityData.metadata = null as unknown as Prisma.InputJsonValue;
        }
      }
    }
    
    // Crear la actividad
    const newActivity = await prisma.userActivity.create({
      data: activityData
    });
    
    // Actualizar el progreso de la meta si está asociada a una
    if (data.goalId) {
      await updateGoalProgress(data.goalId);
    }
    
    revalidatePath('/dashboard/metas');
    
    // Convertir el timestamp a string y asegurar que metadata sea string o null
    const activityWithStringTimestamp = {
      ...newActivity,
      timestamp: newActivity.timestamp.toISOString(),
      metadata: newActivity.metadata ? JSON.stringify(newActivity.metadata) : null
    };
    
    return mapActivityToDTO(activityWithStringTimestamp);
  } catch (error) {
    throw new Error(`Error al crear actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Obtener el historial de actividades
export async function getUserActivities(limit = 50): Promise<UserActivity[]> {
  try {
    const {userId} = await getCurrentUserId();
    
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
    throw new Error(`Error al obtener actividades: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Eliminar una meta del usuario
export async function deleteUserGoal(goalId: string): Promise<boolean> {
  try {
    const {userId, isAdmin} = await getCurrentUserId();
    
    // Si no hay usuario autenticado, no se permite eliminar metas
    if (!userId) {
      throw new Error('Debes iniciar sesión para eliminar una meta');
    }
    
    // Verificar que la meta existe
    const goalExists = await prisma.userGoal.findUnique({
      where: { id: goalId }
    });
    
    if (!goalExists) {
      throw new Error('Meta no encontrada');
    }
    
    // Si no es admin, verificar que la meta pertenece al usuario actual
    if (!isAdmin) {
      const goalBelongsToUser = await prisma.userGoal.findFirst({
        where: {
          id: goalId,
          userId: userId
        }
      });
      
      if (!goalBelongsToUser) {
        throw new Error('No tienes permiso para eliminar esta meta');
      }
    }
    
    // Eliminar las actividades asociadas a la meta
    await prisma.$executeRaw`
      DELETE FROM UserActivity WHERE goalId = ${goalId}
    `;
    
    // Eliminar la meta
    await prisma.$executeRaw`
      DELETE FROM UserGoal WHERE id = ${goalId}
    `;
    
    revalidatePath('/dashboard/metas');
    
    return true;
  } catch (error) {
    throw new Error(`Error al eliminar meta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Actualizar el progreso de una meta
async function updateGoalProgress(goalId: string): Promise<void> {
  try {
    // Contar actividades asociadas a esta meta
    const count = await prisma.userActivity.count({
      where: {
        goalId: goalId
      }
    });
    
    // Obtener la meta actual
    const goal = await prisma.userGoal.findUnique({
      where: {
        id: goalId
      }
    });
    
    if (!goal) {
      throw new Error('Meta no encontrada');
    }
    
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
  } catch (error) {
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
    const {userId, isAdmin} = await getCurrentUserId();
    
    // Si no hay usuario autenticado, no se permite eliminar actividades
    if (!userId) {
      throw new Error('Debes iniciar sesión para eliminar una actividad');
    }
    
    // Verificar que la actividad existe
    const activityExists = await prisma.userActivity.findUnique({
      where: { id: activityId }
    });
    
    if (!activityExists) {
      throw new Error('Actividad no encontrada');
    }
    
    // Si no es admin, verificar que la actividad pertenece al usuario actual
    if (!isAdmin) {
      const activityBelongsToUser = await prisma.userActivity.findFirst({
        where: {
          id: activityId,
          userId: userId
        }
      });
      
      if (!activityBelongsToUser) {
        throw new Error('No tienes permiso para eliminar esta actividad');
      }
    }
    
    // Obtener el goalId antes de eliminar la actividad
    const goalId = activityExists.goalId;
    
    // Eliminar la actividad
    await prisma.$executeRaw`
      DELETE FROM UserActivity WHERE id = ${activityId}
    `;
    
    // Si la actividad estaba asociada a una meta, actualizar el progreso
    if (goalId) {
      await updateGoalProgress(goalId);
    }
    
    revalidatePath('/dashboard/progreso/actividades');
    
    return true;
  } catch (error) {
    throw new Error(`Error al eliminar actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
} 