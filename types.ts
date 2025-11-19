export interface FixResult {
    issues: string[];
    correctedMarkdown: string;
}

export enum EditorMode {
    EDIT = 'EDIT',
    PREVIEW = 'PREVIEW',
    SPLIT = 'SPLIT'
}