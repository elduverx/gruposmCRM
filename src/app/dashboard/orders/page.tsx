import { getOrders } from './actions';
import { getClients } from '../clients/actions';
import { getProperties } from '../properties/actions';
import OrderList from './OrderList';

export default async function OrdersPage() {
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
} 