'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface Job {
  id: string;
  type: 'varc' | 'lamp' | 'contrarian';
  status: 'running' | 'completed' | 'error';
  createdAt: string;
}

interface Message {
  id: string;
  jobId: string;
  type: 'agent' | 'system' | 'error';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface AgentChatPanelProps {
  jobs: Job[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onNewJob?: () => void;
}

export default function AgentChatPanel({
  jobs,
  selectedJobId,
  onSelectJob,
  onNewJob,
}: AgentChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!selectedJobId) {
      setMessages([]);
      setIsConnected(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const selectedJob = jobs.find((j) => j.id === selectedJobId);
    if (!selectedJob) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        const endpoint = selectedJob.type === 'lamp'
          ? `/api/events/lamp/${selectedJobId}`
          : selectedJob.type === 'varc'
            ? `/api/events/varc/${selectedJobId}`
            : `/api/events/contrarian/${selectedJobId}`;
        eventSource = new EventSource(endpoint);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        eventSource.addEventListener('connected', () => {
          setMessages((prev) => [
            ...prev,
            {
              id: `system-${Date.now()}`,
              jobId: selectedJobId,
              type: 'system',
              content: 'Connected to agent stream',
              timestamp: new Date().toISOString(),
            },
          ]);
        });

        eventSource.addEventListener('result', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.status === 'completed' || data.status === 'error') {
              setMessages((prev) => [
                ...prev,
                {
                  id: `msg-${Date.now()}-${Math.random()}`,
                  jobId: selectedJobId,
                  type: data.status === 'error' ? 'error' : 'agent',
                  content: data.error?.message || data.result ? JSON.stringify(data.result, null, 2) : 'Job completed',
                  timestamp: new Date().toISOString(),
                  metadata: data,
                },
              ]);
            }
          } catch (err) {
            console.error('Error parsing SSE message:', err);
          }
        });

        eventSource.addEventListener('update', (event) => {
          try {
            const data = JSON.parse(event.data);
            setMessages((prev) => [
              ...prev,
              {
                id: `msg-${Date.now()}-${Math.random()}`,
                jobId: selectedJobId,
                type: 'agent',
                content: data.result?.message || JSON.stringify(data, null, 2),
                timestamp: new Date().toISOString(),
                metadata: data,
              },
            ]);
          } catch (err) {
            console.error('Error parsing SSE message:', err);
          }
        });

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setMessages((prev) => [
              ...prev,
              {
                id: `msg-${Date.now()}-${Math.random()}`,
                jobId: selectedJobId,
                type: 'agent',
                content: data.message || JSON.stringify(data, null, 2),
                timestamp: new Date().toISOString(),
                metadata: data,
              },
            ]);
          } catch (err) {
            console.error('Error parsing SSE message:', err);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();

          reconnectTimeout = setTimeout(() => {
            if (selectedJobId) {
              connect();
            }
          }, 3000);
        };
      } catch (err) {
        setError('Failed to connect to agent stream');
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
      eventSourceRef.current = null;
    };
  }, [selectedJobId, jobs]);

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'varc':
        return 'VARC';
      case 'lamp':
        return 'LAMP';
      case 'contrarian':
        return 'Contrarian';
      default:
        return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] border border-cyan-500/20 rounded-lg overflow-hidden bg-black/40 backdrop-blur-sm">
      {/* Left Panel - Job List */}
      <div className="w-64 border-r border-cyan-500/20 bg-black/60 flex flex-col">
        <div className="p-4 border-b border-cyan-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Running Jobs</h3>
          {onNewJob && (
            <button
              onClick={onNewJob}
              className="w-full px-3 py-2 text-sm bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-md transition-colors border border-cyan-500/30"
            >
              + New Job
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {jobs.length === 0 ? (
            <div className="p-4 text-sm text-white/50 text-center">
              No running jobs
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => onSelectJob(job.id)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    selectedJobId === job.id
                      ? 'bg-cyan-500/30 border border-cyan-500/50'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-cyan-400">
                      {getJobTypeLabel(job.type)}
                    </span>
                    {getStatusIcon(job.status)}
                  </div>
                  <div className="text-xs text-white/70 truncate">{job.id}</div>
                  <div className="text-xs text-white/50 mt-1">
                    {new Date(job.createdAt).toLocaleTimeString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div className="flex-1 flex flex-col">
        {selectedJobId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-cyan-500/20 bg-black/60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {getJobTypeLabel(jobs.find((j) => j.id === selectedJobId)?.type ?? '')} Job
                  </h3>
                  <div className="text-xs text-white/50 mt-1">{selectedJobId}</div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <span className="text-xs text-green-500 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-500 flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      Connecting...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-white/50 mt-8">
                  Waiting for agent messages...
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.type === 'system' ? 'justify-center' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.type === 'error'
                          ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                          : msg.type === 'system'
                            ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm'
                            : 'bg-white/5 border border-white/10 text-white'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                      <div className="text-xs text-white/30 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mx-4 mb-2 p-3 bg-red-500/20 border border-red-500/30 rounded-md flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/50">
            Select a job to view agent messages
          </div>
        )}
      </div>
    </div>
  );
}


