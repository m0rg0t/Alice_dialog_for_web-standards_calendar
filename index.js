'use strict';

//const { json } = require('micro');
const { Alice, Reply, Markup } = require('yandex-dialogs-sdk');
const Responses = require('./strings/strings.js');
const dayjs = require('dayjs');
require('dayjs/locale/ru');
const app = require('express')();
const bodyParser = require('body-parser');
const alice = new Alice();
const EVENTS_COUNT = 4;
const PORT = process.env.PORT || 3001;

const fs = require('fs');

let rawdata = fs.readFileSync('./data/calendar.json');
let calendar = JSON.parse(rawdata);
dayjs.locale('ru');
const DateFormatString = 'DD MMMM YYYY года HH часов mm минут';

/***** sort events by date ******/
const sortByDateASC = (a, b) => {
    return new Date(a.start) - new Date(b.start)
};
calendar.sort(sortByDateASC);
const currentDate = new Date();
const futureCalendar = calendar.filter((event) => new Date(event.start) >= currentDate);
const eventNames = futureCalendar.map(event => event.summary);
/*******************************/

/**
 * Get tring with event description
 * @param {object} event event object
 * @param {*} fullData output full data about object
 */
const getEventText = (event, fullData = false) => {
    let eventText = `Название: ${event.summary}
            Город: ${event.location}
            Дата начала: ${dayjs(event.start).format(DateFormatString)}`;
    if (fullData) {
        event.end && (eventText += `\nДата окончания: ${dayjs(event.end).format(DateFormatString)}`);
    }
    return eventText;
}

app.use(function (req, res, next) {
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
alice.command(['В начало', 'меню'], async ctx => {
    return {
        text: Responses.hello,
        buttons: [M.button('Ближайшие события')]
    }
}
);
alice.command(['Помощь', 'Что ты умеешь', 'Что умеешь', 'что ты умеешь?'], async ctx =>
    Reply.text(Responses.help)
);
alice.command(['Выход', 'покинуть', 'хватит', 'закрыть', 'выключить'], async ctx => {
    сtx.leave();
    return Reply.text(Responses.exit);
});
alice.command(['ближайшее событие', 'ближайшее', 'события'], async ctx => {
    const events = futureCalendar;
    let out = '';
    let buttons = [];
    for (let i = 0; i < (EVENTS_COUNT > events.length ? events.length : EVENTS_COUNT); i++) {
        const event = events[i];
        out += getEventText(event) + "\n\n";
        buttons.push(M.button({
            title: event.summary,
            url: event.description
        }));
    }
    return {
        text: out,
        buttons: buttons
    }
}
);
alice.command(eventNames, ctx => {
    const selectedEvent = futureCalendar.find(event => event.summary === ctx.message);
    if (selectedEvent) {
        return Reply.text(getEventText(selectedEvent, true));
    } else {
        return Reply.text(Responses.dont_know);
    }
})
//alice.command(/(https?:\/\/[^\s]+)/g, ctx => Reply.text('Это ссылка!'));
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