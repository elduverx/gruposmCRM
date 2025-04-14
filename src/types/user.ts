import { Role } from '@prisma/client';

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface UserGoal {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  targetCount: number;
  currentCount: number;
  startDate: string;
  endDate?: string | null;
  isCompleted: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
  activities?: UserActivity[];
  progress?: number; // Porcentaje de progreso calculado
}

export interface UserActivity {
  id: string;
  userId: string;
  goalId?: string | null;
  type: string;
  description?: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
  relatedId?: string | null;
  relatedType?: string | null;
  points: number;
}

export interface CreateUserGoalInput {
  title: string;
  description?: string;
  targetCount: number;
  category?: string;
  endDate?: string;
}

export interface CreateUserActivityInput {
  goalId?: string;
  type: string;
  description?: string;
  relatedId?: string;
  relatedType?: string;
  points?: number;
  metadata?: Record<string, any>;
} 