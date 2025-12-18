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
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Gzip \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
    \
    # SPA routing \
    location / { \
    try_files $uri $uri/ /index.html; \
    } \
    \
    # Cache pour les assets \
    location /assets/ { \
    expires 1y; \
    add_header Cache-Control "public, immutable"; \
    } \
    \
    # Sécurité \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]