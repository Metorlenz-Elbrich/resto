import { NextRequest, NextResponse } from 'next/server';

// Protège /admin et /api/admin/* avec une authentification HTTP Basic.
// Le navigateur affiche une popup native de login — pas besoin de page
// de connexion dédiée. Le mot de passe attendu vient de la variable
// d'environnement ADMIN_PASSWORD (voir .env.example).
export function middleware(request: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return new NextResponse(
      'ADMIN_PASSWORD n\'est pas configuré côté serveur. Défini cette variable d\'environnement puis redéploie.',
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Basic ')) {
    const decoded = atob(authHeader.slice('Basic '.length));
    const separatorIndex = decoded.indexOf(':');
    const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : '';
    if (password === expected) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentification requise', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Espace admin"' },
  });
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
