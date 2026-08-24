const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { runPlaybook } = require('./ansibleRunner');
const authMiddleware = require('./middleware/auth');
const requireAdmin = require('./middleware/requireAdmin');

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

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'runbox_secret_key',
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// --- USERS API (Admin Only) ---

// Obtener todos los usuarios con sus organizaciones asignadas
app.get('/api/users', authMiddleware, requireAdmin, (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, role FROM users').all();
    const userOrgsStmt = db.prepare(`
      SELECT o.id, o.name 
      FROM organizations o
      JOIN user_organizations uo ON o.id = uo.organization_id
      WHERE uo.user_id = ?
    `);
    
    users.forEach(user => {
      user.organizations = userOrgsStmt.all(user.id);
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Crear usuario
app.post('/api/users', authMiddleware, requireAdmin, (req, res) => {
  const { username, password, role, organizations } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'El nombre de usuario y contraseña son requeridos' });
  }
  
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    
    db.prepare('BEGIN').run();
    const insertStmt = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
    const result = insertStmt.run(username, hash, role || 'user');
    const userId = result.lastInsertRowid;
    
    if (organizations && Array.isArray(organizations)) {
      const insertOrg = db.prepare('INSERT INTO user_organizations (user_id, organization_id) VALUES (?, ?)');
      for (const orgId of organizations) {
        insertOrg.run(userId, orgId);
      }
    }
    db.prepare('COMMIT').run();
    
    res.status(201).json({ id: userId, username, role });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Actualizar usuario
app.put('/api/users/:id', authMiddleware, requireAdmin, (req, res) => {
  const { password, role, organizations } = req.body;
  const userId = req.params.id;
  
  try {
    db.prepare('BEGIN').run();
    
    if (password) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      db.prepare('UPDATE users SET password = ?, role = ? WHERE id = ?').run(hash, role, userId);
    } else {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
    }
    
    if (organizations && Array.isArray(organizations)) {
      db.prepare('DELETE FROM user_organizations WHERE user_id = ?').run(userId);
      const insertOrg = db.prepare('INSERT INTO user_organizations (user_id, organization_id) VALUES (?, ?)');
      for (const orgId of organizations) {
        insertOrg.run(userId, orgId);
      }
    }
    
    db.prepare('COMMIT').run();
    res.json({ success: true });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Eliminar usuario
app.delete('/api/users/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Obtener todos los playbooks
app.get('/api/playbooks', authMiddleware, (req, res) => {
  let playbooks;
  if (req.user.role === 'admin') {
    playbooks = db.prepare(`
      SELECT p.*, o.name as organization_name 
      FROM playbooks p 
      LEFT JOIN organizations o ON p.organization_id = o.id
    `).all();
  } else {
    playbooks = db.prepare(`
      SELECT p.*, o.name as organization_name 
      FROM playbooks p
      LEFT JOIN organizations o ON p.organization_id = o.id
      WHERE p.organization_id IS NULL OR p.organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = ?
      )
    `).all(req.user.id);
  }
  res.json(playbooks);
});

app.post('/api/playbooks', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { name, path, organization_id } = req.body;
    const stmt = db.prepare('INSERT INTO playbooks (name, path, organization_id) VALUES (?, ?, ?)');
    const result = stmt.run(name, path, organization_id || null);
    res.json({ id: result.lastInsertRowid, name, path, organization_id: organization_id || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/playbooks/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { name, path, organization_id } = req.body;
    db.prepare('UPDATE playbooks SET name = ?, path = ?, organization_id = ? WHERE id = ?').run(
      name, path, organization_id || null, req.params.id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/playbooks/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM playbooks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ejecutar playbook
app.post('/api/playbooks/run', authMiddleware, async (req, res) => {
  const { id, inventoryId } = req.body;
  const stmt = db.prepare('SELECT * FROM playbooks WHERE id = ?');
  const playbook = stmt.get(id);
  
  if (!playbook) {
    return res.status(404).json({ error: 'Playbook no encontrado' });
  }

  // Comprobar autorización del playbook
  if (req.user.role !== 'admin' && playbook.organization_id !== null) {
    const hasAccess = db.prepare(`SELECT 1 FROM user_organizations WHERE user_id = ? AND organization_id = ?`).get(req.user.id, playbook.organization_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes acceso a este playbook' });
    }
  }

  // Comprobar autorización del inventario si se ha proporcionado
  if (inventoryId) {
    const inventory = db.prepare('SELECT * FROM inventories WHERE id = ?').get(inventoryId);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventario no encontrado' });
    }
    if (req.user.role !== 'admin' && inventory.organization_id !== null) {
      const hasAccess = db.prepare(`SELECT 1 FROM user_organizations WHERE user_id = ? AND organization_id = ?`).get(req.user.id, inventory.organization_id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'No tienes acceso a este inventario' });
      }
    }
  }

  const insertJob = db.prepare(`INSERT INTO jobs (playbook_id, user_id, status) VALUES (?, ?, 'running')`);
  const result = insertJob.run(playbook.id, req.user.id);
  const jobId = result.lastInsertRowid;

  // Respondemos rápidamente al frontend y el proceso se queda en segundo plano
  res.json({ message: 'Playbook iniciado', job: { id: jobId } });
  
  try {
    const initMsg = `\r\n[Sistema] Iniciando ejecución de ${playbook.name} (Job #${jobId})...\r\n`;
    db.prepare('UPDATE jobs SET log_output = log_output || ? WHERE id = ?').run(initMsg, jobId);
    io.emit(`job-${jobId}-log`, { type: 'system', data: initMsg });
    await runPlaybook(playbook.path, io, jobId, inventoryId);
  } catch (err) {
    console.error('Error ejecutando playbook:', err);
  }
});

// Obtener un job
app.get('/api/jobs/:id', authMiddleware, (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job no encontrado' });
  
  if (req.user.role !== 'admin' && job.user_id !== req.user.id) {
    return res.status(403).json({ error: 'No tienes acceso a este resultado' });
  }

  res.json(job);
});

// Obtener estadísticas del dashboard
app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
  try {
    let stats = {};
    if (req.user.role === 'admin') {
      stats.totalPlaybooks = db.prepare('SELECT count(*) as count FROM playbooks').get().count;
      stats.totalJobs = db.prepare('SELECT count(*) as count FROM jobs').get().count;
      stats.failedJobs = db.prepare("SELECT count(*) as count FROM jobs WHERE status = 'failed'").get().count;
      stats.totalOrganizations = db.prepare('SELECT count(*) as count FROM organizations').get().count;
      stats.totalInventories = db.prepare('SELECT count(*) as count FROM inventories').get().count;
      stats.totalGroups = db.prepare('SELECT count(*) as count FROM groups').get().count;
      stats.totalHosts = db.prepare('SELECT count(*) as count FROM hosts').get().count;
      stats.recentJobs = db.prepare(`
        SELECT jobs.id, jobs.status, jobs.started_at, playbooks.name as playbook_name 
        FROM jobs 
        JOIN playbooks ON jobs.playbook_id = playbooks.id 
        ORDER BY jobs.started_at DESC 
        LIMIT 5
      `).all();
    } else {
      const uId = req.user.id;
      stats.totalPlaybooks = db.prepare(`SELECT count(*) as count FROM playbooks WHERE organization_id IS NULL OR organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = ?)`).get(uId).count;
      stats.totalJobs = db.prepare(`SELECT count(*) as count FROM jobs WHERE user_id = ?`).get(uId).count;
      stats.failedJobs = db.prepare(`SELECT count(*) as count FROM jobs WHERE status = 'failed' AND user_id = ?`).get(uId).count;
      stats.totalOrganizations = db.prepare(`SELECT count(*) as count FROM user_organizations WHERE user_id = ?`).get(uId).count;
      stats.totalInventories = db.prepare(`SELECT count(*) as count FROM inventories WHERE organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = ?)`).get(uId).count;
      stats.totalGroups = db.prepare(`SELECT count(g.id) as count FROM groups g JOIN inventories i ON g.inventory_id = i.id WHERE i.organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = ?)`).get(uId).count;
      stats.totalHosts = db.prepare(`SELECT count(h.id) as count FROM hosts h JOIN inventories i ON h.inventory_id = i.id WHERE i.organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = ?)`).get(uId).count;
      stats.recentJobs = db.prepare(`
        SELECT jobs.id, jobs.status, jobs.started_at, playbooks.name as playbook_name 
        FROM jobs 
        JOIN playbooks ON jobs.playbook_id = playbooks.id 
        WHERE jobs.user_id = ?
        ORDER BY jobs.started_at DESC 
        LIMIT 5
      `).all(uId);
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener estadísticas' });
  }
});

// --- INVENTORY API ---

// Obtener todos los inventarios (con la info de su organización)
app.get('/api/inventories', authMiddleware, (req, res) => {
  try {
    let inventories;
    if (req.user.role === 'admin') {
      inventories = db.prepare(`
        SELECT i.id, i.name, o.name as organization_name 
        FROM inventories i
        LEFT JOIN organizations o ON i.organization_id = o.id
      `).all();
    } else {
      inventories = db.prepare(`
        SELECT i.id, i.name, o.name as organization_name 
        FROM inventories i
        LEFT JOIN organizations o ON i.organization_id = o.id
        JOIN user_organizations uo ON i.organization_id = uo.organization_id
        WHERE uo.user_id = ?
      `).all(req.user.id);
    }
    res.json(inventories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function checkInventoryAccess(req, res, next) {
  if (req.user.role === 'admin') return next();
  const inventoryId = req.params.id;
  const hasAccess = db.prepare(`
    SELECT 1 FROM inventories i
    JOIN user_organizations uo ON i.organization_id = uo.organization_id
    WHERE i.id = ? AND uo.user_id = ?
  `).get(inventoryId, req.user.id);
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Acceso denegado a este inventario' });
  }
  next();
}

app.get('/api/inventories/:id', authMiddleware, checkInventoryAccess, (req, res) => {
  try {
    const inventory = db.prepare(`
      SELECT i.id, i.name, o.name as organization_name 
      FROM inventories i
      LEFT JOIN organizations o ON i.organization_id = o.id
      WHERE i.id = ?
    `).get(req.params.id);
    
    if (!inventory) return res.status(404).json({ error: 'Inventario no encontrado' });
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener los hosts de un inventario con sus grupos
app.get('/api/inventories/:id/hosts', authMiddleware, checkInventoryAccess, (req, res) => {
  try {
    const inventoryId = req.params.id;
    // Seleccionar hosts
    const hosts = db.prepare('SELECT * FROM hosts WHERE inventory_id = ?').all(inventoryId);
    
    // Obtener grupos para cada host
    const getGroupsForHost = db.prepare(`
      SELECT g.id, g.name 
      FROM groups g
      JOIN host_groups hg ON g.id = hg.group_id
      WHERE hg.host_id = ?
    `);

    hosts.forEach(host => {
      host.groups = getGroupsForHost.all(host.id);
      try {
        host.variables = JSON.parse(host.variables);
      } catch (e) {
        // Ignorar error de parseo si está mal formado
      }
    });

    res.json(hosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener la topología del inventario (Formato Grafo para ECharts)
app.get('/api/inventories/:id/topology', authMiddleware, checkInventoryAccess, (req, res) => {
  try {
    const inventoryId = req.params.id;
    const inventory = db.prepare('SELECT * FROM inventories WHERE id = ?').get(inventoryId);
    if (!inventory) return res.status(404).json({ error: 'Inventario no encontrado' });

    const groups = db.prepare('SELECT * FROM groups WHERE inventory_id = ?').all(inventoryId);
    const hosts = db.prepare('SELECT * FROM hosts WHERE inventory_id = ?').all(inventoryId);
    const hostGroups = db.prepare(`
      SELECT hg.host_id, hg.group_id 
      FROM host_groups hg 
      JOIN groups g ON hg.group_id = g.id 
      WHERE g.inventory_id = ?
    `).all(inventoryId);

    const nodes = [];
    const links = [];
    
    let invCategory = 0;
    
    // Si el inventario pertenece a una organización, la agregamos como nodo raíz
    if (inventory.organization_id) {
      const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(inventory.organization_id);
      if (org) {
        nodes.push({
          id: `org-${org.id}`,
          name: org.name,
          category: 0,
          symbolSize: 60
        });
        invCategory = 1;
        links.push({
          source: `org-${org.id}`,
          target: `inv-${inventory.id}`
        });
      }
    }

    // Nodo central/hijo: Inventario
    nodes.push({
      id: `inv-${inventory.id}`,
      name: inventory.name,
      category: invCategory,
      symbolSize: 50
    });

    // Nodos de Grupos
    groups.forEach(g => {
      nodes.push({
        id: `grp-${g.id}`,
        name: g.name,
        category: invCategory + 1,
        symbolSize: 40
      });
      links.push({
        source: `inv-${inventory.id}`,
        target: `grp-${g.id}`
      });
    });

    // Nodos de Hosts
    hosts.forEach(h => {
      nodes.push({
        id: `hst-${h.id}`,
        name: h.name,
        category: invCategory + 2,
        symbolSize: 30
      });
      
      // Si el host no tiene grupos asociados, lo colgamos directamente del inventario
      const isLinkedToGroup = hostGroups.some(hg => hg.host_id === h.id);
      if (!isLinkedToGroup) {
        links.push({
          source: `inv-${inventory.id}`,
          target: `hst-${h.id}`
        });
      }
    });

    // Enlaces de Hosts a Grupos
    hostGroups.forEach(hg => {
      links.push({
        source: `grp-${hg.group_id}`,
        target: `hst-${hg.host_id}`
      });
    });

    const categories = [{ name: 'Organización' }, { name: 'Inventario' }, { name: 'Grupos' }, { name: 'Hosts' }];

    res.json({ nodes, links, categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ORGANIZATIONS API ---
app.get('/api/organizations', authMiddleware, (req, res) => {
  try {
    let orgs;
    if (req.user.role === 'admin') {
      orgs = db.prepare('SELECT * FROM organizations').all();
    } else {
      orgs = db.prepare(`
        SELECT o.* FROM organizations o 
        JOIN user_organizations uo ON o.id = uo.organization_id 
        WHERE uo.user_id = ?
      `).all(req.user.id);
    }
    res.json(orgs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/organizations', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { name } = req.body;
    const stmt = db.prepare('INSERT INTO organizations (name) VALUES (?)');
    const result = stmt.run(name);
    res.json({ id: result.lastInsertRowid, name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/organizations/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { name } = req.body;
    db.prepare('UPDATE organizations SET name = ? WHERE id = ?').run(name, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/organizations/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM organizations WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- INVENTORIES API (CRUD) ---
app.post('/api/inventories', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { name, organization_id } = req.body;
    const stmt = db.prepare('INSERT INTO inventories (name, organization_id) VALUES (?, ?)');
    const result = stmt.run(name, organization_id);
    res.json({ id: result.lastInsertRowid, name, organization_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/inventories/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { name, organization_id } = req.body;
    db.prepare('UPDATE inventories SET name = ?, organization_id = ? WHERE id = ?').run(name, organization_id, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/inventories/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM inventories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- GROUPS API ---
app.get("/api/inventories/:id/groups", authMiddleware, checkInventoryAccess, (req, res) => {
  try {
    const groups = db.prepare("SELECT * FROM groups WHERE inventory_id = ?").all(req.params.id);
    res.json(groups);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/inventories/:id/groups', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { name, variables } = req.body;
    const stmt = db.prepare('INSERT INTO groups (inventory_id, name, variables) VALUES (?, ?, ?)');
    const result = stmt.run(req.params.id, name, variables || '{}');
    res.json({ id: result.lastInsertRowid, inventory_id: req.params.id, name, variables });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/groups/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { name, variables } = req.body;
    db.prepare('UPDATE groups SET name = ?, variables = ? WHERE id = ?').run(name, variables || '{}', req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/groups/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM groups WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- HOSTS API ---
app.post('/api/inventories/:id/hosts', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { name, ip_address, variables, groups } = req.body;
    const insertHost = db.prepare('INSERT INTO hosts (inventory_id, name, ip_address, variables) VALUES (?, ?, ?, ?)');
    const result = insertHost.run(req.params.id, name, ip_address, variables || '{}');
    const hostId = result.lastInsertRowid;
    
    if (groups && groups.length > 0) {
      const insertHg = db.prepare('INSERT INTO host_groups (host_id, group_id) VALUES (?, ?)');
      const transaction = db.transaction((groupsList) => {
        for (const gId of groupsList) insertHg.run(hostId, gId);
      });
      transaction(groups);
    }
    res.json({ id: hostId, name, ip_address });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/hosts/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { name, ip_address, variables, groups } = req.body;
    const hostId = req.params.id;
    db.prepare('UPDATE hosts SET name = ?, ip_address = ?, variables = ? WHERE id = ?').run(name, ip_address, variables || '{}', hostId);
    
    db.prepare('DELETE FROM host_groups WHERE host_id = ?').run(hostId);
    if (groups && groups.length > 0) {
      const insertHg = db.prepare('INSERT INTO host_groups (host_id, group_id) VALUES (?, ?)');
      const transaction = db.transaction((groupsList) => {
        for (const gId of groupsList) insertHg.run(hostId, gId);
      });
      transaction(groups);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/hosts/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM hosts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
