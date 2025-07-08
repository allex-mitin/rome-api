window.settings = () => {
    return {
        "services": [
            {
                "path": "service1",
                "name": "Сервис 1",
                "openapi": {
                    "url": "/test/openapi.json",
                    "urls": {
                        "0.0.1": "/test/0.0.1/openapi.json",
                        "0.0.2": "/test/0.0.2/openapi.json"
                    }
                },
                "asyncapi": {
                    "url": "/test/asyncapi.yml"
                }
            },
            {
                "path": "service2",
                "name": "Сервис 2",
                "openapi": {
                    "url": "/test/openapi.json"
                },
                "asyncapi": {
                    "url": "/test/asyncapi.yml"
                }
            },
            {
                "path": "service3",
                "name": "Сервис 3",
                "openapi": {
                    "url": "/test/openapi.json"
                }
            },
            {
                "path": "service4",
                "name": "Сервис 4",
                "asyncapi": {
                    "url": "/test/asyncapi.yml"
                }
            },
            {
                "path": "service5",
                "name": "Сервис 5"
            },
            {
                "path": "service6",
                "name": "Сервис c очень длинным именем и названием"
            }
        ]
    }
}
