import { getOrders } from './actions';
import { getClients } from '../clients/actions';
import OrderList from './OrderList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OrdersPage() {
  try {
    const [orders, clients] = await Promise.all([
      getOrders(),
      getClients()
    ]);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
                  🛒 Gestión de Pedidos
                </h1>
                <p className="text-slate-600 mt-1">
                  Administra y supervisa todos los pedidos del sistema
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-visible">
          <OrderList orders={orders} clients={clients} />
        </div>
      </div>
    );
  } catch (error) {
    // During build time, return a loading state
    if (process.env.NODE_ENV === 'production' && process.env.SKIP_DB_CHECK === 'true') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
          <div className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-audiowide">
                    🛒 Gestión de Pedidos
                  </h1>
                  <p className="text-slate-600 mt-1">
                    Administra y supervisa todos los pedidos del sistema
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 opacity-20 animate-pulse"></div>
              </div>
              <p className="text-slate-700 text-lg font-medium">🛒 Cargando pedidos...</p>
            </div>
          </div>
        </div>
      );
    }
    throw error;
  }
} 
