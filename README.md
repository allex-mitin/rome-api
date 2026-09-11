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
```

Демо-спецификации лежат в `public/test/` и используются конфигом по умолчанию.

## Конфигурация

Источник конфигурации — `settings.yml` (приоритет) или `settings.yaml` в корне сайта. Если YAML-файлы
недоступны, используется фолбэк `public/settings.js`, который выставляет `window.settings`.

```yaml
services:
  - path: "service1"          # сегмент URL: /service/service1
    name: Сервис1             # отображаемое имя
    openapi:
      url: /test/openapi.json # спецификация по умолчанию
    asyncapi:
      url: /test/asyncapi.yml
  - path: "service2"
    name: Сервис2
    openapi:
      urls:                   # несколько версий: /service/service2/openapi/0.0.1
        "0.0.1": "/test/versions/openapi-0.0.1.json"
        "0.0.2": "/test/versions/openapi-0.0.2.json"
    asyncapi:
      url: /test/asyncapi-v3.yml
  - path: "service3"
    name: Сервис3
```

Правила:

- `url` — спецификация по умолчанию (версия `default` в UI);
- `urls` — именованные версии, переключаются селектом версии;
- секцию `openapi` или `asyncapi` можно опустить — тогда сервис показывает только вторую спецификацию;
- если у сервиса нет ни одной спецификации, он всё равно появляется в навигации.

### Разбиение спецификации на файлы

Корневая спецификация может ссылаться на внешние файлы — это позволяет переиспользовать DTO:

```yaml
# asyncapi.yml
channels:
  ping:
    messages:
      ping:
        $ref: './messages/messages.yaml#/components/messages/MqMessage'
```

```yaml
# messages/messages.yaml
components:
  messages:
    MqMessage:
      $ref: '../model/ping.yaml#/components/messages/ping'
```

Для AsyncAPI внешние ссылки резолвит кастомный file-resolver (`src/components/AsyncApiContainer.tsx`).

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
  test/           Демо-спецификации (в т.ч. разбитые на файлы)
deploy/
  nginx.conf.example
```

## Лицензия

Apache-2.0
