const db = require('./backend/db');
const hosts = db.prepare('SELECT * FROM hosts WHERE inventory_id = ?').all(2);
const groups = db.prepare('SELECT * FROM groups WHERE inventory_id = ?').all(2);
const hostGroups = db.prepare(`
  SELECT hg.host_id, hg.group_id, g.name as group_name 
  FROM host_groups hg 
  JOIN groups g ON hg.group_id = g.id 
  WHERE g.inventory_id = ?
`).all(2);

let iniContent = '';

for (const host of hosts) {
  iniContent += `${host.name} ansible_host=${host.ip_address}`;
  try {
    const vars = JSON.parse(host.variables);
    for (const [k, v] of Object.entries(vars)) {
      iniContent += ` ${k}=${typeof v === 'string' ? '"' + v + '"' : v}`;
    }
  } catch (e) {}
  iniContent += '\n';
}
iniContent += '\n';

for (const group of groups) {
  iniContent += `[${group.name}]\n`;
  const gHosts = hostGroups.filter(hg => hg.group_id === group.id);
  for (const gh of gHosts) {
     const h = hosts.find(x => x.id === gh.host_id);
     if (h) iniContent += `${h.name}\n`;
  }
  iniContent += '\n';
}

console.log(iniContent);
