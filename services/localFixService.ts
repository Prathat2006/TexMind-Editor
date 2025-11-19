
/**
 * Heuristic based LaTeX fixer.
 * Scans for mismatched delimiters and attempts to close them.
 */
export const quickFixLatexLocal = (content: string): string => {
    let fixed = content;
    const issues: string[] = [];

    // --- STEP 1: Close unclosed Global Blocks (at the end of the file) ---

    // Check for unclosed block Math $$
    // We count chunks of $$ to see if the last one is open
    const doubleDollarCount = (fixed.match(/\$\$/g) || []).length;
    if (doubleDollarCount % 2 !== 0) {
        fixed += "\n$$";
    }

    // Check for unclosed \[
    const openSquareMath = (fixed.match(/\\\[/g) || []).length;
    const closeSquareMath = (fixed.match(/\\\]/g) || []).length;
    if (openSquareMath > closeSquareMath) {
        const diff = openSquareMath - closeSquareMath;
        for (let i = 0; i < diff; i++) {
            fixed += "\n\\]";
        }
    }

    // Check for unclosed \(
    const openParenMath = (fixed.match(/\\\(/g) || []).length;
    const closeParenMath = (fixed.match(/\\\)/g) || []).length;
    if (openParenMath > closeParenMath) {
        const diff = openParenMath - closeParenMath;
        for (let i = 0; i < diff; i++) {
            fixed += "\\)";
        }
    }

    // --- STEP 2: Fix Internal Syntax inside Blocks (Braces/Parens) ---
    
    // Function to balance braces inside a string fragment
    const balanceFragment = (text: string): string => {
        let balanced = text;
        
        // Balance Curly Braces {}
        const openBrace = (balanced.match(/\{/g) || []).length;
        const closeBrace = (balanced.match(/\}/g) || []).length;
        if (openBrace > closeBrace) {
            balanced += "}".repeat(openBrace - closeBrace);
        }

        // Balance Parentheses ()
        const openParen = (balanced.match(/\(/g) || []).length;
        const closeParen = (balanced.match(/\)/g) || []).length;
        if (openParen > closeParen) {
            balanced += ")".repeat(openParen - closeParen);
        }
        
        return balanced;
    };

    // Regex to find complete $$ ... $$ blocks
    fixed = fixed.replace(/(\$\$)([\s\S]*?)(\$\$)/g, (match, start, inner, end) => {
        const balancedInner = balanceFragment(inner);
        return start + balancedInner + end;
    });

    // Regex to find complete \[ ... \] blocks
    fixed = fixed.replace(/(\\\[)([\s\S]*?)(\\\])/g, (match, start, inner, end) => {
        const balancedInner = balanceFragment(inner);
        return start + balancedInner + end;
    });

    // --- STEP 3: Fix Structure Warnings (newlines in display mode) ---

    const fixAligned = (text: string) => {
        // If content has \\ (newline) but no environment starter like \begin{...}
        // We assume user wants multiline math (aligned)
        // We use a rough check for \\ inside the block. 
        // The regex checks for literal backslash followed by literal backslash.
        if (text.includes('\\\\') && !text.includes('\\begin{')) {
            // Wrap in aligned
            // Trim whitespace to ensure clean wrapping
            return `\n\\begin{aligned}\n${text.trim()}\n\\end{aligned}\n`;
        }
        return text;
    };

    // Replaces $$ ... \\ ... $$ with $$ \begin{aligned} ... \end{aligned} $$
    fixed = fixed.replace(
        /(\$\$)([\s\S]*?)(\$\$)/g, 
        (match, start, inner, end) => {
            return start + fixAligned(inner) + end;
        }
    );

    // Replaces \[ ... \\ ... \] with \[ \begin{aligned} ... \end{aligned} \]
    fixed = fixed.replace(
        /(\\\[)([\s\S]*?)(\\\])/g, 
        (match, start, inner, end) => {
            return start + fixAligned(inner) + end;
        }
    );

    return fixed;
};
