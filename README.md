# 🍕 TurnoRotolo - Backend API

Backend API per l'applicazione mobile **TurnoRotolo**, un sistema per gestire equamente i turni di ritiro del cibo tra amici e coinquilini.

## 🚀 Quick Start

### Prerequisiti
- Node.js 20+
- Docker & Docker Compose
- MongoDB (incluso via Docker)

### Installazione

```bash
# 1. Clona repository
git clone <your-repo-url>
cd offro-ciotola-backend

# 2. Installa dipendenze
npm install

# 3. Copia .env e configura
cp .env.example .env

# 4. Avvia con Docker
docker-compose up --build
```

L'API sarà disponibile su `http://localhost:8080`


## 🔧 Variabili Ambiente

```env
# Server
NODE_ENV=development
PORT=8080

# Database
MONGODB_URI=mongodb://admin:password@localhost:27017/offrociotola?authSource=admin

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

## 🐳 Docker Commands

```bash
# Build e avvia
docker-compose up --build

# Avvia in background
docker-compose up -d

# Stop
docker-compose down

# Vedi logs
docker-compose logs -f api

# Reset completo (cancella DB)
docker-compose down -v

# Accedi al container
docker exec -it offro-api sh

# Accedi a MongoDB
docker exec -it offro-mongodb mongosh -u admin -p offro2024secure
```

---

## 🧪 Testing con cURL

```bash
# Health check
curl http://localhost:8080/

# API info
curl http://localhost:8080/api
  