import katex from "katex";

// Helper to normalize TeX strings for reliable matching: trim and collapse whitespace.
export function normalizeTex(s: string) {
    return (s || "").replace(/\s+/g, " ").trim();
}

// All warnings emitted anywhere. Each entry records the original expression, a
// normalized form for matching, and the message so consumers can associate warnings
// with the source TeX string.
export const katexWarningsBuffer: { expr: string; norm: string; message: string }[] = [];

// Wrap a function to intercept strict-mode warnings
function wrapRenderer(fnName: keyof typeof katex) {
    const original = (katex as any)[fnName];

    if (typeof original !== "function") return;

    (katex as any)[fnName] = function (...args: any[]) {
        const optionsIndex = fnName === "render" ? 2 : 1;

        // Extract options or fallback
        const options = args[optionsIndex] || {};

        const warnings: string[] = [];

        const strict = (msg: string) => {
            warnings.push(msg);
            return "warn";
        };


        // Replace options with strict override (do NOT force throwOnError here so callers
        // that want errors to throw can still do so).
        args[optionsIndex] = {
            ...options,
            strict,
        };

        const result = original.apply(this, args);

        // Store warnings into global buffer along with the expression argument when available
        const exprArg = typeof args[0] === 'string' ? args[0] : '';
        const norm = normalizeTex(exprArg);
        warnings.forEach((w) => katexWarningsBuffer.push({ expr: exprArg, norm, message: w }));

        return result;
    };
}

// Patch EVERY renderer KaTeX exposes
[
    "render",
    "renderToString",
    "renderToDomTree",
    "renderToHtmlTree",
    "__renderToDomTree",
    "__renderToString",       // exists in some builds
].forEach(wrapRenderer);
