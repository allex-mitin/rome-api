# RomeAPI — план доработок

Документ фиксирует результаты аудита проекта и план вывода его в продакшн-качество.
Статусы: `[x]` сделано · `[~]` сделано, но не проверено · `[ ]` не начато.

Цель: превратить «swagger-ui dist для OpenAPI + AsyncAPI» в полноценный инструмент описания API
системы, ключевое отличие которого — работа со спецификацией, **разбитой на куски** с
переиспользуемыми DTO.

---

## Текущее состояние (по результатам аудита)

- Стек: React 18.3.1, Vite 5.4.19, TS 5.8.3, `react-router-dom` 6.30 (loaders), `@admiral-ds/react-ui`,
  `styled-components`, Tailwind.
- Роутинг: `/service/:serviceName/:documentation/:version`.
- OpenAPI рендерит `swagger-ui-react`, AsyncAPI — `@asyncapi/react-component` + `@asyncapi/parser`
  (внешние `$ref` резолвит кастомный file-resolver).
- Конфиг сервисов: `settings.yml` (приоритет) либо фолбэк `public/settings.js` → `window.settings`.
- Инфраструктуры не было: ни README, ни тестов, ни линт-конфига, ни CI, ни nginx/Docker.

---

## Этап 0 — гигиена кода и конфигов

Задача: убрать утечки, мусор и сломанные скрипты до любых функциональных доработок.

### Безопасность и сборка
- [x] `vite.config.ts`: убран `define: { 'process.env': process.env }` — он инлайнил **весь** env
      сборочной машины (токены/креды CI) в клиентский бандл. Заменено на безопасное подмножество
      `{ NODE_ENV: mode }`.
- [x] `vite.config.ts`: `build.sourcemap` теперь включается только вне production — прод-статика
      больше не отдаёт исходники.
- [x] `vite.config.ts`: настроен `base` для деплоя в подпапку (через `VITE_BASE_PATH`, по умолчанию `/`);
      роутер получил `basename: import.meta.env.BASE_URL`.
- [ ] Ревизия `vite-plugin-node-polyfills` (`fs, http, https, zlib, path, url, stream, util`) —
      проверить визуализатором, что реально нужно рендерерам, и урезать.

### Зависимости
- [x] Удалены неиспользуемые: `react-headroom`, `@types/react-headroom`, `compare-versions`,
      `vite-plugin-html-inject`.
- [x] `buffer` сначала был удалён как «неиспользуемый», но возвращён: без него сборка
      экстерналила `buffer` для 6 модулей (`browserify-zlib`, `readable-stream`, `safe-buffer`,
      `@stoplight/yaml-ast-parser`) — это ломало цепочку полифилов.
- [x] Добавлены фантомные (использовались в коде, но не были объявлены): `js-yaml`,
      `styled-components`, `@asyncapi/parser`, `@types/js-yaml`, `@types/urijs`.
- [x] `vite` и `@vitejs/plugin-react` перенесены из `dependencies` в `devDependencies`.
- [x] Добавлен `engines: { node: ">=20" }` и `.nvmrc` (22).

### Линт и типы
- [x] Заведён `.eslintrc.cjs` — раньше скрипт `npm run lint` существовал, но конфига не было вообще.
- [x] Добавлены `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`,
      `eslint-plugin-react`, `eslint-plugin-react-hooks`.
- [x] Типы вынесены из «хрупких» глобальных деклараций в `src/types.ts`
      (`Settings`, `Service`, `Spec`); `src/models/Settings.ts` удалён.
- [x] Исправлен тип `Spec.urls`: был `Map<string,string>`, из YAML приходит plain object →
      теперь `Record<string,string>`.
- [x] Исправлен `Settings.services: [Service]` (кортеж из одного элемента) → `Service[]`.
- [x] Убран неиспользуемый импорт `Service` (компонент) в `NavBar.tsx`, который маскировал тип
      данных сервиса — `service.name` типизировался как имя функции.
- [x] Удалены неиспользуемые импорты по всем файлам (при `noUnusedLocals: true` они ломали `tsc`).

### Чистота кода
- [x] Убран `console.log('data', data)` в `Navigator.tsx`.
- [x] `loadYamlSettingsGwowingUp` переименован в `loadSettingsFile`, вычищены комментарии-заглушки,
      добавлена проверка `response.ok`.
- [x] `NavBarButtons.tsx`: мёртвый закомментированный код удалён, вызов `useNavigate()` внутри
      функции `refresh()` (нарушение rules-of-hooks) перенесён в тело компонента.
- [x] `AsyncApiContainer.tsx`: удалён неиспользуемый импорт, добавлен `key` в список диагностик.

