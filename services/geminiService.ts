import { GoogleGenAI, Type } from "@google/genai";
import { FixResult } from "../types";

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable is missing");
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeAndFixLatex = async (content: string): Promise<FixResult> => {
    const ai = getAiClient();

    const prompt = `
    You are a LaTeX and Markdown expert. 
    Review the following Markdown content which contains mathematical LaTeX expressions.
    
    Your tasks:
    1. Identify any syntax errors in the LaTeX (e.g., unclosed brackets, unsupported commands, invalid environments, mismatched delimiters).
    2. Identify any major Markdown syntax errors.
    3. Provide a list of brief descriptions for the detected issues.
    4. Provide a corrected version of the entire Markdown content.
    
    Notes on specific LaTeX delimiters:
    - The user may use \\[ ... \\] for block math.
    - The user may use \\( ... \\) for inline math.
    - The user may use $ ... $ for inline math.
    - The user may use $$ ... $$ for block math.
    Ensure these are preserved or normalized to standard forms if broken.
    
    Input Content:
    """
    ${content}
    """
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        issues: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "List of detected syntax errors or issues."
                        },
                        correctedMarkdown: {
                            type: Type.STRING,
                            description: "The full markdown content with all errors fixed."
                        }
                    },
                    required: ["issues", "correctedMarkdown"]
                }
            }
        });

        const jsonText = response.text;
        if (!jsonText) {
            throw new Error("No response from Gemini.");
        }

        const result = JSON.parse(jsonText) as FixResult;
        return result;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
};