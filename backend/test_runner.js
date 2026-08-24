const { runPlaybook } = require('./ansibleRunner');
const db = require('./db');
const playbook = db.prepare("SELECT * FROM playbooks WHERE name LIKE '%Actualizar%'").get();
if (playbook) {
  runPlaybook(playbook, { emit: () => {} }, 9999, 2)
    .then(() => console.log('Done'))
    .catch(e => console.error(e));
} else {
  console.log("Playbook not found");
}
