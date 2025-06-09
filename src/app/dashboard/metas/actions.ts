'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma-users';
import { JWT_SECRET } from '@/lib/auth';
import { UserGoal, UserActivity, CreateUserGoalInput, CreateUserActivityInput } from '@/types/user';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { Prisma, ActivityType } from '@prisma/client';
import { updateGoalProgress } from '@/lib/activityLogger';

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

// Obtener todas las metas
export async function getUserGoals(): Promise<UserGoal[]> {
  try {
    const {userId} = await getCurrentUserId();
    
    // Si no hay usuario autenticado, devolver una lista vacía
    if (!userId) {
      return [];
    }
    
    const goals = await prisma.userGoal.findMany({
      where: {
        userId
      },
      include: {
        activities: {
          select: {
            id: true,
            userId: true,
            goalId: true,
            type: true,
            description: true,
            timestamp: true,
            metadata: true,
            relatedId: true,
            relatedType: true,
            points: true
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map each goal to the UserGoal interface with proper types
    const goalsWithActivities = goals.map(goal => {
      // Convert activities to UserActivity objects with proper type conversion
      const activities = goal.activities.map(activity => ({
        id: activity.id,
        userId: activity.userId,
        goalId: activity.goalId,
        type: activity.type.toString(),
        description: activity.description,
        timestamp: activity.timestamp.toISOString(),
        relatedId: activity.relatedId,
        relatedType: activity.relatedType,
        points: activity.points,
        metadata: activity.metadata as Record<string, unknown> | undefined
      }));

      // Create a properly typed UserGoal object
      const userGoal: UserGoal = {
        id: goal.id,
        userId: goal.userId,
        title: goal.title,
        description: goal.description,
        targetCount: goal.targetCount,
        currentCount: goal.currentCount,
        startDate: goal.startDate.toISOString(),
        endDate: goal.endDate?.toISOString() || null,
        isCompleted: goal.isCompleted,
        category: goal.category, // This is already a GoalCategory enum
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
        progress: calculateProgress(goal.currentCount, goal.targetCount),
        activities
      };

      return userGoal;
    });

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
    let metadata: Prisma.JsonValue = null;
    
    // Manejar el metadata correctamente
    if (data.metadata !== undefined && data.metadata !== null) {
      if (typeof data.metadata === 'string') {
        // Si ya es una cadena, verificar que sea JSON válido
        try {
          metadata = JSON.parse(data.metadata);
        } catch {
          metadata = null;
        }
      } else if (typeof data.metadata === 'object') {
        metadata = data.metadata;
      }
    }
    
    // Crear la actividad con tipos de Prisma correctos
    const activityData: Prisma.UserActivityCreateInput = {
      user: { connect: { id: userId } },
      type: data.type as ActivityType,
      description: data.description,
      timestamp: activityTimestamp,
      relatedId: data.relatedId,
      relatedType: data.relatedType,
      points: data.points ?? 0,
      metadata: metadata as Prisma.InputJsonValue
    };

    // Añadir la relación con goal si se proporciona
    if (data.goalId) {
      activityData.goal = { connect: { id: data.goalId } };
    }

    const newActivity = await prisma.userActivity.create({
      data: activityData
    });
    
    // Actualizar el progreso de la meta si está asociada a una
    if (data.goalId) {
      await updateGoalProgress(data.goalId);
    }
    
    revalidatePath('/dashboard/metas');
    
    return {
      id: newActivity.id,
      userId: newActivity.userId,
      goalId: newActivity.goalId,
      type: newActivity.type.toString(),
      description: newActivity.description,
      timestamp: newActivity.timestamp.toISOString(),
      relatedId: newActivity.relatedId,
      relatedType: newActivity.relatedType,
      points: newActivity.points,
      metadata: newActivity.metadata as Record<string, unknown> | undefined
    };
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
    
    const activities = await prisma.userActivity.findMany({
      where: {
        userId
      },
      include: {
        goal: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    return activities.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      goalId: activity.goalId,
      type: activity.type.toString(),
      description: activity.description,
      timestamp: activity.timestamp.toISOString(),
      relatedId: activity.relatedId,
      relatedType: activity.relatedType,
      points: activity.points,
      metadata: activity.metadata as Record<string, unknown> | undefined,
      goalTitle: activity.goal?.title
    }));
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

// Actualizar una actividad de usuario
export async function updateUserActivity(activityId: string, data: Partial<CreateUserActivityInput>): Promise<UserActivity> {
  try {
    const {userId, isAdmin} = await getCurrentUserId();
    
    if (!userId) {
      throw new Error('Debes iniciar sesión para actualizar una actividad');
    }
    
    const activityExists = await prisma.userActivity.findUnique({
      where: { id: activityId }
    });
    
    if (!activityExists) {
      throw new Error('Actividad no encontrada');
    }
    
    if (!isAdmin && activityExists.userId !== userId) {
      throw new Error('No tienes permiso para actualizar esta actividad');
    }

    // Prepare the update data with proper Prisma types
    const updateData: Prisma.UserActivityUpdateInput = {};
    
    // Update basic fields if provided
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type as ActivityType;
    if (data.points !== undefined) updateData.points = data.points;
    if (data.relatedId !== undefined) updateData.relatedId = data.relatedId;
    if (data.relatedType !== undefined) updateData.relatedType = data.relatedType;
    if (data.timestamp !== undefined) updateData.timestamp = new Date(data.timestamp);
    
    // Update goal relation if provided
    if ('goalId' in data) {
      updateData.goal = data.goalId ? { connect: { id: data.goalId } } : { disconnect: true };
    }
    
    // Handle metadata update
    if (data.metadata !== undefined) {
      if (data.metadata === null) {
        updateData.metadata = Prisma.JsonNull;
      } else {
        updateData.metadata = typeof data.metadata === 'string'
          ? JSON.parse(data.metadata)
          : data.metadata;
      }
    }

    const updatedActivity = await prisma.userActivity.update({
      where: { id: activityId },
      data: updateData,
      include: {
        goal: {
          select: {
            title: true
          }
        }
      }
    });

    // Update goal progress if the activity is associated with a goal
    if (updatedActivity.goalId) {
      await updateGoalProgress(updatedActivity.goalId);
    }

    revalidatePath('/dashboard/metas');
    revalidatePath('/dashboard/progreso/actividades');

    // Map the activity to the expected DTO format
    const activityDTO: UserActivity = {
      id: updatedActivity.id,
      userId: updatedActivity.userId,
      goalId: updatedActivity.goalId,
      type: updatedActivity.type.toString(),
      description: updatedActivity.description,
      timestamp: updatedActivity.timestamp.toISOString(),
      relatedId: updatedActivity.relatedId,
      relatedType: updatedActivity.relatedType,
      points: updatedActivity.points,
      metadata: updatedActivity.metadata as Record<string, unknown> | undefined
    };

    return activityDTO;
  } catch (error) {
    throw new Error(`Error al actualizar actividad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Funciones auxiliares
function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  const progress = Math.min(Math.floor((current / target) * 100), 100);
  return progress;
}

function mapActivityToDTO(activity: {
  id: string;
  userId: string;
  goalId: string | null;
  type: ActivityType;
  description: string | null;
  timestamp: Date;
  metadata: Prisma.JsonValue;
  relatedId: string | null;
  relatedType: string | null;
  points: number;
  goalTitle?: string;
}): UserActivity {
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
    type: activity.type.toString(),
    description: activity.description,
    timestamp: activity.timestamp.toISOString(),
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