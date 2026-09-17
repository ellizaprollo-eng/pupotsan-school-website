import { requireAdminUser, adminSignOutPath } from '../admin-auth';
import { getSchoolContent } from '@/lib/school-data';
import ContentEditor from './content-editor';
export const dynamic='force-dynamic';
export default async function Admin(){
  const user=await requireAdminUser('/admin');
  const content=await getSchoolContent();
  return <ContentEditor initialContent={content.data} initialRevision={content.revision} available={content.available} name={user.displayName} signOutHref={adminSignOutPath('/')}/>;
}
