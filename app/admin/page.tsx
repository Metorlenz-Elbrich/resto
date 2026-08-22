import { db, Recipe } from '@/lib/db';
import AdminRecipeList from '@/components/AdminRecipeList';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const recipes = db
    .prepare('SELECT * FROM recipes ORDER BY created_at DESC')
    .all() as Recipe[];

  return (
    <main className="page-wide">
      <div className="admin-header">
        <div>
          <div className="hero-eyebrow">Espace admin</div>
          <h1>
            Recettes reçues
            <span className="badge-count">{recipes.length}</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a className="top-link" href="/api/admin/export?filter=validated" target="_blank" rel="noreferrer">
            📖 Exporter (validées)
          </a>
          <a className="top-link" href="/api/admin/export?filter=all" target="_blank" rel="noreferrer">
            📚 Exporter (toutes)
          </a>
        </div>
      </div>
      <AdminRecipeList recipes={recipes} />
    </main>
  );
}
