"use client";

import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  File,
  FileJson,
  FileCode,
} from 'lucide-react';

interface DocumentUploaderProps {
  onUploadComplete?: (documents: UploadedDocument[]) => void;
  maxDocuments?: number;
}

interface UploadedDocument {
  id: string;
  title: string;
  contentType: string;
  chunkCount: number;
  createdAt: string;
}

interface PendingDocument {
  id: string;
  name: string;
  content: string;
  contentType: 'text' | 'markdown' | 'json';
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: UploadedDocument;
}

const CONTENT_TYPES: Record<string, 'text' | 'markdown' | 'json'> = {
  txt: 'text',
  text: 'text',
  md: 'markdown',
  mdx: 'markdown',
  json: 'json',
};

const FILE_ICONS: Record<string, typeof FileText> = {
  text: FileText,
  markdown: FileCode,
  json: FileJson,
};

export default function DocumentUploader({
  onUploadComplete,
  maxDocuments = 10,
}: DocumentUploaderProps) {
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File): Promise<PendingDocument | null> => {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const contentType = CONTENT_TYPES[extension];

      if (!contentType) {
        return null;
      }

      try {
        const content = await file.text();
        return {
          id: crypto.randomUUID(),
          name: file.name,
          content,
          contentType,
          status: 'pending',
        };
      } catch {
        return null;
      }
    },
    []
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles = fileArray.slice(0, maxDocuments - documents.length);

      const processed = await Promise.all(validFiles.map(processFile));
      const validDocs = processed.filter(
        (doc): doc is PendingDocument => doc !== null
      );

      setDocuments((prev) => [...prev, ...validDocs]);
    },
    [documents.length, maxDocuments, processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  }, []);

  const uploadDocuments = useCallback(async () => {
    const pendingDocs = documents.filter((doc) => doc.status === 'pending');
    if (pendingDocs.length === 0) return;

    setIsUploading(true);

    // Mark all as uploading
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.status === 'pending' ? { ...doc, status: 'uploading' } : doc
      )
    );

    const results: UploadedDocument[] = [];

    for (const doc of pendingDocs) {
      try {
        const response = await fetch('/api/papers/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: doc.content,
            contentType: doc.contentType,
            metadata: { title: doc.name },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }

        const data = await response.json();
        const result: UploadedDocument = data.document;

        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id ? { ...d, status: 'success', result } : d
          )
        );

        results.push(result);
      } catch (err) {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id
              ? {
                  ...d,
                  status: 'error',
                  error: err instanceof Error ? err.message : 'Upload failed',
                }
              : d
          )
        );
      }
    }

    setIsUploading(false);

    if (results.length > 0 && onUploadComplete) {
      onUploadComplete(results);
    }
  }, [documents, onUploadComplete]);

  const pendingCount = documents.filter((d) => d.status === 'pending').length;
  const successCount = documents.filter((d) => d.status === 'success').length;

  return (
    <div className="rounded-xl border border-neon-cyan/30 bg-cyber-dark/80 p-6 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-cyan/20">
          <Upload className="h-5 w-5 text-neon-cyan" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-white">
            Upload Documents
          </h2>
          <p className="text-sm text-gray-400">
            Add research documents for paper generation
          </p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          dragActive
            ? 'border-neon-cyan bg-neon-cyan/10'
            : 'border-gray-700 bg-cyber-darker/50 hover:border-gray-600'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".txt,.text,.md,.mdx,.json"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <Upload
          className={`mb-3 h-10 w-10 ${
            dragActive ? 'text-neon-cyan' : 'text-gray-500'
          }`}
        />
        <p className="mb-1 text-sm font-medium text-gray-300">
          Drop files here or click to upload
        </p>
        <p className="text-xs text-gray-500">
          Supports .txt, .md, .mdx, .json (max {maxDocuments} files)
        </p>
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="mb-4 space-y-2">
          {documents.map((doc) => {
            const Icon = FILE_ICONS[doc.contentType] || FileText;

            return (
              <div
                key={doc.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  doc.status === 'success'
                    ? 'border-green-500/30 bg-green-500/5'
                    : doc.status === 'error'
                    ? 'border-red-500/30 bg-red-500/5'
                    : doc.status === 'uploading'
                    ? 'border-neon-cyan/30 bg-neon-cyan/5'
                    : 'border-gray-700 bg-cyber-darker/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 ${
                      doc.status === 'success'
                        ? 'text-green-500'
                        : doc.status === 'error'
                        ? 'text-red-500'
                        : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {doc.name}
                    </p>
                    {doc.status === 'error' && doc.error && (
                      <p className="text-xs text-red-400">{doc.error}</p>
                    )}
                    {doc.status === 'success' && doc.result && (
                      <p className="text-xs text-green-400">
                        {doc.result.chunkCount} chunks created
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {doc.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />
                  )}
                  {doc.status === 'success' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {doc.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  {doc.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDocument(doc.id);
                      }}
                      className="rounded p-1 text-gray-500 hover:bg-gray-700 hover:text-gray-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Button */}
      {pendingCount > 0 && (
        <button
          onClick={uploadDocuments}
          disabled={isUploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-blue px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-neon-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Upload {pendingCount} Document{pendingCount > 1 ? 's' : ''}
            </>
          )}
        </button>
      )}

      {/* Summary */}
      {successCount > 0 && (
        <p className="mt-4 text-center text-sm text-green-400">
          {successCount} document{successCount > 1 ? 's' : ''} uploaded
          successfully
        </p>
      )}
    </div>
  );
}
