const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

test('Backend Utilities Unit Tests', async (t) => {

    await t.test('datetime.js - getPHDateTime() should return valid date and time format', () => {
        const { getPHDateTime } = require(path.join(__dirname, '../../backend/utilities/datetime.js'));
        const { date, time } = getPHDateTime();

        assert.ok(typeof date === 'string', 'date should be a string');
        assert.ok(typeof time === 'string', 'time should be a string');
        assert.match(date, /^\d{4}-\d{2}-\d{2}$/, 'date should match YYYY-MM-DD');
        assert.match(time, /^\d{2}:\d{2}:\d{2}$/, 'time should match HH:mm:ss');
    });

    await t.test('serviceGroups.js - normalizeServiceKey() formatting rules', () => {
        const { normalizeServiceKey } = require(path.join(__dirname, '../../backend/utilities/serviceGroups.js'));

        assert.strictEqual(normalizeServiceKey('Billing & Payments'), 'BILLING_PAYMENTS');
        assert.strictEqual(normalizeServiceKey('EDUCATION-DEPARTMENT!'), 'EDUCATION_DEPARTMENT');
        assert.strictEqual(normalizeServiceKey('   Special   Permits   '), 'SPECIAL_PERMITS');
        assert.strictEqual(normalizeServiceKey(''), 'SERVICE');
    });

    await t.test('envconfig.js - loadConfig() should return valid configuration object', () => {
        const { loadConfig } = require(path.join(__dirname, '../../backend/utilities/envconfig.js'));
        const config = loadConfig();

        assert.ok(config, 'Configuration object should be defined');
        assert.ok(config.MainServer, 'MainServer configuration section should exist');
        assert.ok(config.MainServer.port, 'Port should be configured');
    });

});
