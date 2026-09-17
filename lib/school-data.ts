import { env } from 'cloudflare:workers';
import { DEFAULT_CONTENT, type SchoolContent } from './content';
export function contentDb() { if (!env.DB) throw new Error('School content storage is unavailable'); return env.DB; }
export async function getSchoolContent() {
  try {
    const row = await contentDb().prepare('SELECT content, revision FROM school_content WHERE id = ?').bind('school').first<{content:string;revision:number}>();
    return {data:row ? {...DEFAULT_CONTENT,...JSON.parse(row.content)} as SchoolContent : DEFAULT_CONTENT, revision:row?.revision ?? 0,available:true};
  } catch(error) { console.error('School content read failed',error); return {data:DEFAULT_CONTENT,revision:0,available:false}; }
}
