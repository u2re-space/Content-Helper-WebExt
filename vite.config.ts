import { resolve } from "node:path";
import { crx, defineManifest } from "@crxjs/vite-plugin";
import manifest from "./src/manifest.json" with { type: "json" };
import { viteStaticCopy } from 'vite-plugin-static-copy';

export const __dirname = resolve(import.meta.dirname, "./");
const modulesRoot = resolve(__dirname, "../../modules/projects");
const flUiRoot = resolve(modulesRoot, "fl.ui/src");

export default {
    base: "./",
    plugins: [
        crx({
            manifest: defineManifest(manifest as any),
            contentScripts: {
                injectCss: true,
            },
        }),
        viteStaticCopy({
            targets: [{
                src: resolve(__dirname, './src/offscreen')?.replaceAll?.('\\', '/') + "/*",
                dest: 'src/offscreen/',
            }],
        }),
    ],
    resolve: {
        alias: [
            // fest/* aliases
            { find: "fest/core", replacement: resolve(modulesRoot, "core.ts/src/index.ts") },
            { find: "fest/dom", replacement: resolve(modulesRoot, "dom.ts/src/index.ts") },
            { find: "fest/object", replacement: resolve(modulesRoot, "object.ts/src/index.ts") },
            { find: "fest/lure", replacement: resolve(modulesRoot, "lur.e/src/index.ts") },
            { find: "fest/fl-ui", replacement: resolve(flUiRoot, "index.ts") },
            { find: "fest/veela", replacement: resolve(modulesRoot, "veela.css/src/index.ts") },
            { find: "fest/icon", replacement: resolve(modulesRoot, "icon.ts/src/index.ts") },
            { find: "fest/theme", replacement: resolve(modulesRoot, "fl.ui/src/theme/index.ts") },
            // fl-ui internal aliases
            { find: /^@fl-ui\/(.*)/, replacement: resolve(flUiRoot, "ui/$1") },
            { find: /^@fl-design\/(.*)/, replacement: resolve(flUiRoot, "design/$1") },
            { find: /^@fl-src\/(.*)/, replacement: resolve(flUiRoot, "$1") },
            // polyfill aliases
            { find: /^fest\/polyfill\/(.*)/, replacement: resolve(__dirname, "../../modules/shared/fest/polyfill/$1") },
            // veela aliases
            { find: "veela-lib", replacement: resolve(modulesRoot, "veela.css/src/scss/lib/index.scss") },
            { find: /^veela-lib\/(.*)/, replacement: resolve(modulesRoot, "veela.css/src/scss/lib/$1") },
        ],
    },
    server: {
        port: 5173,
        open: false,
        origin: "http://localhost:5173",
        fs: {
            allow: ['..', resolve(__dirname, '../'), resolve(__dirname, '../../modules')],
        },
    },
    build: {
        outDir: "dist",
        emptyOutDir: true,
        chunkSizeWarningLimit: 1600,
        assetsInlineLimit: 1024 * 1024,
        minify: false,
        sourcemap: "hidden",
        target: "esnext",
        rollupOptions: {
            input: {
                "markdown-viewer": resolve(__dirname, "src/markdown/viewer.html"),
            },
        },
    },
    css: {
        scss: {
            api: "modern",
        },
        preprocessorOptions: {
            scss: {},
        },
    },
};
