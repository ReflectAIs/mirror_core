import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import fg from 'fast-glob';
import type { IFileSystemAdapter, ITerminalAdapter, IEnvironmentAdapter, FileEntry, CommandResult } from './types.js';

export class NodeFileSystemAdapter implements IFileSystemAdapter {
    async readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
        return fs.readFile(filePath, { encoding });
    }
    async writeFile(filePath: string, content: string | Buffer): Promise<void> {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, content);
    }
    async deleteFile(filePath: string): Promise<void> {
        await fs.unlink(filePath);
    }
    async exists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    async makeDirectory(dirPath: string, recursive: boolean = true): Promise<void> {
        await fs.mkdir(dirPath, { recursive });
    }
    async listDirectory(dirPath: string, recursive: boolean = false): Promise<FileEntry[]> {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const results: FileEntry[] = [];
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            results.push({
                name: entry.name,
                path: fullPath,
                isDirectory: entry.isDirectory(),
            });
            if (recursive && entry.isDirectory()) {
                const sub = await this.listDirectory(fullPath, true);
                results.push(...sub);
            }
        }
        return results;
    }
    async findFiles(pattern: string, cwd?: string, options?: { ignore?: string[]; maxResults?: number }): Promise<string[]> {
        const matches = await fg(pattern, {
            cwd: cwd || process.cwd(),
            ignore: options?.ignore || ['**/node_modules/**', '**/.git/**'],
            absolute: true,
        });
        if (options?.maxResults && options.maxResults > 0) {
            return matches.slice(0, options.maxResults);
        }
        return matches;
    }
}

export class NodeTerminalAdapter implements ITerminalAdapter {
    async execute(command: string, options?: { cwd?: string; env?: Record<string, string>; timeoutMs?: number }): Promise<CommandResult> {
        const start = Date.now();
        return new Promise((resolve) => {
            exec(
                command,
                {
                    cwd: options?.cwd || process.cwd(),
                    env: { ...process.env, ...options?.env },
                    timeout: options?.timeoutMs || 60000,
                },
                (error, stdout, stderr) => {
                    resolve({
                        exitCode: error ? error.code ?? 1 : 0,
                        stdout: stdout ? stdout.toString() : '',
                        stderr: stderr ? stderr.toString() : (error ? error.message : ''),
                        durationMs: Date.now() - start,
                    });
                }
            );
        });
    }
}

export class NodeEnvironmentAdapter implements IEnvironmentAdapter {
    constructor(private workspaceRoot: string = process.cwd()) {}
    getPlatform(): 'win32' | 'darwin' | 'linux' | 'unknown' {
        const p = os.platform();
        if (p === 'win32' || p === 'darwin' || p === 'linux') return p;
        return 'unknown';
    }
    getWorkspaceRoot(): string {
        return this.workspaceRoot;
    }
    getHomeDir(): string {
        return os.homedir();
    }
    getTempDir(): string {
        return os.tmpdir();
    }
    getEnv(key: string): string | undefined {
        return process.env[key];
    }
}
