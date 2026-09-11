# RomeAPI

Лёгкий веб-компонент для просмотра **OpenAPI** и **AsyncAPI** спецификаций нескольких сервисов.

Работает по принципу `swagger-ui dist`: собирается в статику, кладётся в nginx, рядом кладутся файлы
спецификаций — и всё это отображает документацию по API системы. Отличие от `swagger-ui dist` — поддержка
**AsyncAPI** «из коробки» и работа со спецификацией, **разбитой на отдельные файлы** (общие DTO через `$ref`).

## Стек

- React 18 + TypeScript
- Vite 5
- `react-router-dom` (loaders, `createBrowserRouter`)
- `@admiral-ds/react-ui` + `styled-components` + Tailwind
- `swagger-ui-react` — рендер OpenAPI
- `@asyncapi/react-component` + `@asyncapi/parser` — рендер AsyncAPI

## Быстрый старт

```bash
nvm use            # версия Node зафиксирована в .nvmrc
npm install
npm start          # dev-сервер на http://localhost:3000
```

Проверки:

```bash
npm run types      # tsc, проверка типов
npm run lint       # ESLint
npm run lint:fix
npm run build      # сборка в ./build
npm run preview    # локальный просмотр собранной статики
npm run analyze    # прод-сборка + отчёт о бандле (build/stats.html и stats.json)
```

`npm run analyze` печатает разбивку бандла по чанкам и пакетам — им и надо проверять,
не вырос ли бандл после очередной зависимости.

### Про `overrides` в package.json

В `package.json` есть секция `overrides` для `js-yaml` и `lodash`. Она нужна, чтобы обойти
жёсткие пины зависимостей на уязвимые версии: `swagger-ui` требует `js-yaml` ровно `=4.3.1`, а
`@stoplight/*` тянут `lodash@4.17.23`.
**Не убирать без перепроверки `npm audit`** — иначе уязвимые версии вернутся в дерево.
Если `swagger-ui` в будущем ослабит пин, `overrides` можно будет удалить.

### Демо-фикстуры

Демо-спецификации лежат в `public/test/` и разложены по сценариям — каждому соответствует сервис
в `settings.yml`:

| Путь | Сценарий | Сервис |
| --- | --- | --- |
| `test/single-file/` | спецификация одним файлом: Petstore (OpenAPI 2.0, JSON) и Streetlights (AsyncAPI 3.0, YAML), внешних `$ref` нет | `single-file` |
| `test/multi-file/` | спецификация из кусков: корневые `openapi.yaml`/`asyncapi.yaml` ссылаются на `schemas/` и `messages/`, а те — на общий `model/ping.yaml` | `multi-file` |
| `test/versions/` | несколько версий: `openapi-0.0.1`/`0.0.2` и `asyncapi-1.0.0`/`2.0.0`; обе версии OpenAPI переиспользуют общие схемы из `multi-file/schemas/` | `versions` |
| `test/invalid/` | заведомо битые документы для панели валидации: нет `info.version`, висячие внутренние ссылки, ссылка на несуществующий файл, операция AsyncAPI без `channel` | `invalid` |
| `test/missing/` | несуществующая спецификация — каталога на диске **нет намеренно**, иначе сценарий перестанет воспроизводиться | `missing` |

Для последнего сценария важно, что файла действительно нет: dev-сервер (и nginx с SPA-фолбэком на все
пути) отвечает на такой URL `index.html` с кодом 200, поэтому приложение проверяет ответ само и пишет в
панель, что вместо спецификации отдана HTML-страница (`isHtmlPage` в `src/helpers/specBundler.ts`).

## Конфигурация

Источник конфигурации — `settings.yml` (приоритет) или `settings.yaml` в корне сайта. Если YAML-файлы
недоступны, используется фолбэк `public/settings.js`, который выставляет `window.settings`.

```yaml
services:
  - path: "single-file"          # сегмент URL: /service/single-file
    name: Спека одним файлом     # отображаемое имя
    openapi:
      url: /test/single-file/openapi.json # спецификация по умолчанию
    asyncapi:
      url: /test/single-file/asyncapi.yaml
  - path: "versions"
    name: Версии спецификаций
    openapi:
      urls:                   # несколько версий: /service/versions/openapi/0.0.1
        "0.0.1": "/test/versions/openapi-0.0.1.yaml"
        "0.0.2": "/test/versions/openapi-0.0.2.yaml"
    asyncapi:
      urls:
        "1.0.0": "/test/versions/asyncapi-1.0.0.yaml"
        "2.0.0": "/test/versions/asyncapi-2.0.0.yaml"
  - path: "no-specs"
    name: Сервис без спек
```

Правила:

- `url` — спецификация по умолчанию (версия `default` в UI);
- `urls` — именованные версии, переключаются селектом версии;
- секцию `openapi` или `asyncapi` можно опустить — тогда сервис показывает только вторую спецификацию;
- если у сервиса нет ни одной спецификации, он всё равно появляется в навигации.

### Разбиение спецификации на файлы

Корневая спецификация может ссылаться на внешние файлы — это позволяет переиспользовать DTO.
Цепочка может быть вложенной: корень → файл с описаниями → файл с DTO.

```yaml
# multi-file/asyncapi.yaml
channels:
  ping:
    address: /ping
    messages:
      ping:
        $ref: './messages/messages.yaml#/components/messages/ping'
```

```yaml
# multi-file/messages/messages.yaml
components:
  messages:
    ping:
      name: ping
      payload:
        $ref: '../model/ping.yaml#/components/schemas/Ping'
```

OpenAPI разбивается так же — `multi-file/openapi.yaml` держит операции у себя, а схемы берёт из
`schemas/*.yaml`. Для AsyncAPI внешние ссылки резолвит кастомный file-resolver
(`src/components/AsyncApiContainer.tsx`), для OpenAPI — сам `swagger-ui`. Кнопка «Скачать» собирает
такой документ в один файл (`src/helpers/specBundler.ts`).

## Деплой

```bash
npm run build       # результат в ./build
```

Содержимое `build/` кладётся в корень nginx-сайта, туда же — `settings.yml` и файлы спецификаций.
Пример конфигурации nginx: [`deploy/nginx.conf.example`](deploy/nginx.conf.example).

> **Важно:** роутинг использует `createBrowserRouter` и «настоящие» пути (`/service/:serviceName/...`),
> поэтому в nginx обязателен SPA-фолбэк `try_files $uri $uri/ /index.html`. Без него прямой переход
> по ссылке или перезагрузка страницы вернёт 404.

## Структура проекта

```
src/
  components/     UI-компоненты (Layout, Header, Navigator, NavBar, ...)
  pages/          Страницы роутов: Welcome, Swagger, AsyncApi, Error
  helpers/        Загрузка настроек и резолв спецификаций
  models/         Перечисления (DocumentationType)
  types.ts        Типы конфигурации (Settings, Service, Spec)
public/
  settings.js     Фолбэк-конфигурация
  settings.yml    Демо-конфигурация
  test/           Демо-спецификации по сценариям (см. «Демо-фикстуры»):
    single-file/    спецификация одним файлом
    multi-file/     спецификация из кусков ($ref на схемы и сообщения)
    versions/       несколько версий, переиспользующих общие файлы
    invalid/        документы с ошибками валидации
deploy/
  nginx.conf.example
```

## Лицензия

Apache-2.0
