import { bundleSpec, serializeSpec, type SpecFormat } from './specBundler';

export interface SpecTarget {
    service: string;
    documentation: string;
    version?: string;
    url: string;
}

export interface BuiltSpecFile {
    text: string;
    format: SpecFormat;
}

const MIME: Record<SpecFormat, string> = {
    json: 'application/json',
    yaml: 'application/yaml',
};

const fileExtension = (format: SpecFormat) => (format === 'json' ? 'json' : 'yml');

export const specFileName = ({ service, documentation, version }: SpecTarget, format: SpecFormat): string =>
    `${[service, documentation, version].filter(Boolean).join('-')}.${fileExtension(format)}`;

/** Fetches the spec together with every file it references and returns one self-contained document. */
export const buildSpecFile = async (url: string): Promise<BuiltSpecFile> => {
    // Relative `$ref`s are resolved against the root URL, so it has to be absolute.
    const { document, format } = await bundleSpec(new URL(url, window.location.origin).toString());
    return { text: serializeSpec(document, format), format };
};

export const downloadSpecFile = (target: SpecTarget, file: BuiltSpecFile): void => {
    const blob = new Blob([file.text], { type: MIME[file.format] });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = specFileName(target, file.format);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
};

export const copySpecFile = async (file: BuiltSpecFile): Promise<void> => {
    await navigator.clipboard.writeText(file.text);
};
