//const { json } = require('micro');
const { Alice, Reply, Markup } = require('yandex-dialogs-sdk');
const Responses = require('./strings/strings.js');

const app = require('express')();
const bodyParser = require('body-parser');

const alice = new Alice();
const PORT = process.env.PORT || 3001;

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

const M = Markup;
alice.command('', async ctx => {
        return {
            text: Responses.hello,
            buttons: [M.button('Ближайшие события')]
        }
    }
);
alice.command(['Помощь', 'Что ты умеешь', 'Что умеешь'], async ctx =>
    Reply.text(Responses.help)
);
alice.command(/(https?:\/\/[^\s]+)/g, ctx => Reply.text('Это ссылка!'));
alice.any(async ctx => Reply.text(Responses.dont_know));

app.use(bodyParser.json());
app.get('/', async (req, res) => {
    res.send(`<html><body>Alice dialog for web standards calendar</body><html>`);
});
app.post('/webhookurl', async (req, res) => {
    // Returns hello message
    const jsonAnswer = await alice.handleRequest(req.body);
    res.json(jsonAnswer);
});
app.listen({ port: PORT });