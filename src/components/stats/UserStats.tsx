import { Card } from '../ui/Card';
import { UserStats as UserStatsType } from '@prisma/client';

interface UserStatsProps {
  stats: UserStatsType | null;
}

export function UserStats({ stats }: UserStatsProps) {
  if (!stats) {
    return (
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Estadísticas Detalladas</h2>
          <p>No hay estadísticas disponibles</p>
        </div>
      </Card>
    );
  }

  const statItems = [
    { label: 'Propiedades Creadas', value: stats.propertiesCreated },
    { label: 'Propiedades Vacías', value: stats.emptyProperties },
    { label: 'Teléfonos Añadidos', value: stats.phonesAdded },
    { label: 'Vacíos Localizados', value: stats.emptiesLocated },
    { label: 'DPVs Localizados', value: stats.dpvLocated },
    { label: 'Noticias Creadas', value: stats.newsCreated },
    { label: 'Valoraciones Añadidas', value: stats.valuationsAdded },
    { label: 'Encargos Creados', value: stats.assignmentsCreated },
    { label: 'Propiedades Vendidas', value: stats.propertiesSold },
    { label: 'Contactos Realizados', value: stats.contactsMade }
  ];

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Estadísticas Detalladas</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {statItems.map((item) => (
            <div key={item.label} className="border rounded p-3">
              <p className="text-sm text-gray-600">{item.label}</p>
              <p className="text-xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Última actualización: {new Date(stats.lastUpdated).toLocaleDateString()}
        </p>
      </div>
    </Card>
  );
}
