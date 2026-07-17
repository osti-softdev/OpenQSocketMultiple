function normalizeServiceKey(value) {
  const key = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return key || 'SERVICE';
}

function splitServices(value) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

async function synchronizeServiceGroups(db, options = {}) {
  const externalRenames = new Map(options.renames || []);
  const removedKeys = new Set(options.removedKeys || []);
  const services = await db.allAsync('SELECT * FROM services ORDER BY id ASC');
  const usedKeys = new Set();
  const servicePlans = [];

  for (const service of services) {
    const baseKey = normalizeServiceKey(service.shortSname || service.sname);
    let key = baseKey;
    let suffix = 2;

    while (usedKeys.has(key)) key = `${baseKey}_${suffix++}`;
    usedKeys.add(key);
    servicePlans.push({ ...service, oldKey: service.sname, key });

    if (service.sname !== key) externalRenames.set(service.sname, key);
  }

  for (const [oldKey, newKey] of externalRenames) {
    if (!oldKey || oldKey === newKey) continue;
    await db.runAsync('UPDATE transactions SET sname = ? WHERE sname = ?', [newKey, oldKey]);
    await db.runAsync('UPDATE transactions SET counter_group = ? WHERE counter_group = ?', [newKey, oldKey]);
  }

  for (const service of servicePlans) {
    if (service.oldKey !== service.key) {
      await db.runAsync('UPDATE services SET sname = ? WHERE id = ?', [service.key, service.id]);
      await db.runAsync('UPDATE transactions SET sname = ? WHERE sname = ?', [service.key, service.oldKey]);
      await db.runAsync('UPDATE transactions SET counter_group = ? WHERE counter_group = ?', [service.key, service.oldKey]);
    }
  }

  let groups = await db.allAsync('SELECT * FROM counter_groups ORDER BY id ASC');
  const groupsByName = new Map();
  for (const group of groups) {
    if (!groupsByName.has(group.group_name)) groupsByName.set(group.group_name, group);
  }

  for (const service of servicePlans) {
    if (groupsByName.has(service.key)) continue;

    const previousKey = [...externalRenames.entries()]
      .find(([, newKey]) => newKey === service.key)?.[0];
    const reusableKey = service.oldKey !== service.key ? service.oldKey : previousKey;
    const reusable = groupsByName.get(reusableKey);
    if (reusable && reusableKey !== service.key) {
      await db.runAsync('UPDATE counter_groups SET group_name = ? WHERE id = ?', [service.key, reusable.id]);
      await db.runAsync('UPDATE counters SET group_name = ? WHERE group_id = ?', [service.key, reusable.id]);
      groupsByName.delete(reusableKey);
      reusable.group_name = service.key;
      groupsByName.set(service.key, reusable);
    } else {
      const result = await db.runAsync('INSERT INTO counter_groups (group_name) VALUES (?)', [service.key]);
      groupsByName.set(service.key, { id: result.lastID, group_name: service.key });
    }
  }

  groups = await db.allAsync('SELECT * FROM counter_groups ORDER BY id ASC');
  const validGroupByName = new Map();
  for (const service of servicePlans) {
    const matching = groups.find(group => group.group_name === service.key);
    if (matching) validGroupByName.set(service.key, matching);
  }

  const counters = await db.allAsync('SELECT id, services, group_id, group_name FROM counters');
  const groupReplacements = new Map();
  for (const counter of counters) {
    const rewrittenServices = [];
    for (const assigned of splitServices(counter.services)) {
      const renamed = externalRenames.get(assigned) || assigned;
      if (!removedKeys.has(assigned) && !removedKeys.has(renamed) && !rewrittenServices.includes(renamed)) {
        rewrittenServices.push(renamed);
      }
    }

    const renamedGroup = externalRenames.get(counter.group_name) || counter.group_name;
    let selectedGroup = validGroupByName.get(renamedGroup);
    if (!selectedGroup) {
      const firstValidService = rewrittenServices.find(service => validGroupByName.has(service));
      selectedGroup = firstValidService ? validGroupByName.get(firstValidService) : null;
    }

    if (counter.group_id && !groupReplacements.has(Number(counter.group_id))) {
      groupReplacements.set(Number(counter.group_id), selectedGroup?.id || null);
    }

    await db.runAsync(
      'UPDATE counters SET services = ?, group_id = ?, group_name = ? WHERE id = ?',
      [rewrittenServices.join(','), selectedGroup?.id || null, selectedGroup?.group_name || null, counter.id]
    );
  }

  const keepIds = new Set([...validGroupByName.values()].map(group => Number(group.id)));
  for (const group of groups) {
    if (!keepIds.has(Number(group.id))) {
      await db.runAsync(
        'UPDATE forwarded_tickets SET to_group_id = ? WHERE to_group_id = ?',
        [groupReplacements.get(Number(group.id)) || null, group.id]
      );
      await db.runAsync('DELETE FROM counter_groups WHERE id = ?', [group.id]);
    }
  }

  return servicePlans.map(service => ({ id: service.id, sname: service.key }));
}

async function inTransaction(db, work) {
  await db.runAsync('BEGIN IMMEDIATE');
  try {
    const result = await work();
    await db.runAsync('COMMIT');
    return result;
  } catch (error) {
    await db.runAsync('ROLLBACK');
    throw error;
  }
}

module.exports = {
  inTransaction,
  normalizeServiceKey,
  synchronizeServiceGroups
};
