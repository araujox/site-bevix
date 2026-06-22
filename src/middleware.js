import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Excluir rotas administrativas abertas, de login, autenticação e estáticos
  if (
    pathname === '/admin-secure/login' ||
    pathname === '/api/auth/login' ||
    pathname === '/api/admin/migrate-db' ||
    pathname === '/api/admin/debug-db' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/uploads')
  ) {
    return NextResponse.next();
  }

  // Verificar se é uma rota administrativa
  const isAdminPage = pathname.startsWith('/admin-secure');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (isAdminPage || isAdminApi) {
    const token = request.cookies.get('admin_session')?.value;

    if (!token) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin-secure/login', request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 });
      }
      // Limpar cookie e redirecionar
      const response = NextResponse.redirect(new URL('/admin-secure/login', request.url));
      response.cookies.delete('admin_session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin-secure/:path*', '/api/admin/:path*'],
};
