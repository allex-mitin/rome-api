interface Settings{
    services: [Service]
}

interface Service {
    path: string,
    name: string,
    openapi: Spec,
    asyncapi: Spec
}

interface Spec {
    url: string,
    urls: Map<string, string>
}


