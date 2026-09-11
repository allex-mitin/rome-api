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
- [x] `npm audit` разобран: **46 → 6 low**. Сначала `npm audit fix` (без `--force`): 24 → 11
      (`added 15 packages, removed 18 packages, changed 46 packages`). Остаток закрыт через `overrides`:
      `js-yaml` 4.3.1 → **4.3.2**, `lodash` 4.17.23 → **4.18.1**.
      Почему понадобились `overrides`: `swagger-ui`/`swagger-ui-react` запинены **ровно** на `=4.3.1`
      (уязвимая версия), а уязвимую `lodash@4.17.23` тянули `@stoplight/*`. Обычный `npm audit fix`
      тут бессилен, а его `--force` предлагал абсурд — откат `swagger-ui-react@3.51.2` и
      `vite-plugin-node-polyfills@0.2.0`. После `overrides` в дереве осталось по одной версии
      (всё «deduped»), и бандл даже чуть уменьшился: `AsyncApiPage` 5 202 → **5 121 kB**,
      `SwaggerPage` 1 274 → **1 253 kB**.
- [ ] Остались **6 low** — все на `elliptic` (GHSA-848j-6mx2-7j84; advisory помечает уязвимыми
      вообще все версии, так что `overrides` не помогут). Цепочка:
      `crypto-browserify` ← `node-stdlib-browser` ← `vite-plugin-node-polyfills`. В клиентский бандл
      **не попадает**: `crypto` нет в `nodePolyfills.include`, предупреждений об экстернализации 0,
      а поиск по собранным чанкам даёт 0 вхождений `elliptic`, `crypto-browserify`, `browserify-sign`,
      `create-ecdh`, `bn.js`. Итог: риск только build-time, принято осознанно.
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
- [x] `swagger-ui`/`swagger-ui-react` 5.25.4 → **5.32.15**, `@asyncapi/react-component` 2.6.3 → **3.1.8**
      (мажор), `@asyncapi/parser` 3.4.0 → **3.6.3**. Правок в коде не потребовалось: точки входа
      (`browser/index.js`, `browser/without-parser.js`) на месте, а `ConfigInterface` в v3 содержит ровно
      те же ключи (`schemaID`, `show`, `expand`, `sidebar` со значениями `'byDefault'`, `parserOptions`).
      `TYPES_EXIT=0`, `LINT_EXIT=0`, `BUILD_EXIT=0`. Уязвимостей стало меньше: 46 → 29.
      Цена — рост бандла примерно на 598 kB: `AsyncApiPage` 4 570 → 5 087 kB (gzip 969 → 1 057),
      `LoadingSpec` 14 → 55 kB, `SwaggerPage` 1 240 → 1 274 kB, `index` 451 → 456 kB.
      Причина роста `AsyncApiPage` — сам `@asyncapi/react-component` (2 414 → 2 832 kB rendered) и
      `@asyncapi/specs` (1 137 → 1 355 kB); в общий чанк `LoadingSpec` прибавились полифил `buffer`
      (61 kB) и семейство `es-abstract`/`get-intrinsic`. Шим `node-fetch` продолжает работать.
      **Требуется проверка в браузере** — мажорный переход рендерера AsyncAPI.
- [x] Обновлены остальные устаревшие пакеты до последних **совместимых** версий: `autoprefixer`
      10.4.21 → **10.5.6**, `globals` 15.15.0 → **17.12.0**, `rollup-plugin-visualizer` 5.14.0 →
      **7.1.1**, `@types/urijs` 1.19.25 → **1.19.26**, `@types/node` 20.19.4 → **22.20.2**,
      `@types/react` 18.3.23 → **18.3.31**. `@types/swagger-ui-react` (5.18.0) и `@types/js-yaml`
      (4.0.9) уже были последними — в списке устаревших они не появляются.
      Проверено: `TYPES_EXIT=0`, `LINT_EXIT=0`, `BUILD_EXIT=0`, `ANALYZE_EXIT=0`.
- [ ] **Важно: «поставить @latest» для тулинга сейчас невозможно — два пакета опережают экосистему.**
      `typescript@latest` — это уже **7.0.2**, а `@typescript-eslint` 8.70 объявляет
      `typescript >=4.8.4 <6.1.0`. `eslint@latest` — уже **10.10.0**, а `eslint-plugin-react` 7.37.5
      (последняя доступная версия) поддерживает максимум `^9.7`. Из-за этого
      `npm install ...@latest` падает с `ERESOLVE` и **откатывает транзакцию целиком** — не обновляется
      вообще ничего. Двигать эти два можно только когда плагины догонят мажоры; `--legacy-peer-deps`
      здесь не нужен и вреден.
