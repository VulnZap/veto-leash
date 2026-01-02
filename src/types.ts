// src/types.ts

export interface Policy {
  action: 'delete' | 'modify' | 'execute' | 'read';
  include: string[];
  exclude: string[];
  description: string;
}

export interface CheckRequest {
  action: string;
  target: string;
}

export interface CheckResponse {
  allowed: boolean;
  reason?: string;
}

export interface SessionState {
  pid: number;
  agent: string;
  policy: Policy;
  startTime: Date;
  blockedCount: number;
  allowedCount: number;
  blockedActions: Array<{ time: Date; action: string; target: string }>;
}

export interface Config {
  failClosed: boolean;
  fallbackToBuiltins: boolean;
  warnBroadPatterns: boolean;
  maxSnapshotFiles: number;
  maxMemoryCacheSize: number;
  auditLog: boolean;
  verbose: boolean;
}

export const DEFAULT_CONFIG: Config = {
  failClosed: true,
  fallbackToBuiltins: true,
  warnBroadPatterns: true,
  maxSnapshotFiles: 10000,
  maxMemoryCacheSize: 100 * 1024,
  auditLog: false,
  verbose: false,
};
