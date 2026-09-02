import type { AgentMode } from '../types/index.js';

export class PromptBuilder {
    private sections: string[] = [];

    addSection(title: string, content: string): this {
        if (content.trim()) {
            this.sections.push(`## ${title}\n${content.trim()}`);
        }
        return this;
    }

    applyMode(mode: AgentMode): this {
        this.addSection(`Mode: ${mode.name}`, mode.roleDefinition);
        if (mode.customInstructions) {
            this.addSection('Mode Custom Instructions', mode.customInstructions);
        }
        return this;
    }

    build(): string {
        return this.sections.join('\n\n');
    }
}
