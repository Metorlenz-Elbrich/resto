// Constantes partagées entre composants client et code serveur.
// Ce fichier ne doit avoir AUCUNE dépendance Node (fs, path, better-sqlite3…)
// pour rester safe à importer depuis des composants "use client".
export const CATEGORIES = ['Entrée', 'Plat', 'Dessert', 'Autre'] as const;
export const DIFFICULTIES = ['Facile', 'Moyen', 'Difficile'] as const;
