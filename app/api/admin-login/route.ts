import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/app/admin-auth';

function safeReturnTo(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/admin';
  return value;
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const form = await request.formData();
  const password = form.get('password');
  const returnTo = safeReturnTo(form.get('return_to'));

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return Response.json(
      { error: 'Admin login is not configured. Set ADMIN_PASSWORD in your environment.' },
      { status: 500 },
    );
  }

  if (typeof password !== 'string' || password !== expected) {
    return Response.redirect(
      `${origin}/admin-login?return_to=${encodeURIComponent(returnTo)}&error=1`,
      303,
    );
  }

  const cookieValue = await createSessionCookieValue();
  const response = Response.redirect(`${origin}${returnTo}`, 303);
  response.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${cookieValue}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`,
  );
  return response;
}
