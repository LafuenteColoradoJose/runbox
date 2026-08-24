const cp = require('child_process');
const db = require('./db');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function runPlaybook(playbookPath, io, jobId, inventoryId) {
  let inventoryPath = null;
  
  if (inventoryId) {
    inventoryPath = path.join(os.tmpdir(), `ansible_inv_${jobId}.ini`);
    let iniContent = '';

    const hosts = db.prepare('SELECT * FROM hosts WHERE inventory_id = ?').all(inventoryId);
    const groups = db.prepare('SELECT * FROM groups WHERE inventory_id = ?').all(inventoryId);
    const hostGroups = db.prepare(`
      SELECT hg.host_id, hg.group_id, g.name as group_name 
      FROM host_groups hg 
      JOIN groups g ON hg.group_id = g.id 
      WHERE g.inventory_id = ?
    `).all(inventoryId);

    // 1. All hosts with their variables
    for (const host of hosts) {
      iniContent += `${host.name} ansible_host=${host.ip_address}`;
      try {
        const vars = JSON.parse(host.variables);
        for (const [k, v] of Object.entries(vars)) {
          iniContent += ` ${k}=${typeof v === 'string' ? '"' + v + '"' : v}`;
        }
      } catch (e) {
        // ignore parse error
      }
      iniContent += '\n';
    }
    iniContent += '\n';

    // 2. Groups and their hosts
    for (const group of groups) {
      iniContent += `[${group.name}]\n`;
      const gHosts = hostGroups.filter(hg => hg.group_id === group.id);
      for (const gh of gHosts) {
         const h = hosts.find(x => x.id === gh.host_id);
         if (h) iniContent += `${h.name}\n`;
      }
      iniContent += '\n';

      // Group vars
      let hasVars = false;
      let varsStr = '';
      try {
        const vars = JSON.parse(group.variables);
        if (Object.keys(vars).length > 0) {
          hasVars = true;
          for (const [k, v] of Object.entries(vars)) {
            varsStr += `${k}=${typeof v === 'string' ? '"' + v + '"' : v}\n`;
          }
        }
      } catch (e) {}

      if (hasVars) {
        iniContent += `[${group.name}:vars]\n${varsStr}\n`;
      }
    }

    try {
      await fs.promises.writeFile(inventoryPath, iniContent);
    } catch (err) {
      console.error('Error writing inventory file:', err);
    }
  }

  return new Promise((resolve, reject) => {
    // Forzar colores de Ansible para que se vean bien en la terminal web
    const env = { ...process.env, PYTHONUNBUFFERED: '1', ANSIBLE_FORCE_COLOR: '1', ANSIBLE_HOST_KEY_CHECKING: 'False' };
    
    const args = [playbookPath];
    if (inventoryPath) {
      args.push('-i', inventoryPath);
    }

    const ansible = cp.spawn('ansible-playbook', args, { env });

    const appendLog = db.prepare('UPDATE jobs SET log_output = log_output || ? WHERE id = ?');

    ansible.stdout.on('data', (data) => {
      const output = data.toString();
      appendLog.run(output, jobId);
      io.emit(`job-${jobId}-log`, { type: 'stdout', data: output });
    });

    ansible.stderr.on('data', (data) => {
      const output = data.toString();
      appendLog.run(output, jobId);
      io.emit(`job-${jobId}-log`, { type: 'stderr', data: output });
    });

    const cleanup = () => {
      if (inventoryPath) {
        fs.unlink(inventoryPath, () => {});
      }
    };

    ansible.on('close', (code) => {
      cleanup();
      const status = code === 0 ? 'success' : 'failed';
      db.prepare('UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, jobId);
      const closeMsg = `\r\n[Sistema] Playbook finalizado con código: ${code}\r\n`;
      appendLog.run(closeMsg, jobId);
      io.emit(`job-${jobId}-log`, { type: 'system', data: closeMsg });
      io.emit(`job-${jobId}-status`, { status });
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Exit code ${code}`));
      }
    });
    
    ansible.on('error', (err) => {
      cleanup();
      db.prepare('UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('error', jobId);
      const errorMsg = `\r\n[Error] Falla al iniciar proceso: ${err.message}\r\n`;
      appendLog.run(errorMsg, jobId);
      io.emit(`job-${jobId}-log`, { type: 'error', data: errorMsg });
      io.emit(`job-${jobId}-status`, { status: 'error' });
      reject(err);
    });
  });
}

module.exports = { runPlaybook };
