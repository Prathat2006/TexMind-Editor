import React, { useEffect, useRef, useState, useMemo } from 'react';
import Editor from 'react-simple-code-editor';

import { useLatexValidation } from './uselatexVaildator';

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
    scrollRef?: React.RefObject<HTMLDivElement | null>;
    onScroll?: React.UIEventHandler<HTMLDivElement>;
}

// Reusable patterns for nesting
const latexPatterns = {
    'latex-block': {
        pattern: /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/,
        alias: 'function',
        inside: {
            'punctuation': /^(\$\$|\\\[)|(\$\$|\\\])$/,
            'latex-warning': {
                pattern: /\\\\/,
                alias: 'latex-warning'
            }
        }
    },
    'latex-inline': {
        pattern: /(\$[^$\n]+\$|\\\([\s\S]*?\\\))/,
        alias: 'string',
        inside: {
            'punctuation': /^(\$|\\\()|(\$|\\\))$/
        }
    }
};

const inlinePatterns = {
    ...latexPatterns,
    'bold': {
        pattern: /(\*\*|__)(?:(?!\1).)+\1/,
        alias: 'important'
    },
    'italic': {
        pattern: /(\*|_)(?:(?!\1).)+\1/,
        alias: 'italic'
    },
    'url': {
        pattern: /\[.*?\]\(.*?\)/,
        alias: 'url'
    },
    'code-inline': {
        pattern: /`[^`\n]+`/,
        alias: 'keyword'
    }
};

const latexGrammar = {
    'header': {
        pattern: /^#+.*/m,
        alias: 'keyword'
    },
    'blockquote': {
        pattern: /^>[\s\S]*?$/m,
        alias: 'punctuation',
        inside: {
            'punctuation': /^>/,
            ...inlinePatterns
        }
    },
    'list': {
        pattern: /^[\t ]*([-*+]|\d+\.)[ \t].+/m,
        alias: 'punctuation',
        inside: {
            'punctuation': /^[\t ]*([-*+]|\d+\.)/,
            ...inlinePatterns
        }
    },
    'table': {
        pattern: /^\|[^\n]+\|$/m,
        inside: {
            'punctuation': /\|/,
            ...inlinePatterns
        }
    },
    'hr': {
        pattern: /^(---|\*\*\*|___)$/m,
        alias: 'comment'
    },
    'latex-error': {
        pattern: /(\$\$|\\\[)[\s\S]*$/,
        alias: 'latex-error'
    },
    ...inlinePatterns
};

export const EditorComponent: React.FC<EditorProps> = ({ value, onChange, scrollRef, onScroll }) => {
    // ➜ Real latex validation hook
    const issues = useLatexValidation(value);

    // Ref to the element that contains the Editor (so we can find the textarea)
    const editorContainerRef = useRef<HTMLDivElement | null>(null);

    // Panel open/collapsed state and dragging
    const [panelOpen, setPanelOpen] = useState(true);
    const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const panelRef = useRef<HTMLDivElement>(null);

    // Calculate line numbers
    const lineCount = useMemo(() => value.split('\n').length, [value]);
    const lineNumbers = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);

    // Helper: compute approximate line height from the rendered editor
    const getLineHeight = (): number => {
        const container = editorContainerRef.current;
        let textarea = container?.querySelector('textarea') as HTMLTextAreaElement | null;
        if (!textarea) textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
        if (!textarea) return 20;

        const style = window.getComputedStyle(textarea);
        let lineHeight = parseFloat(style.lineHeight || '0');
        if (!lineHeight || isNaN(lineHeight)) lineHeight = 20;
        return lineHeight;
    };

    // Jump to an issue in the editor: focus textarea, select range, and scroll the outer scrollRef
    const gotoIssue = (issue: any) => {
        try {
            const container = editorContainerRef.current;
            let textarea = container?.querySelector('textarea') as HTMLTextAreaElement | null;
            if (!textarea) textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
            if (!textarea) return;

            const start = Math.max(0, Math.min(value.length, Number(issue.start) || 0));
            const end = Math.max(start, Math.min(value.length, Number(issue.end) || start));

            textarea.focus();
            // Set selection to highlight the whole expression
            try { textarea.setSelectionRange(start, end); } catch (e) { /* ignore */ }

            // Compute line index and position for scrolling
            const before = value.slice(0, start);
            const lineIndex = before.split('\n').length - 1;
            const lastNewline = before.lastIndexOf('\n');
            const column = start - (lastNewline + 1);

            // Get line height for scroll calculation
            const lineHeight = getLineHeight();

            // Scroll the outer container (scrollRef) to show the target line
            // The outer container scrolls vertically; we need to position the line center on screen
            if (scrollRef && (scrollRef as any).current) {
                const scrollContainer = (scrollRef as any).current;
                // Target position: line * lineHeight, centered in viewport
                const targetScrollTop = Math.max(0, lineIndex * lineHeight - scrollContainer.clientHeight / 2 + lineHeight / 2);
                scrollContainer.scrollTop = targetScrollTop;

                // Optionally scroll horizontally (approximate)
                const charWidth = 8;
                scrollContainer.scrollLeft = Math.max(0, column * charWidth - 60);
            }
        } catch (err) {
            // swallow any runtime errors for robustness
            console.error('gotoIssue failed', err);
        }
    };

    // Drag handlers for minimized panel circle
    const dragStartPos = useRef<{ x: number; y: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (panelOpen) return; // Only drag when minimized
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        const panel = panelRef.current;
        if (panel) {
            const rect = panel.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    useEffect(() => {
        if (!dragStartPos.current) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!dragStartPos.current) return;
            const dx = e.clientX - dragStartPos.current.x;
            const dy = e.clientY - dragStartPos.current.y;
            // Only start dragging if mouse moved more than 5px
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                setIsDragging(true);
                if (panelRef.current) {
                    const newX = e.clientX - dragOffset.x;
                    const newY = e.clientY - dragOffset.y;
                    setPanelPos({ x: newX, y: newY });
                }
            }
        };

        const handleMouseUp = () => {
            // If barely moved, treat as click and open panel
            if (!isDragging && dragStartPos.current) {
                setPanelOpen(true);
            }
            setIsDragging(false);
            dragStartPos.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    // Prism highlighting with manual markdown styling
    const highlight = (code: string) => {
        try {
            // Escape HTML
            let html = code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            // Apply markdown syntax highlighting with VS Code One Dark Pro colors
            
            // Headers
            html = html.replace(
                /^(#{1,6})\s+(.+?)$/gm,
                '<span class="token title">$1 $2</span>'
            );

            // Blockquote
            html = html.replace(
                /^(&gt;.*)$/gm,
                '<span class="token blockquote">$1</span>'
            );

            // Code block
            html = html.replace(
                /```([\s\S]*?)```/g,
                '<span class="token code-block">```$1```</span>'
            );

            // Inline code
            html = html.replace(
                /`([^`\n]+)`/g,
                '<span class="token code">`$1`</span>'
            );

            // LaTeX block
            html = html.replace(
                /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g,
                '<span class="token function">$1</span>'
            );

            // LaTeX inline
            html = html.replace(
                /(\$[^$\n]+\$|\\\([^\)]+\))/g,
                '<span class="token string">$1</span>'
            );

            // Bold
            html = html.replace(
                /\*\*([^\*]+?)\*\*|__([^_]+?)__/g,
                '<span class="token important">$&</span>'
            );

            // Italic
            html = html.replace(
                /(?<!\*)\*(?!\*)([^\*\n]+?)\*(?!\*)|(?<!_)_(?!_)([^_\n]+?)_(?!_)/g,
                '<span class="token emphasis">$&</span>'
            );

            // Lists
            html = html.replace(
                /^([\s]*[-*+]\s+.*)$/gm,
                '<span class="token list">$1</span>'
            );

            html = html.replace(
                /^(\d+\.\s+.*)$/gm,
                '<span class="token list">$1</span>'
            );

            // URLs
            html = html.replace(
                /\[([^\]]+)\]\(([^\)]+)\)/g,
                '<span class="token url">[$1]($2)</span>'
            );

            // Add decorations for LaTeX issues (errors/warnings)
            if (issues && issues.length > 0) {
                const sorted = [...issues].sort((a, b) => b.start - a.start);
                sorted.forEach((issue, idx) => {
                    const cls = issue.type === 'error' ? 'latex-issue-error' : 'latex-issue-warning';
                    const title = (issue.message || '').replace(/"/g, '&quot;');
                    
                    // Find and wrap the issue's raw expression in the HTML
                    const escaped = issue.raw
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                    
                    const regex = new RegExp(
                        `(<span class="token [^"]*">)?${escaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(</span>)?`,
                        'g'
                    );
                    
                    html = html.replace(regex, `<span class="${cls}" title="${title}">$&</span>`);
                });
            }

            return html;
        } catch (err) {
            return code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }
    };

    return (
        <div className="h-full w-full bg-[#0d1117] flex flex-col relative">
            {/* Editor Scroll Container */}
            <div
                ref={scrollRef}
                onScroll={onScroll}
                className="flex-1 overflow-auto relative cursor-text"
                onClick={(e) => {
                    // Focus editor when clicking in the blank space
                    const target = e.target as HTMLElement;
                    if (target === e.currentTarget || target.classList.contains('flex')) {
                        const textarea = editorContainerRef.current?.querySelector('textarea');
                        if (textarea) textarea.focus();
                    }
                }}
            >
                {/* Flex container for Gutter + Code */}
                <div className="flex min-h-full min-w-full w-max">
                    {/* Gutter / Line Numbers */}
                    <div 
                        className="sticky left-0 z-10 bg-[#0d1117] border-r border-slate-800/50 text-slate-600 text-right select-none pt-6 pb-6 pl-4 pr-4 code-font flex flex-col"
                        style={{ minHeight: '100%' }}
                        aria-hidden="true"
                    >
                        {lineNumbers.map(n => (
                             <div key={n}>{n}</div>
                        ))}
                    </div>

                    {/* Code Editor Area */}
                    <div ref={editorContainerRef} className="flex-1 relative">
                        <Editor
                            value={value}
                            onValueChange={onChange}
                            highlight={highlight}
                            padding={24} // Matches the pt-6 (24px) of the gutter for perfect alignment
                            className="prism-editor code-font"
                            textareaClassName="focus:outline-none"
                            style={{
                                minHeight: '100%',
                                overflow: 'hidden',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* LaTeX Error Panel HUD */}
            {issues.length > 0 && (
                <div
                    ref={panelRef}
                    className={`absolute z-30 transition-all duration-300 ${
                        panelOpen
                            ? 'bottom-6 right-6 rounded-2xl w-80 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl bg-slate-900/80'
                            : 'rounded-full shadow-xl w-12 h-12 flex items-center justify-center bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:scale-105 cursor-grab'
                    }`}
                    style={
                        panelOpen
                            ? {}
                            : {
                                  left: `${panelPos.x}px`,
                                  top: `${panelPos.y}px`,
                                  userSelect: isDragging ? 'none' : 'auto',
                                  cursor: isDragging ? 'grabbing' : 'grab',
                              }
                    }
                    onMouseDown={(e) => {
                        handleMouseDown(e);
                    }}
                >
                    {panelOpen ? (
                        <>
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/10">
                                        <span className="text-red-400 font-bold text-xs">TeX</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-200 text-sm leading-none">Issues Detected</span>
                                        <span className="text-slate-500 text-[10px] mt-0.5 font-medium uppercase tracking-wide">
                                            {issues.length} Total &bull; {issues.filter(i => i.type === 'error').length} Errors
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setPanelOpen(false)}
                                    className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors"
                                    title="Minimize"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-2 max-h-72 overflow-y-auto custom-scrollbar space-y-1">
                                {issues.map((issue, i) => (
                                    <div
                                        key={i}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => gotoIssue(issue)}
                                        className="group p-3 rounded-xl bg-transparent hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${issue.type === 'error' ? 'bg-red-500' : 'bg-amber-400'}`}></span>
                                                    <code className="font-mono text-xs text-indigo-300 truncate bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                                        {issue.raw.substring(0, 24)}{issue.raw.length > 24 ? '...' : ''}
                                                    </code>
                                                </div>
                                                <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 group-hover:text-slate-300">
                                                    {issue.message}
                                                </p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-4 py-2 bg-slate-950/50 rounded-b-2xl border-t border-white/5 flex justify-center">
                                <span className="text-[10px] text-slate-600 font-medium">Click an issue to jump to code</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-0.5 relative">
                            <div className="text-center font-bold text-red-400 text-xs">{issues.filter(i => i.type === 'error').length}</div>
                             <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                /* Custom Scrollbar for Panel */
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

                /* Editor Theme Overrides */
                .token.title { color: #fbbf24; font-weight: 700; }
                .token.function { color: #22d3ee; } 
                .token.keyword { color: #c084fc; }
                .token.string { color: #a5f3fc; }
                .token.comment { color: #64748b; font-style: italic; }
                .token.punctuation { color: #94a3b8; }
                
                .latex-issue-error { background: rgba(248,113,113,0.15); border-bottom: 2px solid #f87171; }
                .latex-issue-warning { background: rgba(251,191,36,0.15); border-bottom: 2px dashed #fbbf24; }
            `}</style>
        </div>
    );
};

export { EditorComponent as Editor };