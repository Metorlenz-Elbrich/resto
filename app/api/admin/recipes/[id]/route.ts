import { NextRequest, NextResponse } from 'next/server';
import { db, Recipe } from '@/lib/db';
import { CATEGORIES } from '@/lib/constants';
import { savePhoto, deletePhoto } from '@/lib/photo';

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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
  }

  const existing = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as Recipe | undefined;
  if (!existing) {
    return NextResponse.json({ error: 'Recette introuvable.' }, { status: 404 });
  }

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
    const validated = String(formData.get('validated') ?? '0') === '1' ? 1 : 0;

    let photoFilename = existing.photo_filename;
    const removePhoto = String(formData.get('remove_photo') ?? '') === '1';
    const photo = formData.get('photo');

    if (photo instanceof File && photo.size > 0) {
      const newFilename = await savePhoto(photo);
      await deletePhoto(existing.photo_filename);
      photoFilename = newFilename;
    } else if (removePhoto) {
      await deletePhoto(existing.photo_filename);
      photoFilename = null;
    }

    db.prepare(`
      UPDATE recipes SET
        title = @title,
        category = @category,
        tags = @tags,
        prep_time = @prep_time,
        difficulty = @difficulty,
        ingredients = @ingredients,
        steps = @steps,
        submitter_name = @submitter_name,
        photo_filename = @photo_filename,
        validated = @validated
      WHERE id = @id
    `).run({
      id,
      title,
      category,
      tags,
      prep_time: prepTime,
      difficulty,
      ingredients: JSON.stringify(ingredients),
      steps: JSON.stringify(steps),
      submitter_name: submitterName,
      photo_filename: photoFilename,
      validated,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la recette', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
  }

  const existing = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as Recipe | undefined;
  if (!existing) {
    return NextResponse.json({ error: 'Recette introuvable.' }, { status: 404 });
  }

  await deletePhoto(existing.photo_filename);
  db.prepare('DELETE FROM recipes WHERE id = ?').run(id);

  return NextResponse.json({ ok: true });
}
