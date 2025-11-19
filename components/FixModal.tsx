
import React from 'react';
import { FixResult } from '../types';
import { Button } from './Button';

interface FixModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (newContent: string) => void;
    result: FixResult | null;
}

export const FixModal: React.FC<FixModalProps> = ({ isOpen, onClose, onApply, result }) => {
    if (!isOpen || !result) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 transition-opacity duration-300">
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900/50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <span className="bg-indigo-500/20 text-indigo-400 p-1.5 rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </span>
                            AI Analysis Report
                        </h2>
                        <p className="text-slate-400 text-sm mt-1.5">Gemini has reviewed your document for syntax errors.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {result.issues.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white">No issues found!</h3>
                            <p className="text-slate-500 text-sm mt-1 max-w-xs">Your LaTeX syntax appears to be valid. Great job!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Issues List */}
                            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5">
                                <h3 className="text-red-400 font-semibold text-sm mb-3 flex items-center gap-2 uppercase tracking-wide">
                                    Detected Issues
                                </h3>
                                <ul className="space-y-2">
                                    {result.issues.map((issue, idx) => (
                                        <li key={idx} className="flex gap-3 text-slate-300 text-sm">
                                            <span className="text-red-500/50 mt-0.5">•</span>
                                            <span>{issue}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Fix Preview */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <h3 className="text-slate-300 font-semibold text-sm">Preview Correction</h3>
                                    <span className="text-xs text-slate-500">Scroll to review</span>
                                </div>
                                <div className="bg-[#0b101b] rounded-xl p-4 text-xs font-mono border border-slate-800 overflow-x-auto max-h-56 text-slate-300 leading-relaxed shadow-inner">
                                    {result.correctedMarkdown}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/30 rounded-b-2xl">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    {result.issues.length > 0 && (
                         <Button variant="primary" onClick={() => onApply(result.correctedMarkdown)}>
                            Apply Fixes
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
