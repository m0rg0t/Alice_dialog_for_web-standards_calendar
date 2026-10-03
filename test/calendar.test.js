'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCalendar, validDate } = require('../calendar');
const { createApp } = require('../index');
const event = (summary, start) => ({ summary, start, location: 'Fixture city', description: 'https://example.test/event' });
test('clock advances without restart; expired titles stop resolving', () => {
    let now = new Date('2026-12-31T12:00:00Z');
    const calendar = [event('January', '2027-01-01T10:00:00Z'), event('December', '2026-12-31T13:00:00Z')];
    const before = JSON.stringify(calendar);
    const respond = createCalendar({ calendar, clock: () => now });
    assert.match(respond('ближайшие события').text, /December[\s\S]*January/);
    assert.match(respond('december').text, /Название/);
    now = new Date('2027-01-01T00:00:00Z');
    assert.doesNotMatch(respond('события').text, /December/);
    assert.equal(respond('December').text, 'Простите, но я не поняла');
    assert.match(respond('в этом месяце').text, /January/);
    assert.equal(JSON.stringify(calendar), before);
});
test('month windows cross December and exclude exact next-month boundary', () => {
    const respond = createCalendar({ calendar: [event('Dec', '2026-12-01T00:00:00Z'), event('Jan', '2027-01-01T00:00:00Z'), event('Feb', '2027-02-01T00:00:00Z')], clock: () => new Date('2026-12-20T00:00:00Z') });
    assert.match(respond('этот месяц').text, /Dec/); // preserve all events in selected month
    const next = respond('следующий месяц');
    assert.match(next.text, /Jan/); assert.doesNotMatch(next.text, /Dec|Feb/);
});
test('invalid, missing and rolled dates excluded; leap dates validated', () => {
    for (const value of [null, undefined, '', '2026-02-30', '2026-13-01', '2026-02-29', 'invalid']) assert.equal(validDate(value), false);
    assert.equal(validDate('2028-02-29'), true);
    const respond = createCalendar({ calendar: [null, {}, event('Invalid', '2026-02-30')] });
    assert.equal(respond('события').text, 'Событий не найдено.');
});
test('response limit, safe buttons, invalid optional end, menu and help', () => {
    const entries = Array.from({ length: 6 }, (_, i) => ({ ...event(`Event ${i}`, '2027-01-02T00:00:00Z'), description: 'javascript:alert(1)', end: 'bad' }));
    const respond = createCalendar({ calendar: entries, clock: () => new Date('2027-01-01T00:00:00Z') });
    const response = respond('события'); assert.equal(response.buttons.length, 4); assert.equal(response.buttons[0].url, undefined);
    assert.doesNotMatch(respond('Event 0').text, /Invalid Date/);
    for (const command of ['', 'меню', 'помощь', 'unknown']) assert.ok(respond(command).text);
});
test('real SDK/Express response contract over loopback with synthetic request', async () => {
    const app = createApp({ calendar: [], clock: () => new Date('2026-01-01') });
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
        const url = `http://127.0.0.1:${server.address().port}/webhookurl`;
        const request = { version: '1.0', session: { session_id: 'fixture', user_id: 'fixture-user', message_id: 1, new: true }, request: { command: 'события', original_utterance: 'события', type: 'SimpleUtterance', nlu: { tokens: [], entities: [], intents: {} } } };
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
        assert.equal(response.status, 200); const body = await response.json();
        assert.equal(body.response.end_session, false); assert.equal(body.version, '1.0'); assert.equal(body.session.session_id, 'fixture'); assert.equal(body.response.text, 'Событий не найдено.');
        assert.equal((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 400);
    } finally { await new Promise(resolve => server.close(resolve)); }
});
