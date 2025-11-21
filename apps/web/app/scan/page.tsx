'use client';

import { useState } from 'react';
import { VarcScanCamera } from '@/components/scan/VarcScanCamera';
import { ScanResultPanel } from '@/components/scan/ScanResultPanel';
import { FingerprintScanResponse } from '@apex/shared';

export default function ScanPage() {
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<FingerprintScanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async (imageUrl: string) => {
    setCapturedImageUrl(imageUrl);
    setScanResult(null);
    setError(null);
    setIsLoading(true);

    try {
      // Upload image to get a server-accessible URL
      // For v1, we'll use a data URL approach or upload to a storage service
      // For now, we'll convert the blob URL to a data URL
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        // Upload image to get URL (for v1, this may return data URL)
        let imageUrl = base64data;
        try {
          const uploadResponse = await fetch('/api/scan/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageData: base64data,
            }),
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            imageUrl = uploadData.imageUrl;
          }
        } catch (err) {
          console.warn('Upload failed, using data URL directly:', err);
        }

        // Call fingerprint API
        try {
          const fingerprintResponse = await fetch('/api/scan/fingerprint', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cardId: null, // Can be provided by user later
              imageUrl: imageUrl,
            }),
          });

          if (!fingerprintResponse.ok) {
            const errorData = await fingerprintResponse.json();
            throw new Error(errorData.error || 'Failed to scan fingerprint');
          }

          const result: FingerprintScanResponse = await fingerprintResponse.json();
          setScanResult(result);
        } catch (err) {
          const error = err as Error;
          setError(error.message);
        } finally {
          setIsLoading(false);
        }
      };

      reader.readAsDataURL(blob);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCapturedImageUrl(null);
    setScanResult(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Safe area padding for mobile */}
      <div className="pt-safe pb-safe px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              VARC Scan v1
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Scan your card to generate a unique fingerprint
            </p>
          </div>

          {/* Camera or Results */}
          {!capturedImageUrl ? (
            <VarcScanCamera
              onCapture={handleCapture}
              onError={(err) => {
                setError(err.message);
              }}
            />
          ) : (
            <div className="space-y-6">
              {/* Captured image preview */}
              <div className="w-full max-w-2xl mx-auto">
                <div className="relative aspect-[3/4] bg-black rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={capturedImageUrl}
                    alt="Captured card"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={handleReset}
                  className="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Scan Another Card
                </button>
              </div>

              {/* Results panel */}
              <ScanResultPanel
                result={scanResult}
                isLoading={isLoading}
                error={error}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


