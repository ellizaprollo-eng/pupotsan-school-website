import SchoolWebsite from './school-website';
import { getSchoolContent } from '@/lib/school-data';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const content = await getSchoolContent();
  return <SchoolWebsite initialContent={content.data} storageAvailable={content.available} />;
}
