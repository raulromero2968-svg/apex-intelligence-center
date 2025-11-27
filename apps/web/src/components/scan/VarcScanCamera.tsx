'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface VarcScanCameraProps {
  onCapture: (imageUrl: string) => void;
  onError?: (error: Error) => void;
}

export function VarcScanCamera({ onCapture, onError }: VarcScanCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        setHasPermission(true);
        setError(null);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      setHasPermission(false);
      if (onError) {
        onError(error);
      }
    }
  }, [onError]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Capture image from video stream
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and create object URL
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob);
          onCapture(imageUrl);
        }
      },
      'image/jpeg',
      0.95 // Quality
    );
  }, [onCapture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Video preview */}
      <div className="relative aspect-[3/4] bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Card alignment overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-white/50 rounded-lg w-[85%] h-[75%] shadow-lg">
            {/* Corner guides */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Camera Error</p>
              <p className="text-sm">{error}</p>
              {!hasPermission && (
                <button
                  onClick={startCamera}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Grant Permission
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading state */}
        {!isStreaming && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p>Starting camera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Capture button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={captureImage}
          disabled={!isStreaming || !!error}
          className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform touch-manipulation"
          aria-label="Capture image"
        >
          <div className="w-full h-full rounded-full bg-red-500 m-1" />
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Position the card within the frame and tap to capture</p>
      </div>
    </div>
  );
}


