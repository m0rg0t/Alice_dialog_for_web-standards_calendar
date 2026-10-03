'use strict';
const { createCalendar } = require('./calendar');

function createApp({ calendar, clock } = {}) {
    const express = require('express');
    const { Alice, Reply } = require('yandex-dialogs-sdk');
    const alice = new Alice();
    const respond = createCalendar({ calendar: calendar || require('./data/calendar.json'), clock });
    alice.any(ctx => {
        const answer = respond(ctx.message);
        return Reply.text(answer.text.slice(0, 1024), { buttons: answer.buttons });
    });
    const app = express();
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });
    app.use(express.json({ limit: '100kb' }));
    app.get('/', (req, res) => res.send('<html><body>Alice dialog for web standards calendar</body></html>'));
    app.post('/webhookurl', async (req, res, next) => {
        if (!req.body || !req.body.session || !req.body.request || typeof req.body.version !== 'string') {
            return res.status(400).json({ error: 'Invalid dialogue request' });
        }
        try { res.json(await alice.handleRequest(req.body)); } catch (error) { next(error); }
    });
    app.use((error, req, res, next) => {
        res.status(error.status === 413 ? 413 : 400).json({ error: 'Invalid dialogue request' });
    });
    return app;
}
if (require.main === module) createApp().listen({ port: process.env.PORT || 3001 });
module.exports = { createApp };
