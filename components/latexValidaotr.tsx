import katex from "katex";
import { katexWarningsBuffer, normalizeTex } from "./PatchKatex";

export interface LatexIssue {
    expr: string;           // expression content without delimiters
    raw: string;            // original substring including delimiters ($$, $, \[, \], etc)
    start: number;          // start index in the source markdown
    end: number;            // end index (exclusive) in the source markdown
    type: "error" | "warning";
    message: string;
}

/**
 * Validate a single LaTeX expression.
 * Captures both KaTeX errors AND strict-mode warnings.
 */
/**
 * Validate a single LaTeX expression (content without delimiters).
 * Returns only issues (errors/warnings) for this expression.
 * The caller will attach positional metadata (raw/start/end).
 */
export function validateLatex(expr: string): { type: "error" | "warning"; message: string }[] {
    const issues: { type: "error" | "warning"; message: string }[] = [];

    try {
        // Render with throwOnError=true so KaTeX will throw on fatal errors and we can capture them.
        katex.renderToString(expr, {
            throwOnError: true,
            strict: () => "warn",
        });
    } catch (err: any) {
        issues.push({
            type: "error",
            message: err?.message || String(err) || "Invalid LaTeX",
        });
    }

    // Collect warnings emitted anywhere for this expression (use normalized form for robust matching)
    const norm = normalizeTex(expr);
    const matches = katexWarningsBuffer.filter((w) => w.norm === norm);
    if (matches.length) {
        // Remove matched warnings from the buffer so they are not reported repeatedly
        for (let i = katexWarningsBuffer.length - 1; i >= 0; i--) {
            if (katexWarningsBuffer[i].norm === norm) katexWarningsBuffer.splice(i, 1);
        }

        matches.forEach((w) => issues.push({ type: "warning", message: w.message }));
    }

    return issues;
}

/**
 * Extract inline + block LaTeX from Markdown.
 */
/**
 * Extract inline + block LaTeX from Markdown with positions.
 * Returns array of objects with raw substring, content (expr), and start/end offsets.
 */
export function extractLatex(markdown: string): { raw: string; expr: string; start: number; end: number }[] {
    const results: { raw: string; expr: string; start: number; end: number }[] = [];

    // Match $$...$$, \[...\], \(...\) and $...$
    const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\n]+\$)/g;
    let m: RegExpExecArray | null;

    while ((m = regex.exec(markdown)) !== null) {
        const raw = m[0];
        const start = m.index;
        const end = start + raw.length;
        const expr = raw
            .replace(/^\$\$|\$\$$/g, "")
            .replace(/^\$|\$$/g, "")
            .replace(/^\\\[|\\\]$/g, "")
            .replace(/^\\\(|\\\)$/g, "");

        results.push({ raw, expr, start, end });
    }

    return results;
}

/**
 * Get all LaTeX issues for the entire markdown string.
 */
export function findLatexIssues(markdown: string): LatexIssue[] {
    const expressions = extractLatex(markdown);
    const issues: LatexIssue[] = [];

    expressions.forEach(({ raw, expr, start, end }) => {
        const res = validateLatex(expr);
        res.forEach((r) => {
            issues.push({
                expr,
                raw,
                start,
                end,
                type: r.type,
                message: r.message,
            });
        });
    });

    return issues;
}
