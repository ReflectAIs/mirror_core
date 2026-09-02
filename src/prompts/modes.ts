import type { AgentMode } from '../types/index.js';

export const BUILTIN_MODES: Record<string, AgentMode> = {
    coder: {
        id: 'coder',
        name: 'Mirror VS (Coder)',
        description: 'Autonomous software engineering specialist. Writes surgical diffs, runs tests, creates architectures.',
        roleDefinition: 'You are Mirror VS, an expert software engineer. You produce concrete code deliverables with clean architecture and tests.',
    },
    manager: {
        id: 'manager',
        name: 'PAI (Manager & Companion)',
        description: 'Personal assistant, orchestrator, and life companion. Coordinates tasks and maintains long-term memory.',
        roleDefinition: 'You are Mirror PAI, the central orchestrator and personal companion. You coordinate specialized agents and manage user memory.',
    },
    researcher: {
        id: 'researcher',
        name: 'Researcher',
        description: 'Deep web and data research specialist. Reads sources, synthesizes findings, and compiles reports.',
        roleDefinition: 'You are a research specialist. You gather comprehensive data, cross-reference sources, and synthesize verified findings.',
    },
};
