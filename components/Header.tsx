
import React from 'react';
import { Button } from './Button';
import { EditorMode } from '../types';

interface HeaderProps {
    onFix: () => void;
    onQuickFix: () => void;
    isAnalyzing: boolean;
    mode: EditorMode;
    setMode: (mode: EditorMode) => void;
    syncScroll: boolean;
    onToggleSyncScroll: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    onFix, 
    onQuickFix,
    isAnalyzing, 
    mode, 
    setMode,
    syncScroll,
    onToggleSyncScroll
}) => {
    return (
        <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0 z-20 sticky top-0">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold font-serif italic shadow-lg shadow-indigo-500/20">
                    Tx
                </div>
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                    TexMind <span className="text-slate-500 font-normal">Editor</span>
                </h1>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
                {/* Mobile View Toggles */}
                <div className="flex md:hidden bg-slate-900 rounded-lg p-1 border border-slate-800">
                     <button 
                        onClick={() => setMode(EditorMode.EDIT)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === EditorMode.EDIT ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                        Edit
                    </button>
                     <button 
                        onClick={() => setMode(EditorMode.PREVIEW)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === EditorMode.PREVIEW ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                        Preview
                    </button>
                </div>

                <div className="h-5 w-px bg-slate-800 mx-1 hidden md:block"></div>

                {mode === EditorMode.SPLIT && (
                    <button
                        onClick={onToggleSyncScroll}
                        className={`p-2 rounded-md transition-all flex items-center gap-2 text-xs font-medium border ${
                            syncScroll 
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20' 
                            : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-800 hover:text-slate-300'
                        }`}
                        title={syncScroll ? "Disable Sync Scroll" : "Enable Sync Scroll"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span className="hidden sm:inline">{syncScroll ? 'Sync On' : 'Sync Off'}</span>
                    </button>
                )}

{/* 
                <div className="flex gap-2 items-center">
                    <Button
                        onClick={onQuickFix}
                        variant="secondary"
                        size="sm"
                        title="Quick syntax fix for unclosed delimiters"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                        }
                    >
                        Quick Fix
                    </Button>

                    <Button 
                        onClick={onFix} 
                        isLoading={isAnalyzing}
                        variant="primary"
                        size="sm"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        }
                    >
                        Analyze AI
                    </Button>
                </div> */}
            </div>
        </header>
    );
};