### Данные и документация
- [x] Починены битые демо-настройки: `settings.yml` ссылался на несуществующий
      `openapi-0.0.3.json`, `settings.js` — на несуществующий `/test/0.0.1/openapi.json`.
- [x] Написан `README.md` (отсутствовал, хотя `readmeFilename` был указан).
- [x] Добавлен алиас-скрипт `dev` — IDE и разработчики по умолчанию запускают `npm run dev`,
      которого в проекте не было.
- [x] Добавлен `deploy/nginx.conf.example` с обязательным SPA-фолбэком
      `try_files $uri $uri/ /index.html`.

### Верификация
- [x] Прогнаны `npm run types`, `npm run lint`, `npm run build` — все зелёные
      (`TYPES_EXIT=0`, `LINT_EXIT=0`, `BUILD_EXIT=0`).
- [x] По результатам первого прогона исправлены унаследованные ошибки, которые раньше не всплывали:
      SVG-атрибуты в `Logo.tsx` (`xmlns:xlink` → `xmlnsXlink`, `enable-background` → `enableBackground`,
      `xml:space` → `xmlSpace`) ломали `tsc`; отсутствующий `key` у корневого `<Route>` в `App.tsx`;
      `rel="noreferrer"` для `target="_blank"` в `WelcomePage.tsx`; безымянный компонент в
      `Navigator.tsx`; неиспользуемый `_` в `SpecVersion.tsx`.

---

## Этап 1 — производительность и сборка

- [x] Code-splitting: `Documentation.tsx` больше не тянет `SwaggerPage` и `AsyncApiPage` статически —
      оба рендерера вынесены в отдельные чанки через `React.lazy` + `Suspense`.
- [x] Замер бандла стал воспроизводимым: `npm run analyze` делает прод-сборку и кладёт отчёт
      (`build/stats.html` — treemap, `build/stats.json` — данные), а `scripts/bundle-report.mjs`
      печатает разбивку по чанкам и пакетам. Отчёт нужно снимать именно с прод-сборки: любой другой
      режим меняет `process.env.NODE_ENV`, оставляет dev-ветки в зависимостях и ломает сборку.
- [x] Вынос логотипа из JS: `«svg»` в `Logo.tsx` весил ~143 kB и лежал в главном чанке → переехал
      в `src/assets/logo.svg` и подключается через `<img>`.
      Главный чанк: **567 kB → 422 kB** (gzip **185 kB → 130 kB**), наш код в нём 172 kB → 20 kB.
      Суммарный вес первого экрана почти не изменился (SVG стал отдельным файлом на 143 kB),
      но он больше не парсится как JS и кэшируется отдельно от кода.
- [x] **`AsyncApiPage` урезан: 5 005 kB → 4 487 kB (gzip 1 086 kB → 946 kB)**, плюс `LoadingSpec`
      39 kB → 12 kB.
- [ ] Остаток `AsyncApiPage` (4 487 kB) — крупные вклады: `@asyncapi/react-component` 2 414 kB,
      `@asyncapi/specs` 1 137 kB, `lodash` 547 kB, `ajv` 245 kB, `@asyncapi/parser` 207 kB,
      `nimma` 143 kB, `urijs` 102 kB.
- [x] **Выкинут `node-fetch`.** В браузере он не нужен — есть нативный `fetch`, а `node-fetch` тянул
      за собой `browserify-zlib` → `pako` (183 kB) и `readable-stream` (93 kB). Сделан `resolve.alias`
      на `src/shims/node-fetch.cjs` (повторяет форму экспорта node-fetch v2, берёт API из `globalThis`).
      Побочно ушли `pako`, `readable-stream` и `vite-plugin-node-polyfills` из чанка `LoadingSpec`.
      Проверено в браузере: AsyncAPI-страница рисуется, ошибок в консоли нет.
      Замечание: `SwaggerPage` при этом подрос на ~29 kB (1 184 → 1 212 kB) — по-видимому, переезд
      `buffer`-полифила между чанками; отдельно не изучено.
- [ ] Остальное в `AsyncApiPage`/`SwaggerPage` — внутренности `@asyncapi/react-component` и `swagger-ui`
      (`@asyncapi/specs` — JSON-схемы всех версий, `lodash`, `ajv`, `nimma`, `autolinker`, `immutable`,
      `ramda`, `highlight.js`). Без форка библиотек не урезается; частично лечится `manualChunks`,
      чтобы не грузить всё одним куском.
