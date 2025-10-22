#FROM node:24-alpine
FROM node:20-alpine

# Metadata
LABEL maintainer="Nicola S."
LABEL description="RotoloTurno Backend API"

# Crea directory app
WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze
# RUN npm ci --only=production
RUN npm install --omit=dev

# Copia codice sorgente
COPY . .

# Esponi porta
EXPOSE 8080

# # Health check
# HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:8080/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Avvia applicazione
CMD ["npm", "run", "start"]