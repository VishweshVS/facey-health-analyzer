import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

export default function CameraFeed({ onCaptureResult, onClearDetections, loading, detections }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const snapshotRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedFrameUrl, setCapturedFrameUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (capturedFrameUrl) URL.revokeObjectURL(capturedFrameUrl);
    };
  }, [capturedFrameUrl]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCapturedFrameUrl(null);
        onClearDetections();
        setIsStreaming(true);
      }
    } catch (err) {
      alert("Error accessing webcam: " + err.message);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
      clearCanvas();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const snapshot = snapshotRef.current;
    const hasSnapshot = Boolean(capturedFrameUrl && snapshot);
    const source = hasSnapshot ? snapshot : video;

    const drawDetections = () => {
      const width = source === snapshot ? snapshot.naturalWidth : video.videoWidth;
      const height = source === snapshot ? snapshot.naturalHeight : video.videoHeight;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;

      if (!width || !height) return;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, width, height);

      if (!hasSnapshot) return;

      detections.forEach(item => {
        if (!item.box || item.box.length !== 4) return;
        const [ymin, xmin, ymax, xmax] = item.box;

        const x = xmin * width;
        const y = ymin * height;
        const w = (xmax - xmin) * width;
        const h = (ymax - ymin) * height;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(x, y > 25 ? y - 25 : 0, w > 150 ? w : 150, 25);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(`${item.condition} (${Math.round(item.confidence * 100)}%)`, x + 5, y > 25 ? y - 8 : 16);
      });
    };

    source.addEventListener(source === snapshot ? 'load' : 'loadedmetadata', drawDetections);
    if (source !== snapshot) source.addEventListener('resize', drawDetections);
    drawDetections();

    return () => {
      source.removeEventListener(source === snapshot ? 'load' : 'loadedmetadata', drawDetections);
      if (source !== snapshot) source.removeEventListener('resize', drawDetections);
    };
  }, [capturedFrameUrl, detections, isStreaming]);

  const captureFrame = () => {
    if (!videoRef.current || videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    const video = videoRef.current;
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;

    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    captureCanvas.toBlob((blob) => {
      if (blob) {
        setCapturedFrameUrl(URL.createObjectURL(blob));
        onCaptureResult(blob);
      }
    }, 'image/jpeg');
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center shadow-lg">
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-slate-700">
        <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${isStreaming && !capturedFrameUrl ? '' : 'hidden'}`} />
        
        {capturedFrameUrl && (
          <img
            ref={snapshotRef}
            src={capturedFrameUrl}
            alt="Captured frame with analysis highlights"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${isStreaming || capturedFrameUrl ? '' : 'hidden'}`} />

        {capturedFrameUrl && (
          <span className="absolute top-3 left-3 bg-slate-900/80 text-slate-100 text-xs px-2 py-1 rounded">
            Captured frame
          </span>
        )}

        {!isStreaming && !capturedFrameUrl && (
          <div className="text-slate-500 flex flex-col items-center">
            <Camera size={48} className="mb-2 opacity-50" />
            <p className="text-sm">Webcam is offline</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4 w-full">
        {!isStreaming ? (
          <button onClick={startCamera} className="flex-1 bg-blue-600 hover:bg-blue-500 font-medium py-2 px-4 rounded-lg transition">
            Start Camera
          </button>
        ) : (
          <>
            <button onClick={stopCamera} className="bg-rose-600/80 hover:bg-rose-600 font-medium py-2 px-4 rounded-lg transition">
              Stop
            </button>
              {capturedFrameUrl && (
                <button onClick={() => setCapturedFrameUrl(null)} className="bg-slate-700 hover:bg-slate-600 font-medium py-2 px-4 rounded-lg transition">
                  Live Preview
                </button>
              )}
            <button onClick={captureFrame} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Analyze Frame'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}