'use strict';
const dayjs = require('dayjs');
require('dayjs/locale/ru');
const Responses = require('./strings/strings');
const format = 'DD MMMM YYYY года HH часов mm минут';

function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) return false;
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day && Number.isFinite(Date.parse(value));
}
function getEventText(event, fullData = false) {
    let text = `Название: ${event.summary}\n            Город: ${event.location || ''}\n            Дата начала: ${dayjs(event.start).locale('ru').format(format)}`;
    if (fullData && validDate(event.end)) text += `\nДата окончания: ${dayjs(event.end).locale('ru').format(format)}`;
    return text;
}
function createCalendar({ calendar, clock = () => new Date() }) {
    if (!Array.isArray(calendar)) throw new TypeError('Calendar must be an array');
    const events = calendar.filter(event => event && typeof event.summary === 'string' &&
        event.summary.trim() && validDate(event.start)).map(event => ({ ...event }))
        .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    const menu = ['Ближайшие события', 'В этом месяце', 'В следующем месяце'].map(title => ({ title, hide: false }));
    function showEvents(selected) {
        if (!selected.length) return { text: 'Событий не найдено.', buttons: menu };
        return { text: selected.slice(0, 4).map(event => getEventText(event)).join('\n\n'),
            buttons: selected.slice(0, 4).map(event => {
                const button = { title: event.summary.slice(0, 64), hide: false };
                try { const url = new URL(event.description); if (['https:', 'http:'].includes(url.protocol)) button.url = url.href; } catch {}
                return button;
            }) };
    }
    return function respond(message = '') {
        const now = dayjs(clock());
        if (!now.isValid()) throw new TypeError('Clock must return a valid date');
        const command = typeof message === 'string' ? message.trim().toLocaleLowerCase('ru') : '';
        if (['', 'в начало', 'меню'].includes(command)) return { text: Responses.hello, buttons: menu };
        if (['помощь', 'что ты умеешь', 'что умеешь', 'что ты умеешь?'].includes(command)) return { text: Responses.help, buttons: menu };
        const future = events.filter(event => Date.parse(event.start) >= now.valueOf());
        if (['ближайшее событие', 'ближайшее', 'события', 'ближайшие события'].includes(command)) return showEvents(future);
        let month;
        if (['в этом месяце', 'этот месяц'].includes(command)) month = now;
        if (['в следующем месяце', 'следующий месяц'].includes(command)) month = now.add(1, 'month');
        if (month) return showEvents(events.filter(event => dayjs(event.start) >= month.startOf('month') && dayjs(event.start) < month.add(1, 'month').startOf('month')));
        // Resolve titles on every request, rather than freezing available events at startup.
        const selected = future.find(event => event.summary.toLocaleLowerCase('ru') === command);
        return { text: selected ? getEventText(selected, true) : Responses.dont_know, buttons: menu };
    };
}
module.exports = { createCalendar, validDate, getEventText };
