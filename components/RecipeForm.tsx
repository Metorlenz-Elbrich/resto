'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, DIFFICULTIES } from '@/lib/constants';

export type RecipeFormValues = {
  id?: number;
  title: string;
  category: string;
  tags: string;
  prep_time: string;
  difficulty: string;
  ingredients: string[];
  steps: string[];
  submitter_name: string;
  photo_filename: string | null;
  validated: boolean;
};

const EMPTY: RecipeFormValues = {
  title: '',
  category: 'Plat',
  tags: '',
  prep_time: '',
  difficulty: '',
  ingredients: [''],
  steps: [''],
  submitter_name: '',
  photo_filename: null,
  validated: false,
};

type Props = {
  mode: 'create' | 'edit';
  initial?: RecipeFormValues;
};

export default function RecipeForm({ mode, initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<RecipeFormValues>(initial ?? EMPTY);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof RecipeFormValues>(key: K, value: RecipeFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateListItem(list: 'ingredients' | 'steps', index: number, value: string) {
    setValues((prev) => {
      const next = [...prev[list]];
      next[index] = value;
      return { ...prev, [list]: next };
    });
  }

  function addListItem(list: 'ingredients' | 'steps') {
    setValues((prev) => ({ ...prev, [list]: [...prev[list], ''] }));
  }

  function removeListItem(list: 'ingredients' | 'steps', index: number) {
    setValues((prev) => {
      const next = prev[list].filter((_, i) => i !== index);
      return { ...prev, [list]: next.length ? next : [''] };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const title = values.title.trim();
    const ingredients = values.ingredients.map((i) => i.trim()).filter(Boolean);
    const steps = values.steps.map((s) => s.trim()).filter(Boolean);

    if (!title) {
      setError('Le titre de la recette est obligatoire.');
      return;
    }
    if (ingredients.length === 0) {
      setError('Ajoute au moins un ingrédient.');
      return;
    }
    if (steps.length === 0) {
      setError('Ajoute au moins une étape de préparation.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('title', title);
      formData.set('category', values.category);
      formData.set('tags', values.tags.trim());
      formData.set('prep_time', values.prep_time.trim());
      formData.set('difficulty', values.difficulty);
      formData.set('ingredients', JSON.stringify(ingredients));
      formData.set('steps', JSON.stringify(steps));
      formData.set('submitter_name', values.submitter_name.trim());
      formData.set('validated', values.validated ? '1' : '0');
      if (photoFile) formData.set('photo', photoFile);
      if (removePhoto) formData.set('remove_photo', '1');

      const url = mode === 'create' ? '/api/recipes' : `/api/admin/recipes/${values.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, { method, body: formData });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Une erreur est survenue, réessaie.");
      }

      if (mode === 'create') {
        router.push('/merci');
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label htmlFor="title">Titre de la recette *</label>
        <input
          id="title"
          type="text"
          value={values.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Ex. Tarte aux pommes de grand-mère"
          required
        />
      </div>

      <div className="field-row cols-3">
        <div className="field">
          <label htmlFor="category">Catégorie</label>
          <select
            id="category"
            value={values.category}
            onChange={(e) => updateField('category', e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="prep_time">
            Temps de préparation <span className="hint">(facultatif)</span>
          </label>
          <input
            id="prep_time"
            type="text"
            value={values.prep_time}
            onChange={(e) => updateField('prep_time', e.target.value)}
            placeholder="Ex. 45 min"
          />
        </div>
        <div className="field">
          <label htmlFor="difficulty">
            Difficulté <span className="hint">(facultatif)</span>
          </label>
          <select
            id="difficulty"
            value={values.difficulty}
            onChange={(e) => updateField('difficulty', e.target.value)}
          >
            <option value="">—</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="tags">
          Tags libres <span className="hint">(origine, saison, occasion… séparés par des virgules)</span>
        </label>
        <input
          id="tags"
          type="text"
          value={values.tags}
          onChange={(e) => updateField('tags', e.target.value)}
          placeholder="Ex. Italie, été, sans gluten"
        />
      </div>

      <div className="field">
        <label>Ingrédients *</label>
        {values.ingredients.map((ingredient, index) => (
          <div className="dynamic-row" key={index}>
            <span className="index-badge">{index + 1}</span>
            <input
              type="text"
              value={ingredient}
              onChange={(e) => updateListItem('ingredients', index, e.target.value)}
              placeholder="Ex. 200 g de farine"
            />
            <button
              type="button"
              className="icon-btn"
              aria-label="Retirer cet ingrédient"
              onClick={() => removeListItem('ingredients', index)}
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="add-line-btn" onClick={() => addListItem('ingredients')}>
          + Ajouter un ingrédient
        </button>
      </div>

      <div className="field">
        <label>Étapes de préparation *</label>
        {values.steps.map((step, index) => (
          <div className="dynamic-row" key={index}>
            <span className="index-badge">{index + 1}</span>
            <textarea
              value={step}
              onChange={(e) => updateListItem('steps', index, e.target.value)}
              placeholder="Décris cette étape…"
              rows={2}
            />
            <button
              type="button"
              className="icon-btn"
              aria-label="Retirer cette étape"
              onClick={() => removeListItem('steps', index)}
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="add-line-btn" onClick={() => addListItem('steps')}>
          + Ajouter une étape
        </button>
      </div>

      <div className="field-row cols-2">
        <div className="field">
          <label htmlFor="submitter_name">
            Ton nom <span className="hint">(facultatif)</span>
          </label>
          <input
            id="submitter_name"
            type="text"
            value={values.submitter_name}
            onChange={(e) => updateField('submitter_name', e.target.value)}
            placeholder="Qui partage cette recette ?"
          />
        </div>
        <div className="field">
          <label htmlFor="photo">
            Photo du plat <span className="hint">(facultative)</span>
          </label>
          {values.photo_filename && !removePhoto && (
            <div className="current-photo">
              <img src={`/api/uploads/${values.photo_filename}`} alt="Photo actuelle" />
              <button type="button" className="btn btn-secondary btn-small" onClick={() => setRemovePhoto(true)}>
                Retirer la photo
              </button>
            </div>
          )}
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={(e) => {
              setPhotoFile(e.target.files?.[0] ?? null);
              setRemovePhoto(false);
            }}
          />
        </div>
      </div>

      {mode === 'edit' && (
        <div className="field">
          <div className="checkbox-row">
            <input
              id="validated"
              type="checkbox"
              checked={values.validated}
              onChange={(e) => updateField('validated', e.target.checked)}
            />
            <label htmlFor="validated" style={{ margin: 0 }}>
              Recette validée pour le livre
            </label>
          </div>
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting
          ? 'Envoi en cours…'
          : mode === 'create'
            ? 'Envoyer ma recette 🍽️'
            : 'Enregistrer les modifications'}
      </button>
    </form>
  );
}
