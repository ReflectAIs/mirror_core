import type { ToolCall } from '../types/index.js';
import { ToolPolicy } from './ToolPolicy.js';

export interface ToolDefinition {
    name: string;
    description: string;
    group: string;
    parameters: Record<string, unknown>;
    handler: (args: Record<string, unknown>, context?: any) => Promise<any>;
}

export class ToolRegistry {
    private tools = new Map<string, ToolDefinition>();
    private policy: ToolPolicy = new ToolPolicy();

    setPolicy(policy: ToolPolicy): void {
        this.policy = policy;
    }

    register(tool: ToolDefinition): void {
        this.tools.set(tool.name, tool);
    }

    get(name: string): ToolDefinition | undefined {
        return this.tools.get(name);
    }

    getAll(): ToolDefinition[] {
        return Array.from(this.tools.values());
    }

    getDefinitions(): Array<{ name: string; description: string; parameters: Record<string, unknown> }> {
        return this.getAll().map(t => ({
            name: t.name,
            description: `[Group: ${t.group}] ${t.description}`,
            parameters: t.parameters,
        }));
    }

    async execute(name: string, args: Record<string, unknown>, context?: any): Promise<{ success: boolean; data?: any; error?: string }> {
        const check = this.policy.isAllowed(name);
        if (!check.allowed) {
            return { success: false, error: check.reason };
        }

        const tool = this.tools.get(name);
        if (!tool) {
            return { success: false, error: `Tool not found: ${name}` };
        }

        try {
            const data = await tool.handler(args, context);
            return { success: true, data };
        } catch (err: any) {
            return { success: false, error: err.message || String(err) };
        }
    }
}
