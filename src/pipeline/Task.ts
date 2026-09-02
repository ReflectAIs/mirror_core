import { EventEmitter } from 'events';
import type { ChatMessage, ToolCall } from '../types/index.js';
import { ToolRegistry } from '../tools/ToolRegistry.js';
import { ContextCompactor } from './ContextCompactor.js';

export interface TaskOptions {
    id: string;
    goal: string;
    systemPrompt: string;
    maxSteps?: number;
    tools: ToolRegistry;
    completeStream: (request: any) => AsyncGenerator<any, void, unknown>;
}

export class Task extends EventEmitter {
    public id: string;
    public messages: ChatMessage[] = [];
    public status: 'idle' | 'running' | 'completed' | 'failed' | 'aborted' = 'idle';
    private maxSteps: number;

    constructor(private options: TaskOptions) {
        super();
        this.id = options.id;
        this.maxSteps = options.maxSteps || 50;
    }

    async *run(initialUserMessage: string): AsyncGenerator<{ type: string; content?: string; toolCall?: any; result?: any; error?: string }, void, unknown> {
        this.status = 'running';
        this.messages = [
            { role: 'system', content: this.options.systemPrompt, timestamp: Date.now() },
            { role: 'user', content: initialUserMessage, timestamp: Date.now() },
        ];

        let step = 0;
        while (step < this.maxSteps && this.status === 'running') {
            step++;
            const compacted = ContextCompactor.compactMessages(this.messages);
            const toolDefs = this.options.tools.getDefinitions();

            let streamedContent = '';
            let toolCalls: ToolCall[] | undefined;

            try {
                for await (const chunk of this.options.completeStream({ messages: compacted, tools: toolDefs })) {
                    if (chunk.content) {
                        streamedContent += chunk.content;
                        yield { type: 'content', content: chunk.content };
                    }
                    if (chunk.reasoningContent) {
                        yield { type: 'reasoning', content: chunk.reasoningContent };
                    }
                    if (chunk.toolCalls) {
                        toolCalls = chunk.toolCalls;
                    }
                }
            } catch (err: any) {
                this.status = 'failed';
                yield { type: 'error', error: err.message || String(err) };
                return;
            }

            const assistantMsg: ChatMessage = {
                role: 'assistant',
                content: streamedContent,
                timestamp: Date.now(),
                toolCalls,
            };
            this.messages.push(assistantMsg);

            if (!toolCalls || toolCalls.length === 0) {
                this.status = 'completed';
                yield { type: 'result', content: streamedContent };
                return;
            }

            // Execute tools
            for (const tc of toolCalls) {
                yield { type: 'tool_start', toolCall: tc };
                const res = await this.options.tools.execute(tc.name, tc.arguments);
                yield { type: 'tool_result', toolCall: tc, result: res };

                this.messages.push({
                    role: 'tool',
                    toolCallId: tc.id,
                    content: JSON.stringify(res),
                    timestamp: Date.now(),
                });
            }
        }

        if (step >= this.maxSteps) {
            this.status = 'completed';
            const msg = 'Task reached maximum step budget.';
            yield { type: 'result', content: msg };
        }
    }
}
