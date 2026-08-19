#!/bin/bash

echo "=== Deteniendo entorno completo de Runbox ==="

# 1. Frontend
echo "[1/3] Deteniendo procesos del Frontend..."
pkill -U $USER -f "ng serve" && echo "Frontend detenido." || echo "No había procesos del frontend corriendo."

# 2. Backend
echo "[2/3] Deteniendo procesos del Backend..."
pkill -U $USER -f "node backend/server.js" && echo "Backend detenido." || echo "No había procesos del backend corriendo."

# 3. Contenedor
echo "[3/3] Deteniendo contenedor Docker (runbox_test)..."
docker stop runbox_test 2>/dev/null || echo "El contenedor no estaba corriendo."

echo "=========================================================="
echo "✅ Todos los servicios han sido detenidos."
echo "=========================================================="
