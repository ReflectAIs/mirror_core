/**
 * Unified Core Types for @mirror/core SDK
 */

export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}

export interface ChatMessage {
    id?: string;
    role: Role;
    content: string;
    reasoningContent?: string;
    timestamp: number;
    toolCalls?: ToolCall[];
    toolCallId?: string;
    isSummary?: boolean;
    isTruncationMarker?: boolean;
    condenseParent?: boolean;
    metadata?: Record<string, unknown>;
}

export interface LLMCompletionRequest {
    messages: ChatMessage[];
    tools?: Array<{
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }>;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}

export interface LLMStreamChunk {
    content?: string;
    reasoningContent?: string;
    toolCalls?: ToolCall[];
    finishReason?: string;
}

export interface LLMResponse {
    content: string;
    reasoningContent?: string;
    toolCalls?: ToolCall[];
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface AgentMode {
    id: string;
    name: string;
    description: string;
    roleDefinition: string;
    customInstructions?: string;
    allowedTools?: string[];
    disallowedTools?: string[];
}
