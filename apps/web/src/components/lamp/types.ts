/**
 * TypeScript types for LAMP (Language Agent Message Protocol) components
 */

export type AgentPersona = 'analyst' | 'researcher' | 'strategist' | 'oracle' | 'system';

export interface AgentMessage {
  id: string;
  sessionId: string;
  persona: AgentPersona;
  content: string;
  timestamp: number;
  metadata?: AgentMessageMetadata;
}

export interface AgentMessageMetadata {
  toolName?: string;
  toolInput?: Record<string, any>;
  toolOutput?: Record<string, any>;
  confidence?: number;
  sources?: string[];
  latencyMs?: number;
  reasoning?: string;
}

export interface AgentPersonaConfig {
  name: string;
  color: string;
  gradient: string;
  icon: string;
  description?: string;
}

export interface LAMPStreamEvent {
  type: 'message' | 'connected' | 'error' | 'ping';
  data: any;
  timestamp: number;
}

export interface LAMPSession {
  id: string;
  userId?: string;
  startedAt: number;
  endedAt?: number;
  messageCount: number;
  status: 'active' | 'completed' | 'error';
}
