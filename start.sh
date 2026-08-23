#!/bin/bash

echo "=== Arrancando entorno completo de Runbox ==="

# 1. Contenedor
echo "[1/3] Iniciando contenedor Docker (runbox_test)..."
docker start runbox_test

# 2. Backend
echo "[2/3] Iniciando el Backend local en segundo plano (con nodemon)..."
npx nodemon --watch backend backend/server.js &
BACKEND_PID=$!

# Esperar unos segundos a que el backend esté listo
sleep 2

# 3. Frontend
echo "[3/3] Iniciando el Frontend de Angular..."
npm run start --workspace=frontend &
FRONTEND_PID=$!

echo "=========================================================="
echo "✅ Todos los servicios están arrancando."
echo " 🐳 Producción (Docker): http://localhost:3001"
echo " ⚙️  Backend (Dev):       http://localhost:3000"
echo " 🎨 Frontend (Dev):      http://localhost:4200"
echo "=========================================================="
echo "Presiona Ctrl+C en cualquier momento para detener los servidores locales."

# Capturar Ctrl+C para apagar los procesos de forma limpia usando el script oficial
trap "echo -e '\nDeteniendo todo de forma segura...'; ./stop.sh; exit 0" SIGINT SIGTERM

# Mantener el script vivo esperando
wait
