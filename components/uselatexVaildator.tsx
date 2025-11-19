import { useEffect, useState } from "react";
import { findLatexIssues, LatexIssue } from "./latexValidaotr";

export function useLatexValidation(markdown: string) {
    const [issues, setIssues] = useState<LatexIssue[]>([]);

    useEffect(() => {
        setIssues(findLatexIssues(markdown));
    }, [markdown]);

    return issues;
}
