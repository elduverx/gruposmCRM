import { getClientById } from '../actions';
import ClientDetails from './ClientDetails';

export default async function ClientPage({ params }: { params: { id: string } }) {
  const client = await getClientById(params.id);

  if (!client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Cliente no encontrado</h1>
        </div>
      </div>
    );
  }

  return <ClientDetails client={client} />;
} 