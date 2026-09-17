export const dynamic = 'force-dynamic';

function safeReturnTo(value: string | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/admin';
  return value;
}

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string; error?: string }>;
}) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.return_to);

  return (
    <main className="admin-page">
      <div className="container" style={{ maxWidth: 420 }}>
        <p className="eyebrow" style={{ marginTop: 30 }}>PUPOTSAN NATIONAL HIGH SCHOOL</p>
        <h1>Admin sign in</h1>
        <p>Enter the website admin password to manage school content.</p>
        {params.error && (
          <p role="alert" className="status-message error">Incorrect password. Please try again.</p>
        )}
        <form
          method="POST"
          action="/api/admin-login"
          style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}
        >
          <input type="hidden" name="return_to" value={returnTo} />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoFocus />
          <button className="button button-green" type="submit" style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
