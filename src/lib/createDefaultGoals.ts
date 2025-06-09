import { PrismaClient, GoalCategory } from '@prisma/client';

const prisma = new PrismaClient();

export interface DefaultGoal {
    title: string;
    description: string;
    targetCount: number;
    category: GoalCategory;
}

const defaultGoals: DefaultGoal[] = [
    // Metas principales
    {
        title: "Actividades Completadas",
        description: "Realizar actividades como visitas, llamadas y emails",
        targetCount: 20,
        category: GoalCategory.ACTIVITY
    },
    {
        title: "DPVs Recopilados",
        description: "Recopilar información de precios y valores de propiedades",
        targetCount: 15,
        category: GoalCategory.DPV
    },
    {
        title: "Noticias Generadas",
        description: "Crear noticias sobre propiedades y mercado",
        targetCount: 10,
        category: GoalCategory.NEWS
    },
    {
        title: "Encargos Gestionados",
        description: "Gestionar encargos y asignaciones de propiedades",
        targetCount: 5,
        category: GoalCategory.ASSIGNMENT
    },
    // Categorías adicionales
    {
        title: "Inquilinos Localizados",
        description: "Localizar y registrar inquilinos en propiedades",
        targetCount: 10,
        category: GoalCategory.LOCATED_TENANTS
    },
    {
        title: "Teléfonos Añadidos",
        description: "Añadir números de teléfono de contacto",
        targetCount: 15,
        category: GoalCategory.ADDED_PHONES
    },
    {
        title: "Propiedades Vacías",
        description: "Identificar y registrar propiedades sin ocupar",
        targetCount: 8,
        category: GoalCategory.EMPTY_PROPERTIES
    },
    {
        title: "Propiedades Nuevas",
        description: "Identificar y añadir nuevas propiedades",
        targetCount: 12,
        category: GoalCategory.NEW_PROPERTIES
    }
];

export async function createDefaultGoalsForUser(userId: string) {
    try {
        // Crear todas las metas por defecto para el usuario
        const goals = await Promise.all(
            defaultGoals.map(goal =>
                prisma.userGoal.create({
                    data: {
                        userId,
                        title: goal.title,
                        description: goal.description,
                        targetCount: goal.targetCount,
                        category: goal.category,
                        currentCount: 0,
                        startDate: new Date(),
                        isCompleted: false
                    }
                })
            )
        );

        return goals;
    } catch (error) {
        console.error('Error al crear metas por defecto:', error);
        throw new Error(`Error al crear metas por defecto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
}
