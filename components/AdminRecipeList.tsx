'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Recipe } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';

export default function AdminRecipeList({ recipes }: { recipes: Recipe[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Toutes');
  const [onlyValidated, setOnlyValidated] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recipes.filter((r) => {
      if (category !== 'Toutes' && r.category !== category) return false;
      if (onlyValidated && !r.validated) return false;
      if (q) {
        const haystack = `${r.title} ${r.tags} ${r.submitter_name}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [recipes, search, category, onlyValidated]);

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Supprimer définitivement "${title}" ?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/recipes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('La suppression a échoué.');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="admin-toolbar">
        <input
          type="text"
          placeholder="Rechercher un titre, un tag, un nom…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="Toutes">Toutes les catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="checkbox-row">
          <input
            id="onlyValidated"
            type="checkbox"
            checked={onlyValidated}
            onChange={(e) => setOnlyValidated(e.target.checked)}
          />
          <label htmlFor="onlyValidated" style={{ margin: 0 }}>
            Validées uniquement
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">Aucune recette ne correspond à ces filtres.</div>
      ) : (
        <div className="recipe-grid">
          {filtered.map((recipe) => (
            <div className="recipe-tile" key={recipe.id}>
              {recipe.photo_filename ? (
                <img className="thumb" src={`/api/uploads/${recipe.photo_filename}`} alt={recipe.title} />
              ) : (
                <div className="thumb-placeholder">🍽️</div>
              )}
              <div className="body">
                <h3>{recipe.title}</h3>
                <div className="tag-row">
                  <span className="pill">{recipe.category}</span>
                  {recipe.validated ? <span className="pill validated">Validée</span> : null}
                </div>
                <div className="meta">
                  {recipe.submitter_name && <>Par {recipe.submitter_name} · </>}
                  {new Date(recipe.created_at).toLocaleDateString('fr-FR')}
                </div>
                <div className="actions">
                  <a href={`/admin/recipes/${recipe.id}`} className="btn btn-secondary btn-small">
                    Modifier
                  </a>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleDelete(recipe.id, recipe.title)}
                    disabled={deletingId === recipe.id}
                  >
                    {deletingId === recipe.id ? '…' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
