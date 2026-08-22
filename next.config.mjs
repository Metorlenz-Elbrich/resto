/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 et pdfkit (+ sa dépendance fontkit) sont des modules
  // natifs / Node — on les garde hors du bundle serveur pour éviter que
  // Next essaie de les webpack-ifier (Next 14.2 : clé encore expérimentale).
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'pdfkit', 'fontkit'],
  },
};

export default nextConfig;
