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
      Подтверждено сборкой: `index` — 567 kB, `SwaggerPage` — 1 184 kB, `AsyncApiPage` — 5 005 kB.
- [ ] Урезать бандл: `AsyncApiPage` — 5 005 kB (gzip 1 086 kB), `SwaggerPage` — 1 184 kB.
      Основной подозреваемый — `vite-plugin-node-polyfills` (`fs, http, https, zlib, path, url,
      stream, util`); замерить визуализатором и оставить только реально нужное.
- [ ] Предзагрузка/кэш спек, `Cache-Control` для хешированных ассетов (частично в nginx-примере).
- [ ] Предупреждения сборки: `Use of eval` в `@asyncapi/react-component/browser` (внутри библиотеки),
      устаревшая база `caniuse-lite` (`npx update-browserslist-db@latest`), deprecated CJS-API Vite
      (снимется при апгрейде в Этапе 2).
- [ ] `npm audit`: 46 уязвимостей (8 low, 15 moderate, 20 high, 3 critical) — разобрать, что реально
      достижимо из клиентского кода.
- [~] `base` + относительные пути: `base` настраивается через `VITE_BASE_PATH`, роутер получил
      `basename: import.meta.env.BASE_URL`. Требуется проверить деплой в подпапку.

---

## Этап 2 — обновление версий

Обновлять по одному шагу, каждый раз прогоняя `types` / `lint` / `build` и проверяя рендер обеих спек.

- [ ] Vite 5 → 7.
- [ ] ESLint 8 (EOL) → 9 + flat config (в 9 удалён флаг `--ext`, придётся переписать скрипт `lint`).
- [ ] `react-router-dom` 6 → 7.
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
