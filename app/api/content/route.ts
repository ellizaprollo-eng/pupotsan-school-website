import { getAdminUser } from '@/app/admin-auth';
import { contentDb, getSchoolContent } from '@/lib/school-data';
import { z } from 'zod';
const facebook = z.string().max(2000).refine(v=>!v||/^https:\/\/(www\.)?facebook\.com\/(pupotsanNHS(?:\/|\?|$)|photo\/?\?)/i.test(v),'Use a photo or post from the school Facebook page');
const image = z.string().max(300).refine(v=>!v||/^\/media\/[a-f0-9-]+\.(jpg|png|webp)$/.test(v)||/^\/(campus|school-[a-z-]+)\.(jpg|png|webp)$/.test(v),'Upload a school image first');
const schema=z.object({revision:z.number().int().min(0),data:z.object({notice:z.string().trim().min(1).max(400),enrollment:z.string().trim().min(1).max(3000),requirements:z.string().trim().min(1).max(3000),seniorHighStrands:z.array(z.string().trim().min(1).max(160)).min(1).max(12),seniorHighCertification:z.string().trim().min(1).max(160),acceptsAls:z.boolean(),heroImage:image,heroSource:facebook,gallery:z.array(z.object({id:z.string().max(60),url:image.refine(v=>!!v),caption:z.string().trim().min(1).max(200),source:facebook.refine(v=>!!v)})).max(24),posts:z.array(z.object({id:z.string().max(60),title:z.string().trim().min(1).max(160),category:z.enum(['Announcement','Enrollment','Campus life','Achievement']),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v))),body:z.string().trim().min(1).max(6000),image,source:facebook})).max(50)})});
export async function GET(){
  if(!await getAdminUser())return Response.json({error:'Please sign in to manage the website.'},{status:401});
  const c=await getSchoolContent();
  return Response.json(c,{status:c.available?200:503,headers:{'Cache-Control':'no-store'}});
}
export async function PUT(request:Request){
  const user=await getAdminUser();
  if(!user)return Response.json({error:'Please sign in to manage the website.'},{status:401});
  // Access is gated by the single ADMIN_PASSWORD session — see app/admin-auth.ts.
  const origin=request.headers.get('origin');
  if(!origin||origin!==new URL(request.url).origin)return Response.json({error:'Request origin could not be verified.'},{status:403});
  if(Number(request.headers.get('content-length')||0)>500000)return Response.json({error:'Content is too large.'},{status:413});
  try {
    const input=schema.safeParse(await request.json());
    if(!input.success)return Response.json({error:input.error.issues[0]?.message||'Please check the form.'},{status:400});
    const {data,revision}=input.data;
    const db=contentDb();
    const result=revision===0
      ?await db.prepare('INSERT OR IGNORE INTO school_content (id, content, revision, updated_by, updated_at) VALUES (?, ?, 1, ?, ?)').bind('school',JSON.stringify(data),user.userId,new Date().toISOString()).run()
      :await db.prepare('UPDATE school_content SET content = ?, revision = revision + 1, updated_by = ?, updated_at = ? WHERE id = ? AND revision = ?').bind(JSON.stringify(data),user.userId,new Date().toISOString(),'school',revision).run();
    if(result.meta.changes!==1)return Response.json({error:'Another edit was saved since you opened this page. Copy your changes, then reload before saving.'},{status:409});
    return Response.json({success:true,revision:revision+1});
  }catch(error){console.error('Content save failed',error);return Response.json({error:'Could not save right now. Your edits are still here. Please try again.'},{status:503});}
}
