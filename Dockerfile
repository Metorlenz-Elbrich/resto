FROM node:20-bookworm-slim

WORKDIR /app

# better-sqlite3 est un module natif : ces outils permettent de le compiler
# si aucun binaire précompilé n'est disponible pour la plateforme cible.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
