import { getOrders } from './actions';
import { getClients } from '../clients/actions';
import { getProperties } from '../properties/actions';
import OrderList from './OrderList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OrdersPage() {
  try {
    const [orders, clients, properties] = await Promise.all([
      getOrders(),
      getClients(),
      getProperties()
    ]);

    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Pedidos</h1>
        </div>
        <OrderList orders={orders} clients={clients} properties={properties} />
      </div>
    );
  } catch (error) {
    // During build time, return a loading state
    if (process.env.NODE_ENV === 'production' && process.env.SKIP_DB_CHECK === 'true') {
      return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Pedidos</h1>
          </div>
          <div>Cargando...</div>
        </div>
      );
    }
    throw error;
  }
} 