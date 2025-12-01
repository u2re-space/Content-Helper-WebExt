import { MarkdownView } from "fest/fl-ui";
import "./viewer.scss";

console.log(MarkdownView);

const DEFAULT_STORAGE_KEY = "$cached-md$";

type Nullable<T> = T | null | undefined;

interface ViewerOptions {
    initialSrc?: Nullable<string>;
    storage?: Storage | null;
    storageKey?: string | null;
    enableDrop?: boolean;
    target?: HTMLElement | null;
    onFileDrop?: (file: File, objectUrl: string) => void;
}

interface ViewerController {
    readonly element: HTMLElement | null;
    readonly currentObjectURL: string | null;
    setSource(nextSrc: string): void;
    setMarkdown(markdown: string, mimeType?: string): void;
}

const toBlobUrl = (source: BlobPart, type = "text/markdown"): string => {
    return URL.createObjectURL(new Blob([source], { type }));
};

const isLikelyUrl = (text: string) => {
    try {
        const url = new URL(text);
        return ["http:", "https:"].includes(url.protocol);
    } catch {
        return false;
    }
};

function setupViewer(options: ViewerOptions = {}): ViewerController {
    const {
        target = document.querySelector<HTMLElement>("md-view"),
        storage = typeof localStorage !== "undefined" ? localStorage : null,
        storageKey = DEFAULT_STORAGE_KEY,
        enableDrop = true,
        initialSrc,
        onFileDrop,
    } = options;

    let objectUrl: string | null = null;

    const applySource = (src: Nullable<string>) => {
        const value = src?.trim?.();
        if (value) {
            target?.setAttribute("src", value);
        }
    };

    const setObjectUrl = (source: Blob | BlobPart, mimeType = "text/markdown", apply = true) => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = toBlobUrl(source, mimeType);
        if (apply) {
            applySource(objectUrl);
        }
        return objectUrl;
    };

    const existingAttribute = target?.getAttribute?.("src") ?? "";
    const cachedText = storageKey && storage ? storage.getItem(storageKey) ?? "" : "";
    if (initialSrc) {
        applySource(initialSrc);
    } else if (existingAttribute.trim()) {
        applySource(existingAttribute);
    } else if (cachedText) {
        objectUrl = setObjectUrl(cachedText, "text/plain");
    }

    if (enableDrop) {
        const zone = target ?? document.body;

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".md,.markdown,.txt,text/markdown,text/plain";
        fileInput.style.display = "none";
        document.body.appendChild(fileInput);

        fileInput.addEventListener("change", () => {
            const file = fileInput.files?.[0];
            if (!file) return;
            const url = setObjectUrl(file, file.type || "text/markdown");
            onFileDrop?.(file, url);
            fileInput.value = "";
        });

        zone.addEventListener("click", () => {
            const currentSrc = target?.getAttribute("src");
            if (!currentSrc || currentSrc.trim() === "") {
                fileInput.click();
            }
        });

        zone.addEventListener("dragover", (event) => event.preventDefault(), { passive: false });
        zone.addEventListener(
            "drop",
            (event) => {
                event.preventDefault();
                const file = (event as DragEvent).dataTransfer?.files?.item?.(0);
                if (!file) return;
                const url = setObjectUrl(file, file.type || "text/markdown");
                onFileDrop?.(file, url);
            },
            { passive: false },
        );

        document.addEventListener("paste", (event) => {
            const items = (event as ClipboardEvent).clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === "file") {
                    const file = items[i].getAsFile();
                    if (file) {
                        const url = setObjectUrl(file, file.type || "text/markdown");
                        onFileDrop?.(file, url);
                        return;
                    }
                }
            }

            const text = (event as ClipboardEvent).clipboardData?.getData("text");
            if (text) {
                if (isLikelyUrl(text)) {
                    applySource(text);
                } else {
                    setObjectUrl(text, "text/markdown");
                }
            }
        });
    }

    return {
        element: target ?? null,
        get currentObjectURL() {
            return objectUrl;
        },
        setSource(nextSrc: string) {
            applySource(nextSrc);
        },
        setMarkdown(markdown: string, mimeType = "text/markdown") {
            setObjectUrl(markdown, mimeType);
        },
    };
}

const params = new URL(window.location.href).searchParams;
const initialSrcParam = params.get("src");
const initialSrc = initialSrcParam ? decodeURIComponent(initialSrcParam) : undefined;

const viewer = setupViewer({ initialSrc });

if (typeof chrome !== "undefined" && chrome?.runtime?.id) {
    try {
        chrome.runtime.onMessage?.addListener?.((message: any, _sender: any, sendResponse: (payload?: unknown) => void) => {
            if (message?.markdown) {
                viewer.setMarkdown(message.markdown, message.mimeType ?? "text/markdown");
                sendResponse?.({ ok: true });
                return;
            }
            if (message?.src) {
                viewer.setSource(message.src);
                sendResponse?.({ ok: true });
            }
        });
    } catch (error) {
        console.warn("[markdown-view] Unable to attach chrome message listener", error);
    }
}

