/**
 * Tool Policy & Permissions Engine
 */

export interface ToolPolicyConfig {
    denylist?: string[];
    guideOnly?: boolean;
    readOnlyPlanMode?: boolean;
    blockAllTools?: boolean;
}

export class ToolPolicy {
    constructor(private config: ToolPolicyConfig = {}) {}

    isAllowed(toolName: string): { allowed: boolean; reason?: string } {
        if (this.config.blockAllTools) {
            return { allowed: false, reason: 'All tool calls are currently blocked by policy.' };
        }
        if (this.config.guideOnly) {
            return { allowed: false, reason: 'System is in guide-only conversational mode.' };
        }
        if (this.config.denylist && this.config.denylist.includes(toolName)) {
            return { allowed: false, reason: `Tool "${toolName}" is on the denylist.` };
        }
        if (this.config.readOnlyPlanMode) {
            const writeTools = ['files.write', 'files.delete', 'terminal.execute'];
            if (writeTools.some(w => toolName.startsWith(w))) {
                return { allowed: false, reason: `Tool "${toolName}" is prohibited in Plan / Read-Only mode.` };
            }
        }
        return { allowed: true };
    }
}
