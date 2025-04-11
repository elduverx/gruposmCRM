import { getAllNews } from './actions';
import NewsClient from './NewsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NewsPage() {
  try {
    const news = await getAllNews();
    return <NewsClient news={news} />;
  } catch (error) {
    // During build time, return a loading state
    if (process.env.NODE_ENV === 'production' && process.env.SKIP_DB_CHECK === 'true') {
      return <div>Cargando...</div>;
    }
    throw error;
  }
} 