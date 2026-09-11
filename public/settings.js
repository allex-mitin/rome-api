// Fallback configuration. It is used only when `settings.yml` / `settings.yaml`
// cannot be loaded (see src/helpers/index.ts). Keep it in sync with settings.yml.
window.settings = () => {
    return {
        // Брендирование шапки; ключи можно опускать — см. `src/helpers/branding.ts`.
        "branding": {
            "title": "Rome API",
            "subtitle": "View API documentation service"
        },
        // Настройки рендереров; ключи можно опускать — см. `src/helpers/rendererOptions.ts`.
        "renderers": {
            "openapi": {
                "docExpansion": "list",
                "filter": true,
                "deepLinking": true
            },
            "asyncapi": {
                "schemaID": "asyncapi"
            }
        },
        "services": [
            {
                "path": "single-file",
                "name": "Спека одним файлом",
                "openapi": {
                    "url": "/test/single-file/openapi.json"
                },
                "asyncapi": {
                    "url": "/test/single-file/asyncapi.yaml"
                }
            },
            {
                "path": "multi-file",
                "name": "Спека из нескольких файлов",
                "openapi": {
                    "url": "/test/multi-file/openapi.yaml"
                },
                "asyncapi": {
                    "url": "/test/multi-file/asyncapi.yaml"
                }
            },
            {
                "path": "versions",
                "name": "Версии спецификаций",
                "openapi": {
                    "urls": {
                        "0.0.1": "/test/versions/openapi-0.0.1.yaml",
                        "0.0.2": "/test/versions/openapi-0.0.2.yaml"
                    }
                },
                "asyncapi": {
                    "urls": {
                        "1.0.0": "/test/versions/asyncapi-1.0.0.yaml",
                        "2.0.0": "/test/versions/asyncapi-2.0.0.yaml"
                    }
                }
            },
            {
                "path": "invalid",
                "name": "Спеки с ошибками валидации",
                "openapi": {
                    "url": "/test/invalid/openapi.json"
                },
                "asyncapi": {
                    "url": "/test/invalid/asyncapi.yml"
                }
            },
            {
                "path": "missing",
                "name": "Спеки не существует (404)",
                "openapi": {
                    "url": "/test/missing/openapi.yaml"
                },
                "asyncapi": {
                    "url": "/test/missing/asyncapi.yaml"
                }
            },
            {
                "path": "openapi-only",
                "name": "Только OpenAPI",
                "openapi": {
                    "url": "/test/single-file/openapi.json"
                }
            },
            {
                "path": "asyncapi-only",
                "name": "Только AsyncAPI",
                "asyncapi": {
                    "url": "/test/single-file/asyncapi.yaml"
                }
            },
            {
                "path": "no-specs",
                "name": "Сервис без спек"
            }
        ]
    }
}
