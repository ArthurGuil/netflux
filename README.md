# Netflux

Application web de gestion et de navigation dans un catalogue de films et séries. Elle propose un système d'authentification JWT, la gestion des favoris, la catégorisation par genres et une interface d'administration complète.

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Backend | Symfony 7.3 · PHP 8.2+ · API Platform 4.2 |
| Base de données | MySQL 8.0 · Doctrine ORM |
| Authentification | JWT (Lexik) · Refresh Token (Gesdinet) |
| Upload | VichUploaderBundle |
| Frontend | Vue 3 (Composition API) · Vite · Pinia · Vue Router 4 |
| Style | Tailwind CSS 4 |
| HTTP | Axios (avec refresh automatique du token) |
| Conteneurisation | Docker · Docker Compose · Nginx · PHP-FPM |
| Tests | PHPUnit · Vitest · Playwright |

---

## Prérequis

- [Docker](https://www.docker.com/) & Docker Compose

---

## Installation rapide

### 1. Cloner le dépôt

```bash
git clone <url-du-repo> netflux
cd netflux
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Principales variables à adapter :

```dotenv
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=netflux
MYSQL_USER=netflux_user
MYSQL_PASSWORD=netflux_password

APP_SECRET=<votre_secret>
CORS_ALLOW_ORIGIN=http://localhost:5173

JWT_PASSPHRASE=<votre_passphrase>

VITE_API_BASE_URL=http://localhost:8080
BACKEND_PORT=8080
FRONTEND_PORT=5173
```

### 3. Démarrer l'environnement de développement

```bash
docker compose -f docker-compose.dev.yaml build
docker compose -f docker-compose.dev.yaml up -d
docker compose -f docker-compose.dev.yaml exec backend php bin/console doctrine:migrations:migrate
docker compose -f docker-compose.dev.yaml exec backend php bin/console doctrine:fixtures:load  # optionnel
```

L'application est disponible sur :

| Service | URL |
|---------|-----|
| Frontend Vue.js | http://localhost:5173 |
| API Symfony | http://localhost:8080/api |
| Documentation API (Swagger) | http://localhost:8080/api/docs |

---

## Commandes Docker Compose

### Développement

```bash
docker compose -f docker-compose.dev.yaml build         # Construire les images dev
docker compose -f docker-compose.dev.yaml up -d         # Démarrer l'environnement dev
docker compose -f docker-compose.dev.yaml down           # Arrêter l'environnement dev
docker compose -f docker-compose.dev.yaml down -v        # Arrêter et supprimer les volumes
```

### Production

```bash
docker compose build        # Construire les images prod
docker compose up -d        # Démarrer l'environnement prod
docker compose down          # Arrêter l'environnement prod
```

### Base de données

```bash
docker compose -f docker-compose.dev.yaml exec backend php bin/console doctrine:migrations:migrate
docker compose -f docker-compose.dev.yaml exec backend php bin/console doctrine:fixtures:load
```

### Shells

```bash
docker compose -f docker-compose.dev.yaml exec backend sh             # Shell backend
docker compose -f docker-compose.dev.yaml exec frontend sh            # Shell frontend
docker compose -f docker-compose.dev.yaml exec mysql mysql -unetflux -pnetflux netflux  # CLI MySQL
```

### Tests

```bash
docker compose -f docker-compose.test.yaml run --rm backend php bin/phpunit          # PHPUnit
docker compose -f docker-compose.dev.yaml exec frontend npm run test                  # Vitest
docker compose -f docker-compose.test.yaml run --rm playwright npx playwright test    # Playwright
```

### Logs

```bash
docker compose -f docker-compose.dev.yaml logs -f    # Suivre les logs de tous les services
```

---

## Architecture Docker

```
docker-compose.yaml       ← Production
docker-compose.dev.yaml   ← Développement (hot-reload, Xdebug)
docker-compose.test.yaml  ← Tests (PHPUnit + Playwright)
```

**Services :**

| Service | Rôle | Port exposé |
|---------|------|-------------|
| `mysql` | Base de données MySQL 8.0 | 3306 |
| `backend` | API Symfony (PHP-FPM 8.3) | — |
| `nginx_backend` | Reverse proxy API | 8080 |
| `frontend` | App Vue.js servie par Nginx | 5173 |

---

## Structure du projet

```
netflux/
├── backend/                        # API Symfony
│   ├── src/
│   │   ├── Entity/                 # Entités ORM (User, Movie, Genre, RefreshToken)
│   │   ├── Controller/             # Contrôleurs (RegisterController)
│   │   ├── Repository/             # Repositories Doctrine
│   │   ├── Serializer/             # Normaliseurs personnalisés
│   │   ├── EventSubscriber/        # Listeners JWT
│   │   └── DataFixtures/           # Données de test
│   ├── migrations/                 # Migrations de base de données
│   ├── config/
│   │   └── jwt/                    # Clés JWT (private.pem / public.pem)
│   └── public/uploads/             # Fichiers uploadés (posters, trailers)
├── frontend/                       # App Vue 3
│   ├── src/
│   │   ├── views/                  # Pages (Login, Movies, Genres, Users…)
│   │   ├── components/             # Composants réutilisables (NavBar…)
│   │   ├── composables/            # Logique métier (useMovies, useGenres…)
│   │   ├── stores/                 # État global Pinia (auth.js)
│   │   ├── services/               # Client Axios (api.js)
│   │   └── router/                 # Configuration des routes
│   └── tests/                      # Tests Vitest & Playwright
├── docker/
│   └── nginx/                      # Configurations Nginx
├── docker-compose.yaml
├── docker-compose.dev.yaml
└── docker-compose.test.yaml
```

---

## Modèle de données

### User
- `email` · `password` (hashé) · `roles` (`ROLE_USER`, `ROLE_ADMIN`)
- Relation M2M avec `Movie` (favoris)

### Movie
- `title` · `description` · `duration` · `releaseDate`
- `type` : `MOVIE` ou `SERIES`
- `poster` (upload fichier) · `trailer` (URL)
- Relation M2M avec `Genre` et `User`

### Genre
- `name` (unique)
- Relation M2M inverse avec `Movie`

---

## API Endpoints

### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/register` | Inscription |
| `POST` | `/api/login_check` | Connexion → `token` + `refresh_token` |
| `POST` | `/api/token/refresh` | Rafraîchir le JWT |

### Films

| Méthode | Endpoint | Accès |
|---------|----------|-------|
| `GET` | `/api/movies` | Authentifié |
| `GET` | `/api/movies/{id}` | Authentifié |
| `POST` | `/api/movies` | Admin (multipart/form-data) |
| `PUT` | `/api/movies/{id}` | Admin |
| `PATCH` | `/api/movies/{id}` | Admin |
| `DELETE` | `/api/movies/{id}` | Admin |

### Genres

| Méthode | Endpoint | Accès |
|---------|----------|-------|
| `GET` | `/api/genres` | Authentifié |
| `POST` | `/api/genres` | Admin |
| `PATCH` | `/api/genres/{id}` | Admin |
| `DELETE` | `/api/genres/{id}` | Admin |

### Utilisateurs

| Méthode | Endpoint | Accès |
|---------|----------|-------|
| `GET` | `/api/users` | Admin |
| `GET` | `/api/users/{id}` | Admin ou soi-même |
| `PATCH` | `/api/users/{id}` | Admin |
| `PATCH` | `/api/users/{id}/favorites` | Utilisateur concerné |
| `DELETE` | `/api/users/{id}` | Admin |

La documentation complète (OpenAPI/Swagger) est disponible sur `/api/docs`.

---

## Routes frontend

| Route | Vue | Accès |
|-------|-----|-------|
| `/` | Accueil | Public |
| `/login` | Connexion | Public |
| `/register` | Inscription | Public |
| `/movies` | Catalogue | Authentifié |
| `/movies/:id` | Détail film | Authentifié |
| `/movies/create` | Créer un film | Admin |
| `/movies/:id/edit` | Modifier un film | Admin |
| `/favorites` | Mes favoris | Authentifié |
| `/genres` | Liste des genres | Authentifié |
| `/genres/create` | Créer un genre | Admin |
| `/genres/:id/edit` | Modifier un genre | Admin |
| `/users` | Gestion utilisateurs | Admin |

---

## Données de test (fixtures)

Après avoir chargé les fixtures, les comptes suivants sont disponibles :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `admin@example.com` | `Admin1234!` | ROLE_ADMIN |
| `user@example.com` | `User1234!` | ROLE_USER |

Genres chargés : Drame · Action · Horreur · Fantaisie · Comédie

---

## Sécurité

- Mots de passe soumis à une politique stricte : 8 caractères minimum, majuscule, minuscule, chiffre et caractère spécial.
- JWT avec expiration courte et refresh token pour le renouvellement silencieux.
- CORS configuré via `NelmioCorsBundle`.
- Accès aux ressources admin protégé par `ROLE_ADMIN` au niveau de l'API.
