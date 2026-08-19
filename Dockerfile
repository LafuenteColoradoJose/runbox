# -- Etapa 1: Construir Angular --
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm install
COPY frontend/ ./frontend/
RUN npm run build --workspace=frontend

# -- Etapa 2: Backend + Entorno de Ejecución --
FROM node:22-slim
WORKDIR /app

# Instalar Ansible y dependencias del sistema operativo
RUN apt-get update && \
    apt-get install -y ansible sshpass iputils-ping && \
    rm -rf /var/lib/apt/lists/*

# Configuración del backend Node
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copiar el código del backend y la build de Angular
COPY backend/ ./backend/
COPY --from=builder /app/frontend/dist/frontend/browser ./backend/public

# Exponer el puerto de Express
EXPOSE 3000

# Arrancar el servidor Node
CMD ["node", "backend/server.js"]