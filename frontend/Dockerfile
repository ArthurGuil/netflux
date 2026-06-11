# ============================================
# Stage de base
# ============================================
FROM node:22-alpine AS base

WORKDIR /app

# ============================================
# Stage développement
# ============================================
FROM base AS dev

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ============================================
# Stage de build
# ============================================
FROM base AS build

# Copier les fichiers de dépendances
COPY frontend/package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY frontend/ .

# Argument de build pour l'API URL (pour la prod)
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build de production
RUN npm run build

# ============================================
# Stage production avec Nginx
# ============================================
FROM nginx:alpine AS prod

# Copier les fichiers buildés
COPY --from=build /app/dist /usr/share/nginx/html

# Configuration Nginx pour Vue Router (mode history)
COPY docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]