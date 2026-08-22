import { NextRequest, NextResponse } from 'next/server';
import { db, Recipe } from '@/lib/db';

export const runtime = 'nodejs';

// Export CSV plutôt que .xlsx : aucune dépendance supplémentaire à installer,
// et Excel/Google Sheets/LibreOffice ouvrent un .csv nativement. Le BOM UTF-8
// ci-dessous assure que les accents s'affichent correctement dans Excel.
function parseList(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function csvEscape(value: string): string {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

const HEADERS = [
  'Titre',
  'Categorie',
  'Tags',
  'Temps de preparation',
  'Difficulte',
  'Ingredients',
  'Etapes',
  'Nom du contributeur',
  'Validee',
  'Date de soumission',
];

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get('filter') === 'all' ? 'all' : 'validated';

  const recipes = (
    filter === 'all'
      ? db.prepare('SELECT * FROM recipes ORDER BY category, title').all()
      : db.prepare('SELECT * FROM recipes WHERE validated = 1 ORDER BY category, title').all()
  ) as Recipe[];

  const rows = recipes.map((r) => {
    const ingredients = parseList(r.ingredients).join('\n');
    const steps = parseList(r.steps)
      .map((s, i) => `${i + 1}. ${s}`)
      .join('\n');
    return [
      r.title,
      r.category,
      r.tags,
      r.prep_time,
      r.difficulty,
      ingredients,
      steps,
      r.submitter_name,
      r.validated ? 'Oui' : 'Non',
      r.created_at,
    ]
      .map((v) => csvEscape(String(v ?? '')))
      .join(',');
  });

  const csv = [HEADERS.join(','), ...rows].join('\r\n');
  const bom = '﻿';
  const buffer = Buffer.from(bom + csv, 'utf-8');

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="recettes-${filter === 'all' ? 'toutes' : 'validees'}.csv"`,
    },
  });
}
