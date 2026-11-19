import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CameraFeed from './components/CameraFeed';
import ResultCard from './components/ResultCard';
import { getApiBaseUrl } from './api';

const STORAGE_KEY = 'facey_scan_history_v1';

function App() {
  const apiBaseUrl = getApiBaseUrl();
  const [loading, setLoading] = useState(false);
  const [detections, setDetections] = useState([]);
  const [backendStatus, setBackendStatus] = useState('Checking backend...');
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let active = true;

    axios
      .get(`${apiBaseUrl}/`)
      .then((res) => {
        if (active) {
          setBackendStatus(res.data?.status || 'Online');
        }
      })
      .catch(() => {
        if (active) {
          setBackendStatus('Backend offline (Render may be waking up or unreachable)');
        }
      });

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 20)));
    } catch (err) {
      console.error('Failed to save scan history:', err);
    }
  }, [history]);

  const handleCaptureResult = async (blob) => {
    if (!blob) return;
    const formData = new FormData();
    formData.append('file', blob, 'frame.jpg');

    setLoading(true);
    setDetections([]);
    try {
      const response = await axios.post(`${apiBaseUrl}/api/analyze-frame`, formData);
      const nextDetections = response.data.detections || [];
      setDetections(nextDetections);

      setHistory((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleString(),
          detections: nextDetections,
        },
        ...prev.slice(0, 19),
      ]);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportSummary = () => {
    const payload = {
      app: 'Facey — AI Vision Health & Feature Analyzer',
      disclaimer: 'Wellness and self-care screening aid only; not a medical diagnosis.',
      exportedAt: new Date().toISOString(),
      latestDetections: detections,
      recentHistory: history,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facey-scan-summary-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-6">
      <header className="w-full max-w-5xl flex flex-wrap justify-between items-center gap-4 mb-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Facey — AI Vision Health & Feature Analyzer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Backend Status: <span className="text-emerald-400">{backendStatus}</span> • Saved Scans: {history.length}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportSummary}
            disabled={detections.length === 0 && history.length === 0}
            className="text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-600 px-3 py-2 rounded-lg transition"
          >
            Export Summary
          </button>
          {history.length > 0 && (
            <button
              onClick={() => {
                setHistory([]);
                localStorage.removeItem(STORAGE_KEY);
              }}
              className="text-xs bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 px-3 py-2 rounded-lg transition"
            >
              Clear History
            </button>
          )}
        </div>
      </header>

      <div className="w-full max-w-5xl mb-6 bg-amber-950/30 border border-amber-700/40 text-amber-200 text-xs rounded-lg px-4 py-2.5">
        <strong>Wellness Notice:</strong> Facey is a general self-care and hygiene screening aid, not a medical diagnosis. Seek advice from a qualified dermatologist, dentist, or doctor for persistent, painful, or worsening symptoms.
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <CameraFeed
          onCaptureResult={handleCaptureResult}
          onClearDetections={() => setDetections([])}
          loading={loading}
          detections={detections}
        />

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col shadow-lg">
          <h2 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">Analysis Results</h2>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[380px]">
            {detections.length === 0 ? (
              <p className="text-slate-500 text-sm italic text-center mt-12">
                Capture a frame to view condition insights and recommendations.
              </p>
            ) : (
              detections.map((item, index) => <ResultCard key={index} item={item} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;