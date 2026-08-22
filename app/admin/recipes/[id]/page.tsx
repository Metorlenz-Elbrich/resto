import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db, Recipe } from '@/lib/db';
import RecipeForm from '@/components/RecipeForm';

export const dynamic = 'force-dynamic';

export default function EditRecipePage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as Recipe | undefined;
  if (!recipe) notFound();

  return (
    <main className="page">
      <div className="hero-eyebrow">
        <Link href="/admin">← Retour à la liste</Link>
      </div>
      <div className="hero">
        <h1>Modifier la recette</h1>
      </div>
      <div className="card">
        <RecipeForm
          mode="edit"
          initial={{
            id: recipe.id,
            title: recipe.title,
            category: recipe.category,
            tags: recipe.tags,
            prep_time: recipe.prep_time,
            difficulty: recipe.difficulty,
            ingredients: JSON.parse(recipe.ingredients || '[]'),
            steps: JSON.parse(recipe.steps || '[]'),
            submitter_name: recipe.submitter_name,
            photo_filename: recipe.photo_filename,
            validated: Boolean(recipe.validated),
          }}
        />
      </div>
    </main>
  );
}
