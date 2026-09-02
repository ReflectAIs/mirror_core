/**
 * Pure TypeScript Surgical Diff & Multi-Block Matcher
 * Ported from Mirror VS (zero IDE runtime dependencies)
 */

export interface DiffChunk {
    search: string;
    replace: string;
}

export interface DiffResult {
    success: boolean;
    content?: string;
    error?: string;
    appliedCount: number;
}

export class MultiBlockDiff {
    static normalizeLineEndings(str: string): string {
        return str.replace(/\r\n/g, '\n');
    }

    static applySingleBlock(original: string, search: string, replace: string): { success: boolean; content: string } {
        const normOriginal = this.normalizeLineEndings(original);
        const normSearch = this.normalizeLineEndings(search);
        const normReplace = this.normalizeLineEndings(replace);

        // 1. Exact match
        if (normOriginal.includes(normSearch)) {
            return {
                success: true,
                content: normOriginal.replace(normSearch, normReplace),
            };
        }

        // 2. Trimmed line-by-line fuzzy match
        const origLines = normOriginal.split('\n');
        const searchLines = normSearch.split('\n');

        let matchIndex = -1;
        for (let i = 0; i <= origLines.length - searchLines.length; i++) {
            let matched = true;
            for (let j = 0; j < searchLines.length; j++) {
                if (origLines[i + j].trim() !== searchLines[j].trim()) {
                    matched = false;
                    break;
                }
            }
            if (matched) {
                matchIndex = i;
                break;
            }
        }

        if (matchIndex !== -1) {
            const before = origLines.slice(0, matchIndex);
            const after = origLines.slice(matchIndex + searchLines.length);
            const resultLines = [...before, ...normReplace.split('\n'), ...after];
            return {
                success: true,
                content: resultLines.join('\n'),
            };
        }

        return { success: false, content: original };
    }

    static applyMultiBlock(original: string, chunks: DiffChunk[]): DiffResult {
        let current = original;
        let appliedCount = 0;

        for (let i = 0; i < chunks.length; i++) {
            const res = this.applySingleBlock(current, chunks[i].search, chunks[i].replace);
            if (!res.success) {
                return {
                    success: false,
                    error: `Failed to match chunk ${i + 1} of ${chunks.length}`,
                    appliedCount,
                };
            }
            current = res.content;
            appliedCount++;
        }

        return {
            success: true,
            content: current,
            appliedCount,
        };
    }
}
