'use client';

import { FingerprintScanResponse } from '@apex/shared';

interface ScanResultPanelProps {
  result: FingerprintScanResponse | null;
  isLoading?: boolean;
  error?: string | null;
}

export function ScanResultPanel({ result, isLoading, error }: ScanResultPanelProps) {
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Processing scan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error</h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const { fingerprint, potentialDuplicates } = result;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Main result card */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Scan Results</h2>

        {/* Grade */}
        {fingerprint.grade !== null && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Grade</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {fingerprint.grade.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* Fingerprint info */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Hash Version</span>
            <span className="font-sans text-gray-900 dark:text-white">{fingerprint.hashVersion}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Fingerprint</span>
            <span className="font-sans text-xs text-gray-500 dark:text-gray-400">
              {fingerprint.fingerprintHex.slice(0, 16)}...
            </span>
          </div>
        </div>

        {/* Duplicate detection */}
        {fingerprint.similarToExisting ? (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  Potential Duplicate Detected
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  This card may already exist in our database.
                  {fingerprint.nearestNeighborDistance !== null && (
                    <span className="block mt-1">
                      Similarity distance: {fingerprint.nearestNeighborDistance.toFixed(4)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
                  Unique in Database
                </h3>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  This card appears to be unique in our database (v1).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Potential duplicates list */}
      {potentialDuplicates.length > 0 && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Potential Duplicates ({potentialDuplicates.length})
          </h3>
          <div className="space-y-3">
            {potentialDuplicates.map((duplicate) => (
              <div
                key={duplicate.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {duplicate.cardId || 'Unknown Card'}
                    </p>
                    {duplicate.grade !== null && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Grade: {duplicate.grade.toFixed(1)}
                      </p>
                    )}
                    <p className="text-xs font-sans text-gray-400 dark:text-gray-500 mt-1">
                      {duplicate.fingerprintHex.slice(0, 16)}...
                    </p>
                  </div>
                  {duplicate.imageUrl && (
                    <img
                      src={duplicate.imageUrl}
                      alt="Duplicate card"
                      className="w-16 h-24 object-cover rounded border border-gray-200 dark:border-gray-600"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


