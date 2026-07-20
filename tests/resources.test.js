const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadResources() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const start = source.indexOf('const RESOURCE_METADATA');
  const end = source.indexOf('// Look up localized solutions');
  assert.ok(start >= 0 && end > start, 'resource data block must be discoverable');
  const context = {};
  vm.runInNewContext(
    `${source.slice(start, end)}\nglobalThis.resources = { RESOURCE_METADATA, CS, CG };`,
    context,
  );
  return context.resources;
}

test('minimum direct countries and global fallback contain emergency support', () => {
  const { RESOURCE_METADATA, CS } = loadResources();
  for (const country of RESOURCE_METADATA.minimumDirectCountries) {
    assert.ok(CS[country], `${country} needs direct resources`);
    const steps = CS[country]['Physical Violence'];
    assert.equal(steps.length, 3, `${country} needs three primary support steps`);
    assert.ok(steps.every(step => typeof step === 'string' && step.trim().length > 20));
    assert.ok(steps.some(step => /\d{3,}/.test(step)), `${country} needs a callable number`);
  }
  assert.ok(CS._Global);
  for (const [issue, steps] of Object.entries(CS._Global)) {
    assert.equal(steps.length, 3, `${issue} global fallback needs three steps`);
  }
});

test('resource review date is explicit and within the declared cadence', () => {
  const { RESOURCE_METADATA } = loadResources();
  const reviewed = Date.parse(`${RESOURCE_METADATA.lastReviewed}T00:00:00Z`);
  assert.ok(Number.isFinite(reviewed));
  const ageDays = (Date.now() - reviewed) / 86_400_000;
  assert.ok(ageDays >= -1, 'review date cannot be in the future');
  assert.ok(
    ageDays <= RESOURCE_METADATA.reviewCadenceDays,
    `support resources are ${Math.floor(ageDays)} days old and require review`,
  );
});
