import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(here, '../kb/glossary-calc-y1.json');
const entries = JSON.parse(await readFile(file, 'utf8'));
const required = ['id', 'week', 'en', 'ar', 'def_en', 'def_ar', 'example', 'status'];

assert.ok(Array.isArray(entries), 'glossary must be a JSON array');
assert.ok(entries.length >= 60 && entries.length <= 90, `expected 60–90 entries, got ${entries.length}`);

const ids = new Set();
const weeks = new Map();
for (const [index, entry] of entries.entries()) {
  assert.ok(entry && typeof entry === 'object' && !Array.isArray(entry), `entry ${index + 1} must be an object`);
  for (const field of required) {
    assert.ok(Object.hasOwn(entry, field), `entry ${index + 1} is missing ${field}`);
  }
  assert.match(entry.id, /^g-calc-\d{3}$/, `entry ${index + 1} has an invalid id`);
  assert.ok(!ids.has(entry.id), `duplicate id: ${entry.id}`);
  ids.add(entry.id);
  assert.ok(Number.isInteger(entry.week) && entry.week >= 1 && entry.week <= 10, `${entry.id} has an out-of-range week`);
  weeks.set(entry.week, (weeks.get(entry.week) || 0) + 1);
  for (const field of ['en', 'ar', 'def_en', 'def_ar', 'example']) {
    assert.equal(typeof entry[field], 'string', `${entry.id}.${field} must be a string`);
    assert.ok(entry[field].trim().length > 0, `${entry.id}.${field} must not be empty`);
  }
  assert.equal(entry.status, 'needs-check', `${entry.id} must remain marked needs-check`);
  for (const field of ['def_en', 'def_ar']) {
    const definition = entry[field].trim();
    assert.match(definition, /\.$/, `${entry.id}.${field} must end as one sentence`);
    assert.equal((definition.match(/\./g) || []).length, 1, `${entry.id}.${field} must contain exactly one sentence`);
  }
  const content = `${entry.en} ${entry.ar} ${entry.def_en} ${entry.def_ar}`;
  assert.doesNotMatch(content, /\b(?:integration|integral)\b|التكامل/i, `${entry.id} must not introduce an integration topic`);
}

for (let week = 1; week <= 10; week++) {
  assert.ok((weeks.get(week) || 0) >= 4, `week ${week} needs at least four entries`);
}

console.log(`EX-002 glossary checks passed (${entries.length} entries across weeks 1–10)`);
