import { getAllNews } from './actions';
import NewsClient from './NewsClient';

export default async function NewsPage() {
  const news = await getAllNews();

  return <NewsClient news={news} />;
} 