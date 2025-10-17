# 🍕 ofFRO CIOtola - Backend API

Backend API per l'applicazione mobile **ofFRO CIOtola**, un sistema per gestire equamente i turni di ritiro del cibo tra amici e coinquilini.

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

---

## 📁 Struttura Progetto

```
backend/
├── src/
│   ├── config/          # Configurazioni (DB, etc.)
│   ├── controllers/     # Logica business
│   ├── models/          # Schema MongoDB
│   ├── routes/          # Definizione endpoints
│   ├── middleware/      # Auth, validazione, errors
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── .env                 # Variabili ambiente
├── docker-compose.yml   # Setup Docker
├── dockerfile           # Container Node.js
└── package.json         # Dipendenze
```

---

## 🔑 API Endpoints

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Registra nuovo utente | ❌ |
| POST | `/login` | Login utente | ❌ |
| GET | `/me` | Profilo utente corrente | ✅ |
| PUT | `/me` | Aggiorna profilo | ✅ |
| PUT | `/password` | Cambia password | ✅ |

### 👥 Groups (`/api/groups`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crea gruppo | ✅ |
| GET | `/` | Lista miei gruppi | ✅ |
| GET | `/:id` | Dettagli gruppo | ✅ |
| PUT | `/:id` | Aggiorna gruppo | ✅ Admin |
| DELETE | `/:id` | Elimina gruppo | ✅ Admin |
| POST | `/join/:code` | Unisciti con codice | ✅ |
| POST | `/:id/members` | Aggiungi membro | ✅ Admin |
| DELETE | `/:id/members/:userId` | Rimuovi membro | ✅ Admin |
| POST | `/:id/leave` | Esci dal gruppo | ✅ |
| PUT | `/:id/weights` | Aggiorna pesi | ✅ Admin |
| POST | `/:id/reset-scores` | Reset punteggi | ✅ Admin |
| GET | `/:id/next-person` | Prossimo turno | ✅ |

### 📦 Orders (`/api/orders`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crea ordine | ✅ |
| GET | `/my` | Miei ordini | ✅ |
| GET | `/group/:groupId` | Ordini gruppo | ✅ |
| GET | `/group/:groupId/stats` | Statistiche gruppo | ✅ |
| GET | `/:id` | Dettagli ordine | ✅ |
| DELETE | `/:id` | Elimina ordine | ✅ Admin |

---

## 📝 Esempi Request

### Registrazione

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mario Rossi",
    "email": "mario@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "🎉 Registrazione completata con successo!",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Mario Rossi",
      "email": "mario@example.com"
    }
  }
}
```

### Crea Gruppo

```bash
curl -X POST http://localhost:8080/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Cena Coinquilini"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "🎉 Gruppo creato con successo!",
  "data": {
    "group": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Cena Coinquilini",
      "inviteCode": "ABC123",
      "members": [...],
      "weights": {
        "distance": 1,
        "wait": 0.8,
        "money": 0.6
      }
    }
  }
}
```

### Crea Ordine

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "groupId": "507f1f77bcf86cd799439011",
    "restaurant": "Pizza Express",
    "distance": "medium",
    "wait": "high",
    "money": "medium"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "🎉 Ordine creato! Mario andrà a ritirare (+12 punti)",
  "data": {
    "order": {...},
    "nextPerson": {
      "name": "Mario",
      "newScore": 12
    }
  }
}
```

---

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
```

---

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

# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## 📊 Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String,
  groups: [ObjectId],
  createdAt: Date
}
```

### Groups Collection
```javascript
{
  name: String,
  adminId: ObjectId,
  inviteCode: String (6 chars, unique),
  members: [{
    userId: ObjectId,
    name: String,
    score: Number,
    joinedAt: Date
  }],
  weights: {
    distance: Number,
    wait: Number,
    money: Number
  },
  isActive: Boolean,
  