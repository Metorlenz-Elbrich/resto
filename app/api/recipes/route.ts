import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CATEGORIES } from '@/lib/constants';
import { savePhoto } from '@/lib/photo';

export const runtime = 'nodejs';

function parseListField(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // ignore
  }
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const title = String(formData.get('title') ?? '').trim();
    if (!title) {
      return NextResponse.json({ error: 'Le titre est obligatoire.' }, { status: 400 });
    }

    const ingredients = parseListField(formData.get('ingredients'));
    const steps = parseListField(formData.get('steps'));
    if (ingredients.length === 0) {
      return NextResponse.json({ error: 'Ajoute au moins un ingrédient.' }, { status: 400 });
    }
    if (steps.length === 0) {
      return NextResponse.json({ error: 'Ajoute au moins une étape.' }, { status: 400 });
    }

    const categoryRaw = String(formData.get('category') ?? 'Autre');
    const category = (CATEGORIES as readonly string[]).includes(categoryRaw) ? categoryRaw : 'Autre';
    const tags = String(formData.get('tags') ?? '').trim();
    const prepTime = String(formData.get('prep_time') ?? '').trim();
    const difficulty = String(formData.get('difficulty') ?? '').trim();
    const submitterName = String(formData.get('submitter_name') ?? '').trim();

    let photoFilename: string | null = null;
    const photo = formData.get('photo');
    if (photo instanceof File && photo.size > 0) {
      photoFilename = await savePhoto(photo);
    }

    const stmt = db.prepare(`
      INSERT INTO recipes
        (title, category, tags, prep_time, difficulty, ingredients, steps, submitter_name, photo_filename, validated)
      VALUES (@title, @category, @tags, @prep_time, @difficulty, @ingredients, @steps, @submitter_name, @photo_filename, 0)
    `);
    const result = stmt.run({
      title,
      category,
      tags,
      prep_time: prepTime,
      difficulty,
      ingredients: JSON.stringify(ingredients),
      steps: JSON.stringify(steps),
      submitter_name: submitterName,
      photo_filename: photoFilename,
    });

    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la recette', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
