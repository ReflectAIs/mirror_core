import type { ChatMessage } from '../types/index.js';

export interface CompactorOptions {
    maxBudgetTokens: number;
    compactThreshold: number; // e.g. 0.85
}

export class ContextCompactor {
    static estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    static estimateMessagesTokens(messages: ChatMessage[]): number {
        let total = 0;
        for (const m of messages) {
            total += this.estimateTokens(m.content || '');
            if (m.reasoningContent) total += this.estimateTokens(m.reasoningContent);
        }
        return total;
    }

    /**
     * Compact messages when budget threshold is exceeded.
     * Keeps recent half verbatim, summarizes older half.
     */
    static compactMessages(messages: ChatMessage[], maxTokens: number = 8000): ChatMessage[] {
        const total = this.estimateMessagesTokens(messages);
        if (total <= maxTokens || messages.length <= 4) {
            return messages;
        }

        // Split messages into older half and recent half
        const mid = Math.floor(messages.length / 2);
        const older = messages.slice(0, mid);
        const recent = messages.slice(mid);

        // Summarize older messages
        const summaryPoints: string[] = [];
        for (const m of older) {
            if (m.role === 'user') {
                summaryPoints.push(`User asked: "${m.content.slice(0, 100)}"`);
            } else if (m.role === 'assistant' && m.content) {
                summaryPoints.push(`Assistant answered/did: "${m.content.slice(0, 100)}"`);
            }
        }

        const summaryMessage: ChatMessage = {
            role: 'system',
            content: `[Conversation Summary (Older messages compacted)]:\n- ${summaryPoints.join('\n- ')}`,
            timestamp: Date.now(),
            isSummary: true,
        };

        return [summaryMessage, ...recent];
    }
}