- [x] `tailwindcss` 3.4.17 → **4.3.3**. Миграция оказалась минимальной, потому что Tailwind в проекте
      почти не используется: кастомный цвет `vtb-brand` и переопределение экрана `2xl: 1460px` из
      `tailwind.config.js` не применялись **нигде**, а все утилиты в проекте — это три класса в
      `LoadingSpec.tsx` (`mt-12`, `text-center`, `text-red-600`).
      Сделано: директивы `@tailwind base/components/utilities` → `@import "tailwindcss"`;
      `postcss.config.js` переведён на `@tailwindcss/postcss`; `autoprefixer` убран из пайплайна и из
      зависимостей (в v4 префиксы добавляет Lightning CSS); `tailwind.config.js` удалён — в v4 источники
      определяются автоматически.
      Проверено: автоопределение источников работает (все три утилиты присутствуют в собранном CSS),
      `TYPES_EXIT=0`, `LINT_EXIT=0`, `BUILD_EXIT=0`.
      Учесть: **`tailwind.config.js` больше нет** — если понадобятся токены темы, их место в CSS
      через `@theme`, а не в JS-конфиге.
- [x] **Найден и устранён баг упаковки `@asyncapi/react-component@3`.** Файл `styles/default.css`
      в пакете содержит 44 035 правил при ~371 уникальном — один и тот же CSS продублирован ~120 раз
      (4,6 МБ вместо 24 КБ). Мы импортировали именно его, и после апгрейда на v3 собранный CSS подскочил
      с 182 kB до **4 057 kB**. Исправлено переходом на `styles/default.min.css` в `src/index.tsx`:
      **4 057.92 kB (gzip 375.56) → 214.21 kB (gzip 33.65)**, правил стало 3 326.
      Важно: симптом выглядел как проблема Tailwind 4 (будто автоопределение источников подхватило
      лишнее), но селекторы вроде `.absolute--fill-ns` — это нормальное содержимое `swagger-ui.css`,
      а взрыв размера давал пакет AsyncAPI. Записан отдельный урок в память.

---

## Этап 3 — бизнес-фичи

Приоритет задан по ценности для «команды, описывающей API системы», и по близости к ключевой фишке
проекта (спека из кусков, переиспользуемые DTO).

### P0 — ядро
- [x] **Скачать / скопировать спеку целиком.** Реализовано без новых зависимостей: собственный
      резолвер в `src/helpers/specBundler.ts` + браузерная обёртка `src/helpers/specDownload.ts`
      + кнопки в `NavBarButtons.tsx` (ровно те заготовки, что были закомментированы).
      Как работает: внешние `$ref` (ссылки на другие файлы) рекурсивно раскрываются и подставляются
      по месту, внутренние (`#/components/...`) сознательно **сохраняются** — иначе документ раздулся бы,
      а рекурсивные схемы зациклились бы. Есть кэш загруженных файлов и защита от циклов: если ссылка
      уже разворачивается, она остаётся как есть. Формат берётся из расширения исходника
      (`.json` → JSON, иначе YAML), имя файла — `<сервис>-<openapi|asyncapi>-<версия>.yml|json`.
      Проверено на фикстурах проекта (двухуровневая цепочка `asyncapi.yml` → `messages/messages.yaml`
      → `model/ping.yaml`): внешних `$ref` осталось 0, `channels.ping.messages.ping.payload.properties
      .event.const` = `"ping"`, а 30 внутренних ссылок в `asyncapi-v3.yml` сохранены. Также проверены
      `openapi.json` и спека из подпапки `versions/` (корректная база для относительных ссылок).
      Цена — **+4.8 kB** в главном чанке (`index` 457.8 → **462.6 kB**).
      Проверено в браузере: файл скачивается и содержит весь документ целиком, копирование в буфер
      обмена работает.
      На будущее: выбор формата в UI (сейчас — по расширению исходника) и показ размера результата.