- [ ] Предзагрузка/кэш спек, `Cache-Control` для хешированных ассетов (частично в nginx-примере).
- [x] Конфиг Vite переведён на ESM (`vite.config.mts`) — путь к Vite 7 открыт. Для этого понадобился
      свой шим `src/shims/fs.cjs` через `nodePolyfills({ overrides })`: `@asyncapi/parser` импортирует
      `readFile` из `fs` на уровне модуля, а дефолтный полифил сводит `fs` к моку без именованных
      экспортов (подробности — в заметке к Этапу 2). Побочно исчезло предупреждение
      `The CJS build of Vite's Node API is deprecated`.
      Проверено: `TYPES_EXIT=0`, `BUILD_EXIT=0`, `ANALYZE_EXIT=0`, размеры чанков не изменились.
- [ ] Предупреждения сборки: `Use of eval` в `@asyncapi/react-component/browser` (внутри библиотеки)
      и устаревшая база `caniuse-lite` (`npx update-browserslist-db@latest`).
- [ ] `npm audit`: 46 уязвимостей (8 low, 15 moderate, 20 high, 3 critical) — разобрать, что реально
      достижимо из клиентского кода.
- [~] `base` + относительные пути: `base` настраивается через `VITE_BASE_PATH`, роутер получил
      `basename: import.meta.env.BASE_URL`. Требуется проверить деплой в подпапку.

---

## Этап 2 — обновление версий

Обновлять по одному шагу, каждый раз прогоняя `types` / `lint` / `build` и проверяя рендер обеих спек.

> **Заметка про ESM-конфиг (уже сделано на Этапе 1).** `vite.config.ts` переведён в `vite.config.mts`,
> то есть требование Vite 7 «ESM-конфиг» выполнено. Без шима `src/shims/fs.cjs` (подключается через
> `nodePolyfills({ overrides: { fs: ... } })`) сборка падала: `@asyncapi/parser/esm/from.js` импортирует
> `readFile` из `fs` на уровне модуля, а дефолтный полифил подставляет
> `node-stdlib-browser/esm/mock/empty.js` без статических экспортов → `MISSING_EXPORT`. В CJS-конфиге это
> маскировалось CJS-интеропом, который не проверяет именованные экспорты. Не убирать шим `fs` —
> сборка сломается снова.

- [x] Vite 5 → **7.3.6**. Плагины обновлять не пришлось: `vite-plugin-node-polyfills` 0.24.0
      поддерживает `vite ^2…^7`, `@vitejs/plugin-react` 4.6.0 — `^7.0.0-beta.0` (покрывает 7.x).
      Заодно: `engines.node` поднят до `^20.19.0 || >=22.12.0` (требование Vite 7), скрипты `dev`/`start`
      переведены с `vite serve` на `vite` — каноничная форма.
      Проверено: `TYPES_EXIT=0`, `LINT_EXIT=0`, `BUILD_EXIT=0`, `ANALYZE_EXIT=0`; dev-сервер поднимается
      (`VITE v7.3.6 ready in 370 ms`).
      Размеры чанков немного изменились (новые дефолтный `build.target` и минификатор):
      `index` 422 → 421 kB, `AsyncApiPage` 4 488 → 4 570 kB (gzip 946 → 969 kB),
      `SwaggerPage` 1 212 → 1 240 kB; число модулей 4 254 → 3 546.
      **Требуется проверка в браузере** — рендер обеих спек после мажорного апгрейда не проверялся.
- [ ] Учесть, что актуальный Vite — уже 8.x (переход на Rolldown), и `@vitejs/plugin-react` 6.x требует
      именно его. Отдельный шаг со своими рисками, после стабилизации на 7.
- [x] ESLint 8 (EOL) → **9.39.5** + flat config. `.eslintrc.cjs` заменён на `eslint.config.mjs`,
      скрипт `lint` переведён с `eslint --ext .js,.ts,.tsx src` на `eslint src` (флаг `--ext` в 9 удалён).
      Из зависимостей поднят `eslint-plugin-react-hooks` 4.6.2 → 5.2.0 (версия 4 не поддерживает ESLint 9),
      добавлены `@eslint/js` и `globals`. `eslint-plugin-react` 7.37.5 и `@typescript-eslint` 8.70 уже
      заявляли поддержку 9 — их трогать не пришлось.
      Всплыло два момента, невидимых в legacy-режиме: `no-undef` давал ложное срабатывание на type-only
      ссылке `React.ChangeEvent` (для TS-файлов правило отключено — TS сам это проверяет) и нашлась
      неиспользуемая директива `eslint-disable` в `src/index.tsx` (в 9 `reportUnusedDisableDirectives`
      включён по умолчанию — директива удалена).
      Проверено: `LINT_EXIT=0` без предупреждений, `TYPES_EXIT=0`, `BUILD_EXIT=0`.
