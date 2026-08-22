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
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a className="top-link" href="/api/admin/export?filter=validated">
              📖 PDF (validées)
            </a>
            <a className="top-link" href="/api/admin/export?filter=all">
              📚 PDF (toutes)
            </a>
          </div>
          <div style={{ display: 'flex', gap: '1rem', borderLeft: '1px solid var(--line, #e4dbc9)', paddingLeft: '1.5rem' }}>
            <a className="top-link" href="/api/admin/export/csv?filter=validated">
              📊 CSV (validées)
            </a>
            <a className="top-link" href="/api/admin/export/csv?filter=all">
              📊 CSV (toutes)
            </a>
          </div>
        </div>
      </div>
      <AdminRecipeList recipes={recipes} />
    </main>
  );
}
