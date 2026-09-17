import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export async function POST(request:Request){
  if(!await getChatGPTUser())return Response.json({error:'Please sign in.'},{status:401});
  if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Request origin could not be verified.'},{status:403});
  if(Number(request.headers.get('content-length')||0)>5300000)return Response.json({error:'Choose an image smaller than 5 MB.'},{status:413});
  try{
    if(!env.BUCKET)throw new Error('Missing image storage');
    const form=await request.formData();const file=form.get('file');
    if(!(file instanceof File)||!file.size||file.size>5000000)return Response.json({error:'Choose an image smaller than 5 MB.'},{status:400});
    const bytes=new Uint8Array(await file.arrayBuffer());
    const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
    const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
    const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
    if(!png&&!jpg&&!webp)return Response.json({error:'Please choose a JPG, PNG, or WebP image.'},{status:400});
    const ext=png?'png':jpg?'jpg':'webp'; const key=crypto.randomUUID()+'.'+ext;
    await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:'image/'+(ext==='jpg'?'jpeg':ext)}});
    return Response.json({url:'/media/'+key});
  }catch(error){console.error('Image upload failed',error);return Response.json({error:'Image upload failed. Please try again.'},{status:503});}
}
