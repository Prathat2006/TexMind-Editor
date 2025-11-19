
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import "./PatchKatex";


interface PreviewProps {
    content: string;
    scrollRef?: React.RefObject<HTMLDivElement | null>;
    onScroll?: React.UIEventHandler<HTMLDivElement>;
}

export const Preview: React.FC<PreviewProps> = ({ content, scrollRef, onScroll }) => {
    
    // Preprocess to ensure \[ and \( are handled if remark-math is strict
    const processedContent = useMemo(() => {
        let text = content;
        text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, equation) => `$$${equation}$$`);
        text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, equation) => `$${equation}$`);
        return text;
    }, [content]);

    return (
        <div className="h-full w-full bg-slate-950 flex flex-col border-l border-white/5 relative">
            {/* Subtle grain or pattern could go here */}
            <div 
                ref={scrollRef}
                onScroll={onScroll}
                className="flex-1 overflow-y-auto p-8 md:p-12 markdown-body custom-scrollbar"
            >
                <div className="max-w-3xl mx-auto">
                    <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                    >
                        {processedContent}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};
