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

    await t.test('ticketHistoryHelper.js - parseHistory, extractTellerJourney, and aggregateGroupMetrics', () => {
        const historyHelper = require(path.join(__dirname, '../../backend/utilities/ticketHistoryHelper.js'));

        // 1. History parsing
        const sampleHistory = '[09:00:00-TELLER 1-1-Called];[09:05:00-TELLER 1-1-Forwarded];[09:10:00-TELLER 2-2-Called];[09:15:00-TELLER 2-2-Forwarded];[09:20:00-TELLER 3-3-Called];[09:30:00-TELLER 3-3-Finished]';
        const events = historyHelper.parseHistory(sampleHistory);
        assert.strictEqual(events.length, 6, 'Should parse all 6 journey events');
        assert.strictEqual(events[0].actor, 'TELLER 1');
        assert.strictEqual(events[0].action, 'Called');
        assert.strictEqual(events[1].action, 'Forwarded');
        assert.strictEqual(events[5].action, 'Finished');

        // 2. Journey extraction
        const journey = historyHelper.extractTellerJourney(sampleHistory);
        assert.strictEqual(journey, 'TELLER 1 → TELLER 2 → TELLER 3', 'Should construct full journey across tellers');

        // 3. Teller Group metrics strictly checking history
        const counterGroups = [
            { id: 71, group_name: 'BILLING' },
            { id: 72, group_name: 'EDUCATION' },
            { id: 73, group_name: 'LEGAL' }
        ];
        const counters = [
            { id: 1, cname: 'TELLER 1', cnum: 1, cuser: 'tel1', group_name: 'BILLING', group_id: 71 },
            { id: 2, cname: 'TELLER 2', cnum: 2, cuser: 'tel2', group_name: 'EDUCATION', group_id: 72 },
            { id: 3, cname: 'TELLER 3', cnum: 3, cuser: 'tel3', group_name: 'LEGAL', group_id: 73 }
        ];

        // Ticket service is 'UNRELATED SERVICE' - not what tellers normally cater!
        const transactions = [
            {
                id: 101,
                sname: 'UNRELATED SERVICE',
                ticketservice: 'UNRELATED SERVICE',
                history: sampleHistory
            },
            {
                id: 102,
                sname: 'OTHER SERVICE',
                ticketservice: 'OTHER SERVICE',
                history: null // No history - should be skipped!
            }
        ];

        const groupMetrics = historyHelper.aggregateGroupMetrics(counterGroups, counters, transactions, '2026-10-21');
        assert.ok(Array.isArray(groupMetrics), 'Should return array of group metrics');

        const billing = groupMetrics.find(g => g.group_name === 'BILLING');
        const education = groupMetrics.find(g => g.group_name === 'EDUCATION');
        const legal = groupMetrics.find(g => g.group_name === 'LEGAL');

        assert.ok(billing, 'BILLING group should exist');
        assert.ok(education, 'EDUCATION group should exist');
        assert.ok(legal, 'LEGAL group should exist');

        // BILLING called then forwarded:
        assert.strictEqual(billing.served, 1, 'BILLING should count 1 served');
        assert.strictEqual(billing.forwarded, 1, 'BILLING should count 1 forwarded');
        assert.strictEqual(billing.received, 0, 'BILLING was initial caller, received is 0');

        // EDUCATION received from BILLING, called, then forwarded to LEGAL:
        assert.strictEqual(education.received, 1, 'EDUCATION should count 1 received');
        assert.strictEqual(education.served, 1, 'EDUCATION should count 1 served');
        assert.strictEqual(education.forwarded, 1, 'EDUCATION should count 1 forwarded');

        // LEGAL received from EDUCATION, called, then finished:
        assert.strictEqual(legal.received, 1, 'LEGAL should count 1 received');
        assert.strictEqual(legal.served, 1, 'LEGAL should count 1 served');
        assert.strictEqual(legal.completed, 1, 'LEGAL should count 1 completed');
        assert.strictEqual(legal.forwarded, 0, 'LEGAL did not forward, forwarded is 0');
    });

});