- [x] `react-router-dom` 6 → **7.18.3**. Правок в коде не потребовалось: используемые API
      (`createBrowserRouter`, `createRoutesFromElements`, `Route`, `redirect`, `RouterProvider`,
      `useLoaderData`, `useNavigate`, `useParams`, `NavLink`, `Outlet`, `LoaderFunctionArgs`) оказались
      совместимы — `TYPES_EXIT=0` и `LINT_EXIT=0` без единой правки.
      Цена — рост главного чанка: **421 → 451 kB** (gzip 129,5 → 139,5). Разбор показал, что это сам
      `react-router` (221 kB rendered против ~193 kB у `@remix-run/router` + `react-router` в v6),
      дублирования нет — в бандле один общий чанк `react-router`.
      Наблюдение: `exports` у `react-router@7.18.3` ссылается только на `dist/development`, условий
      `development`/`production` не объявлено вовсе, а `dist/production` из `package.json` не
      упоминается. Dev-ветки вырезаются лишь через `process.env.NODE_ENV`. Проверено, что в собранном
      чанке `process.env` и `NODE_ENV` встречаются **0** раз — `define` их заменил, dev-код не остался.
      **Требуется проверка в браузере** — навигация, переключение версий и спек.
- [ ] React 18 → 19 — только после проверки совместимости peer-зависимостей
      `@admiral-ds/react-ui` и `swagger-ui-react`.
- [ ] `swagger-ui-react` / `@asyncapi/react-component` — обновление до актуальных.

---

## Этап 3 — бизнес-фичи

Приоритет задан по ценности для «команды, описывающей API системы», и по близости к ключевой фишке
проекта (спека из кусков, переиспользуемые DTO).

### P0 — ядро
- [ ] **Скачать / скопировать спеку целиком.** Собрать на клиенте единый документ, развернув все
      `$ref` (внутренние и внешние файлы), и отдать JSON/YAML. OpenAPI — `@apidevtools/swagger-parser`
      (`.bundle()`) или `@redocly/openapi-core`; AsyncAPI — уже распарсенный `document.json()`.
      В коде уже были заготовки кнопок Download/Copy (закомментированы в `NavBarButtons.tsx`).
- [ ] **Валидация спецификации** — панель ошибок и предупреждений вместо текущего дампа
      `JSON.stringify(diagnostics)`. Для AsyncAPI диагностика уже есть, для OpenAPI добавить валидатор.
- [ ] **Глобальный поиск** по всем сервисам, операциям и схемам.

### P1 — ценность для команды
- [ ] **Diff двух версий спеки** и подсветка breaking changes (`compare-versions` был в зависимостях,
      но не использовался).
- [ ] **Реестр DTO** — каталог схем с обратными ссылками «где переиспользуется» и поиском дубликатов.
      Это прямое продолжение ключевой фишки проекта и главное отличие от `swagger-ui`.
- [ ] **Экспорт в другие форматы**: Markdown, статические HTML-доки, Postman collection, curl.
- [ ] **Брендинг и темы из конфига**: сейчас в `Header.tsx` захардкожено «Rome API», не настраиваются
      лого, название, фавикон, цвета и тёмная тема Admiral.

### P2 — развитие
- [ ] Редактор спеки в браузере (Monaco + live preview) — потребует решения про сохранение.
- [ ] Try-it-out / mock-ответы из примеров.
- [ ] Deep-link «поделиться операцией».
- [ ] i18n / мультиязычность.
- [ ] PWA и офлайн-кэш спек.
- [ ] Встраиваемый виджет (web component / iframe) — проект позиционируется как компонент.
- [ ] Аналитика просмотров.
- [ ] Переключатель окружений (dev/stage/prod URL сервисов) в `settings.yml`.
- [ ] Разграничение доступа и скрытие сервисов.

---

## Этап 4 — качество и инфраструктура

- [ ] Тесты: `vitest` для `src/helpers` и будущего сборщика спек, Playwright для e2e-рендера.
- [ ] CI (GitHub Actions): `types` + `lint` + `build` + тесты на каждый PR.
- [ ] Docker + nginx-образ для деплоя одной командой.
- [ ] `CHANGELOG.md` и правила контрибьюта.

---

## Открытые вопросы

1. Где хранить отредактированные спеки в редакторе (P2): только local storage, или нужен бэкенд?
2. Нужен ли деплой в подпапку (влияет на `base` и пути)?
3. Какой набор поддерживаемых форматов экспорта приоритетен (Postman? Markdown? HTML?).
4. Нужна ли авторизация/разграничение доступа, или это остаётся задачей nginx?
