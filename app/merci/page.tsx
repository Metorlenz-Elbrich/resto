import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <main className="page">
      <div className="card confirm">
        <div className="stamp">🍲</div>
        <h1>Merci pour ta recette !</h1>
        <p>
          Elle a bien été enregistrée et rejoindra le livre de cuisine de famille.
          N'hésite pas à en soumettre d'autres.
        </p>
        <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>
          Soumettre une autre recette
        </Link>
      </div>
    </main>
  );
}
