# Stage de build
FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Stage production avec nginx
FROM nginx:alpine AS prod

# Copie du build
COPY --from=build /app/dist /usr/share/nginx/html

# La config nginx sera montée via docker-compose
# Pas de COPY de nginx.conf ici

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Stage développement
FROM node:20-alpine AS dev

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]