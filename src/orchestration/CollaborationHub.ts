import { EventEmitter } from 'events';

export interface BlackboardEntry {
    id: string;
    workspaceId: string;
    author: string;
    key: string;
    value: any;
    summary?: string;
    timestamp: number;
}

export interface AgentMessage {
    id: string;
    from: string;
    to: string;
    kind: 'request' | 'inform' | 'failure' | 'handoff';
    action: string;
    payload?: any;
    workspaceId?: string;
    timestamp: number;
}

export interface FileLock {
    id: string;
    workspaceId: string;
    path: string;
    holder: string;
    acquiredAt: number;
    expiresAt: number;
}

export class CollaborationHub extends EventEmitter {
    private blackboard = new Map<string, Map<string, BlackboardEntry>>();
    private messages: AgentMessage[] = [];
    private locks = new Map<string, FileLock>();

    postBlackboard(entry: Omit<BlackboardEntry, 'id' | 'timestamp'>): BlackboardEntry {
        const fullEntry: BlackboardEntry = {
            ...entry,
            id: `bb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
        };
        if (!this.blackboard.has(entry.workspaceId)) {
            this.blackboard.set(entry.workspaceId, new Map());
        }
        this.blackboard.get(entry.workspaceId)!.set(entry.key, fullEntry);
        this.emit('blackboard', fullEntry);
        return fullEntry;
    }

    readBlackboard(workspaceId: string, key: string): BlackboardEntry | undefined {
        return this.blackboard.get(workspaceId)?.get(key);
    }

    listBlackboard(workspaceId: string): BlackboardEntry[] {
        const ws = this.blackboard.get(workspaceId);
        return ws ? Array.from(ws.values()) : [];
    }

    sendMessage(msg: Omit<AgentMessage, 'id' | 'timestamp'>): AgentMessage {
        const fullMsg: AgentMessage = {
            ...msg,
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
        };
        this.messages.push(fullMsg);
        if (this.messages.length > 500) this.messages.shift();
        this.emit('message', fullMsg);
        return fullMsg;
    }

    getMessages(filter?: { workspaceId?: string; to?: string; from?: string }): AgentMessage[] {
        return this.messages.filter(m => {
            if (filter?.workspaceId && m.workspaceId !== filter.workspaceId) return false;
            if (filter?.to && m.to !== filter.to && m.to !== '*') return false;
            if (filter?.from && m.from !== filter.from) return false;
            return true;
        });
    }

    tryLock(params: { workspaceId: string; path: string; holder: string; ttlMs?: number }): FileLock | null {
        const key = `${params.workspaceId}:${params.path}`;
        const existing = this.locks.get(key);
        if (existing && existing.expiresAt > Date.now() && existing.holder !== params.holder) {
            return null;
        }
        const lock: FileLock = {
            id: `lock-${Date.now()}`,
            workspaceId: params.workspaceId,
            path: params.path,
            holder: params.holder,
            acquiredAt: Date.now(),
            expiresAt: Date.now() + (params.ttlMs || 300000),
        };
        this.locks.set(key, lock);
        this.emit('lock-acquired', lock);
        return lock;
    }

    releaseLock(workspaceId: string, path: string, holder?: string): boolean {
        const key = `${workspaceId}:${path}`;
        const existing = this.locks.get(key);
        if (!existing) return false;
        if (holder && existing.holder !== holder) return false;
        this.locks.delete(key);
        this.emit('lock-released', { workspaceId, path, holder });
        return true;
    }

    listLocks(workspaceId?: string): FileLock[] {
        const active = Array.from(this.locks.values()).filter(l => l.expiresAt > Date.now());
        if (workspaceId) return active.filter(l => l.workspaceId === workspaceId);
        return active;
    }
}
