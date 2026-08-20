const cp = require('child_process');
const db = require('./db');

function runPlaybook(playbookPath, io, jobId) {
  return new Promise((resolve, reject) => {
    // Forzar colores de Ansible para que se vean bien en la terminal web
    const env = { ...process.env, PYTHONUNBUFFERED: '1', ANSIBLE_FORCE_COLOR: '1' };
    
    const ansible = cp.spawn('ansible-playbook', [playbookPath], { env });

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

    ansible.on('close', (code) => {
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
