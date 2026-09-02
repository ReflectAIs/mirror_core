/**
 * Prompt Security & Untrusted Source Guard Layer
 * Ported from Odysseus & hardened for Mirror SDK
 */

export class PromptSecurity {
    private static readonly GUARD_START = '<<<UNTRUSTED_SOURCE_DATA_START>>>';
    private static readonly GUARD_END = '<<<UNTRUSTED_SOURCE_DATA_END>>>';

    /**
     * Wrap raw external content (web search, file content, tool output, emails)
     * in strict boundary guards so the LLM treats it as data, not instructions.
     */
    static wrapUntrustedData(source: string, content: string): string {
        const sanitized = content
            .replace(/<<<UNTRUSTED_SOURCE_DATA_START>>>/g, '[[GUARD_START_ESCAPED]]')
            .replace(/<<<UNTRUSTED_SOURCE_DATA_END>>>/g, '[[GUARD_END_ESCAPED]]');

        return `[Source: ${source}]\n${this.GUARD_START}\n${sanitized}\n${this.GUARD_END}`;
    }

    /**
     * Check if a message contains prompt-injection breakout attempts
     */
    static sanitizeUserContent(content: string): string {
        return content.replace(/SYSTEM PROMPT OVERRIDE/gi, '[BLOCKED_INJECTION_KEYWORD]');
    }
}