- [x] **Валидация спецификации.** Панель `src/components/ValidationPanel.tsx` вместо дампа
      `JSON.stringify(diagnostics)`, логика — `src/helpers/specValidation.ts`.
      Источники проблем разные, и это осознанно: для AsyncAPI берутся настоящие диагностики
      `@asyncapi/parser` (Spectral), для OpenAPI — собственные проверки, потому что лёгкого валидатора
      под рукой не было (`swagger-client` не поставляет типов, а тянуть `swagger-parser`/`redocly`
      только ради этого не хотелось).
      Проверки OpenAPI: наличие `openapi`/`swagger`, обязательный `info` с `title` и `version`,
      непустой `paths`, а также разрешимость каждой внутренней ссылки `#/...`.
      Ключевое решение: структура и внутренние ссылки валидируются на **исходном** документе, а не на
      собранном — после сборки `#/...` из внешних файлов указывают в свою область видимости и дали бы
      ложные ошибки. Битые **внешние** ссылки выявляются отдельным проходом через `bundleSpec`.
      Попутно исправлено: у `fromURL(parser, url).parse()` не было `.catch` — ошибка загрузки
      AsyncAPI-спеки давала необработанный reject вместо сообщения; теперь показывается в панели.
      Проверено в Node: на реальной спеке `public/test/openapi.json` (16 внутренних ссылок)
      ложных срабатываний нет; на намеренно битых документах — отсутствие `info`/`paths`, висячая
      внутренняя ссылка, битая внешняя ссылка (404 с именем файла), необъектный документ.
      Цена — **+5.5 kB** суммарно; общий чанк переименовался из `LoadingSpec` в `specValidation`
      (58,6 → 63,5 kB) — это тот же общий чанк, дублирования `js-yaml`/`buffer`/`lodash` нет,
      подтверждено разбором через `npm run analyze`.
      Для удобной проверки добавлены демо-фикстуры `public/test/broken/openapi.json` и
      `public/test/broken/asyncapi.yml` плюс сервис `broken` в `settings.yml` («Битые спеки (проверка
      валидации)»): в них заведомо нет `info.version`, есть висячие внутренние ссылки и ссылка на
      несуществующий файл, а у операции AsyncAPI отсутствует `channel`.
      **Требуется проверка в браузере.**
- [x] **Глобальный поиск** по всем сервисам, операциям и схемам. Без новых зависимостей: индексация —
      `src/helpers/specIndex.ts`, UI — `src/components/GlobalSearch.tsx` (поле в шапке).
      Индекс строится **лениво, при первом фокусе на поле поиска**, и кэшируется — иначе пришлось бы
      тянуть все спеки на старте приложения.
      Индексируется только **спека по умолчанию** каждой документации, а не все версии: версии одного
      сервиса почти идентичны, а фетчей было бы в разы больше.
      Что попадает в индекс: OpenAPI — операции (`METHOD path`, заголовок из `summary`/`operationId`)
      и схемы; AsyncAPI — каналы, операции, сообщения и схемы.
      Важно: у OpenAPI схемы берутся и из `components.schemas` (3.x), и из `definitions` (2.0) —
      демо-спека `public/test/openapi.json` как раз Swagger 2.0, без этой ветки поиск по схемам
      у неё бы не работал.
      Падающий сервис не ломает индекс: ошибки собираются в `skipped` и показываются отдельной строкой.
      Глубокие ссылки реализованы для OpenAPI: якорь `#/<tag>/<operationId>` — это ровно тот формат,
      который swagger-ui пишет сам. Формат не угадывался: он найден в его исходниках из source map
      (deep-linking plugin, `urlHashArrayFromIsShownKey`; обе части оборачиваются в `encodeURIComponent`;
      тег по умолчанию — `default` из `specSelectors.DEFAULT_TAG`). Нужен явный `operationId` — без него
      swagger-ui синтезирует id сам, и якорь не строится (тогда просто переход на страницу).
      У AsyncAPI якорей нет: компонент их не формирует — проверил поиском по его бандлу.
      Переход внутри уже открытой страницы потребовал отдельного решения: `navigate()` меняет хеш через
      `pushState`, который **не** порождает `hashchange`, а swagger-ui читает хеш **только при
      инициализации** — слова `hashchange` в его исходниках нет вообще. Поэтому поиск передаёт
      `state.jumpToken`, а `SwaggerPage` использует его как `key` у `SwaggerUI`: компонент
      переинициализируется и применяет якорь. Ключом по самому хешу делать нельзя — swagger-ui сам
      переписывает хеш при раскрытии операций, и каждый такой клик перемонтировал бы компонент.
      Проверено в Node на фикстурах: 76 записей (48 операций, 17 схем, 6 каналов, 5 сообщений),
      ни один сервис не пропущен, сервис без спек даёт 0 записей и не роняет индексацию, поиск по
      `pet` находит 22 совпадения, поиск по имени сервиса работает.
      `TYPES_EXIT=0`, `LINT_EXIT=0`, `BUILD_EXIT=0`.
      **Требуется проверка в браузере.**

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
