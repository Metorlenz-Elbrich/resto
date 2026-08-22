import RecipeForm from '@/components/RecipeForm';

export default function SubmitPage() {
  return (
    <main className="page">
      <div className="hero">
        <div className="hero-eyebrow">Livre de recettes de famille</div>
        <h1>Partage ta recette</h1>
        <p>
          Remplis le formulaire ci-dessous avec tes ingrédients et ta méthode de préparation.
          Toutes les recettes seront compilées dans notre futur livre de cuisine.
        </p>
      </div>
      <div className="card">
        <RecipeForm mode="create" />
      </div>
    </main>
  );
}
