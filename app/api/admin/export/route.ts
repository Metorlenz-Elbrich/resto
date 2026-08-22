import { NextRequest, NextResponse } from 'next/server';
import { db, Recipe } from '@/lib/db';
import { generateCookbookPdf } from '@/lib/pdf';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get('filter') === 'all' ? 'all' : 'validated';

  const recipes = (
    filter === 'all'
      ? db.prepare('SELECT * FROM recipes ORDER BY category, title').all()
      : db.prepare('SELECT * FROM recipes WHERE validated = 1 ORDER BY category, title').all()
  ) as Recipe[];

  if (recipes.length === 0) {
    return NextResponse.json(
      { error: filter === 'validated' ? 'Aucune recette validée pour le moment.' : 'Aucune recette à exporter.' },
      { status: 400 },
    );
  }

  const pdfBuffer = await generateCookbookPdf(recipes);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="livre-de-recettes.pdf"`,
    },
  });
}
