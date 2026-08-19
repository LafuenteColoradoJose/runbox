const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { runPlaybook } = require('./ansibleRunner');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // En desarrollo permitimos todo
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Obtener todos los playbooks
app.get('/api/playbooks', (req, res) => {
  const stmt = db.prepare('SELECT * FROM playbooks');
  res.json(stmt.all());
});

// Ejecutar playbook
app.post('/api/playbooks/run', async (req, res) => {
  const { id } = req.body;
  const stmt = db.prepare('SELECT * FROM playbooks WHERE id = ?');
  const playbook = stmt.get(id);
  
  if (!playbook) {
    return res.status(404).json({ error: 'Playbook no encontrado' });
  }

  const insertJob = db.prepare(`INSERT INTO jobs (playbook_id, status) VALUES (?, 'running')`);
  const result = insertJob.run(playbook.id);
  const jobId = result.lastInsertRowid;

  // Respondemos rápidamente al frontend y el proceso se queda en segundo plano
  res.json({ message: 'Playbook iniciado', job: { id: jobId } });
  
  try {
    const initMsg = `\r\n[Sistema] Iniciando ejecución de ${playbook.name} (Job #${jobId})...\r\n`;
    db.prepare('UPDATE jobs SET log_output = log_output || ? WHERE id = ?').run(initMsg, jobId);
    io.emit(`job-${jobId}-log`, { type: 'system', data: initMsg });
    await runPlaybook(playbook.path, io, jobId);
  } catch (err) {
    console.error('Error ejecutando playbook:', err);
  }
});

// Obtener un job
app.get('/api/jobs/:id', (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job no encontrado' });
  res.json(job);
});

// Sirve archivos estáticos (Para Docker / Producción)
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.use((req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Cliente Socket.io conectado:', socket.id);
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Backend server escuchando en el puerto ${PORT}`);
  });
}

module.exports = { app, server };
