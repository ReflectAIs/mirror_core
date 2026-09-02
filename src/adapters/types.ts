/**
 * Platform Abstraction Layer (PAL)
 */

export interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    size?: number;
    modifiedAt?: number;
}

export interface IFileSystemAdapter {
    readFile(filePath: string, encoding?: BufferEncoding): Promise<string>;
    writeFile(filePath: string, content: string | Buffer): Promise<void>;
    deleteFile(filePath: string): Promise<void>;
    exists(filePath: string): Promise<boolean>;
    makeDirectory(dirPath: string, recursive?: boolean): Promise<void>;
    listDirectory(dirPath: string, recursive?: boolean): Promise<FileEntry[]>;
    findFiles(pattern: string, cwd?: string, options?: { ignore?: string[]; maxResults?: number }): Promise<string[]>;
}

export interface CommandResult {
    exitCode: number | null;
    stdout: string;
    stderr: string;
    durationMs: number;
}

export interface ITerminalAdapter {
    execute(command: string, options?: { cwd?: string; env?: Record<string, string>; timeoutMs?: number }): Promise<CommandResult>;
}

export interface IEnvironmentAdapter {
    getPlatform(): 'win32' | 'darwin' | 'linux' | 'unknown';
    getWorkspaceRoot(): string;
    getHomeDir(): string;
    getTempDir(): string;
    getEnv(key: string): string | undefined;
}
