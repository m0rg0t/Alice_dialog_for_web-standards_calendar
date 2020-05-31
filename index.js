'use strict';

require('dayjs/locale/ru');
const { Alice, Reply, Markup, Stage } = require('yandex-dialogs-sdk');
const Responses = require('./strings/strings.js');
const dayjs = require('dayjs');
const app = require('express')();
const bodyParser = require('body-parser');
const alice = new Alice();
const stage = new Stage();

dayjs.locale('ru');
const EVENTS_COUNT = 4;
const PORT = process.env.PORT || 3001;

const fs = require('fs');

let rawdata = fs.readFileSync('./data/calendar.json');
let calendar = JSON.parse(rawdata);

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

const M = Markup;
const menuButtons = [M.button('Ближайшие события'), M.button('В этом месяце'), M.button('В следующем месяце')];

/**
 * 
 * @param {array} events list of events we need to show
 * @param {object} options 
 */
const showEvents = (events = [], options = {
    limit: EVENTS_COUNT,
    filter: null
}) => {
    let text = '';
    let buttons = [];
    for (let i = 0; i < (options.limit > events.length ? events.length : options.limit); i++) {
        const event = events[i];
        text += getEventText(event) + "\n\n";
        buttons.push(M.button({
            title: event.summary,
            url: event.description
        }));
    }
    return {
        text,
        buttons
    }
};

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

alice.command('', async ctx => {
    return {
        text: Responses.hello,
        buttons: menuButtons
    }
});

alice.command(['В начало', 'меню'], async ctx => {
    return {
        text: Responses.hello,
        buttons: menuButtons
    }
}
);
alice.command(['Помощь', 'Что ты умеешь', 'Что умеешь', 'что ты умеешь?'], async ctx =>
    Reply.text(Responses.help)
);

alice.command(['ближайшее событие', 'ближайшее', 'события'], async ctx => {
    const events = futureCalendar.filter((event) => dayjs(event.start) >= dayjs());
    return showEvents(events, { limit: EVENTS_COUNT });
});

alice.command(['в этом месяце', 'этот месяц'], async ctx => {
    let monthStart = dayjs().startOf('month');
    let monthEnd = dayjs().endOf('month');
    const events = calendar.filter((event) => dayjs(event.start) >= monthStart && dayjs(event.start) <= monthEnd);
    
    return showEvents(events, { limit: EVENTS_COUNT });
});

/**
 * TODO
 * Add common function to show list of events and to get events for specified date or date interval
 */
alice.command(['в следующем месяце', 'следующий месяц'], async ctx => {
    let now = dayjs();
    let monthStart = dayjs().add(1, "month").startOf('month');
    let monthEnd = dayjs().add(1, "month").endOf('month');
    const events = calendar.filter((event) => dayjs(event.start) >= monthStart && dayjs(event.start) <= monthEnd);
    return showEvents(events, { limit: EVENTS_COUNT });
});

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