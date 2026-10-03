# Alice_dialog_for_web-standards_calendar

Alice.Dialog for webstandards events calendar

Адрес календаря:

- JSON: [web-standards.ru/calendar.json](https://web-standards.ru/calendar.json) для удобной работы с данными.

Используемые инструменты:

- https://github.com/fletcherist/yandex-dialogs-sdk - для упрощения работы с "протоколом" Алисы
- https://github.com/popstas/yandex-dialogs-client/ - средство для локального тестирования навыка
- https://github.com/web-standards-ru/calendar - календарь веб-стандартов с событиями по фронтенду

Распространяется по лицензии [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.ru).



## Maintenance and offline verification

Requires Node.js 24 LTS (CommonJS). Install with `npm ci --ignore-scripts`,
then run `TZ=UTC npm run check`. CI uses synthetic fixtures only. No live
chat, model, calendar provider, deployment, or production validation is performed.

The bundled calendar and original Russian responses remain unchanged. Calendar
selection uses the clock on every request. Month commands preserve the original
whole-month semantics, including past dates in that month; nearest events and
title lookup exclude expired events. Months and formatting use the server time
zone (set `TZ` explicitly for deployment; CI uses UTC). Invalid entries are skipped.
The data is a historical snapshot, not automatically refreshed.

Dependency coordination: existing PRs #2 (node-fetch), #3 (Express/qs), and #4
(Express) were reviewed. This draft consolidates their security-update intent
into the current lockfile: Express 5.2.1 and its updated parser/qs stack; the
Yandex SDK retains CommonJS node-fetch 2 through its compatible range. No existing
PR was changed, closed or merged. Review this replacement lockfile together with
those PRs before choosing what to merge. The unused direct micro dependency was
removed; SDK 2.3.0 is still its current published release.

Final local npm audit: zero reported vulnerabilities after compatible transitive
updates. This is a registry snapshot, not a guarantee of security.
