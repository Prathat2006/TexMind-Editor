import React, { useState, useEffect, useRef } from 'react';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { Header } from './components/Header';
import { FixModal } from './components/FixModal';
import { analyzeAndFixLatex } from './services/geminiService';
import { quickFixLatexLocal } from './services/localFixService';
import { FixResult, EditorMode } from './types';

const STORAGE_KEY = 'texmind-editor-content';

const DEFAULT_CONTENT = `
# Welcome to TexMind
This is a Markdown editor with full **LaTeX** support.

> blockquote example: $E=mc^2$

- List item with math: $x^2$
- [ ] Task List

## LaTeX Examples

You can use inline math: $E = mc^2$.
Or alternative inline syntax: \\( a^2 + b^2 = c^2 \\).

Block math is also supported:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

Or using brackets:

\\[
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
\\]

## Broken LaTeX Example (Try "Quick Fix" or "Analyze")

This equation has an error (unclosed brace):
$$ f(x) = \\frac{1}{1 + e^{-x} $$ 

Click the **Quick Fix** button to auto-close delimiters, or **Analyze & Fix** for AI help!

`;

const App: React.FC = () => {
    // Initialize content from localStorage if available, otherwise use default
    const [content, setContent] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved !== null) {
                return saved;
            }
        }
        return DEFAULT_CONTENT;
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [fixResult, setFixResult] = useState<FixResult | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState<EditorMode>(EditorMode.SPLIT);
    const [syncScroll, setSyncScroll] = useState(false);

    // Scroll refs and locking mechanism
    const editorScrollRef = useRef<HTMLDivElement>(null);
    const previewScrollRef = useRef<HTMLDivElement>(null);
    const isScrolling = useRef<'editor' | 'preview' | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Persist content to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, content);
    }, [content]);

    // Responsive mode handling
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768 && mode === EditorMode.SPLIT) {
                setMode(EditorMode.EDIT);
            } else if (window.innerWidth >= 768 && mode !== EditorMode.SPLIT) {
                setMode(EditorMode.SPLIT);
            }
        };
        
        // Set initial
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [mode]);

    const handleFix = async () => {
        if (!content.trim()) return;
        
        setIsAnalyzing(true);
        try {
            const result = await analyzeAndFixLatex(content);
            setFixResult(result);
            setIsModalOpen(true);
        } catch (error) {
            alert("Failed to analyze content. Please check your API key and internet connection.");
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleQuickFix = () => {
        const fixed = quickFixLatexLocal(content);
        if (fixed !== content) {
            setContent(fixed);
        } else {
            // Optional: Feedback that nothing needed fixing
            alert("No unclosed delimiters found!");
        }
    };

    const applyFix = (newContent: string) => {
        setContent(newContent);
        setIsModalOpen(false);
        setFixResult(null);
    };

    const handleEditorScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!syncScroll || isScrolling.current === 'preview') return;

        isScrolling.current = 'editor';
        const editor = e.currentTarget;
        const preview = previewScrollRef.current;

        if (preview) {
            const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
            const targetScrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
            preview.scrollTop = targetScrollTop;
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            isScrolling.current = null;
        }, 50);
    };

    const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!syncScroll || isScrolling.current === 'editor') return;

        isScrolling.current = 'preview';
        const preview = e.currentTarget;
        const editor = editorScrollRef.current;

        if (editor) {
            const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
            const targetScrollTop = percentage * (editor.scrollHeight - editor.clientHeight);
            editor.scrollTop = targetScrollTop;
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            isScrolling.current = null;
        }, 50);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
            <Header 
                onFix={handleFix} 
                onQuickFix={handleQuickFix}
                isAnalyzing={isAnalyzing} 
                mode={mode}
                setMode={setMode}
                syncScroll={syncScroll}
                onToggleSyncScroll={() => setSyncScroll(!syncScroll)}
            />

            <main className="flex-1 flex overflow-hidden relative">
                {/* Editor Pane */}
                <div className={`
                    ${mode === EditorMode.SPLIT ? 'w-1/2' : 'w-full'} 
                    ${mode === EditorMode.PREVIEW ? 'hidden' : 'block'} 
                    h-full
                `}>
                    <Editor 
                        value={content} 
                        onChange={setContent} 
                        scrollRef={editorScrollRef}
                        onScroll={handleEditorScroll}
                    />
                </div>

                {/* Preview Pane */}
                <div className={`
                    ${mode === EditorMode.SPLIT ? 'w-1/2' : 'w-full'} 
                    ${mode === EditorMode.EDIT ? 'hidden' : 'block'} 
                    h-full
                `}>
                    <Preview 
                        content={content} 
                        scrollRef={previewScrollRef}
                        onScroll={handlePreviewScroll}
                    />
                </div>
            </main>

            <FixModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onApply={applyFix}
                result={fixResult}
            />
        </div>
    );
};

export default App;