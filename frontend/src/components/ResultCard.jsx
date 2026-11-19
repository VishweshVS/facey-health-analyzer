import React from 'react';

export default function ResultCard({ item }) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/80 p-3 rounded-lg">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{item.region}</span>
        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
          {Math.round(item.confidence * 100)}% Match
        </span>
      </div>
      <h3 className="font-semibold text-slate-200 text-sm mb-1">{item.condition}</h3>
      <p className="text-xs text-slate-400 bg-slate-800/50 p-2 rounded border border-slate-700/40">
        💡 <strong>Solution:</strong> {item.recommendation}
      </p>
    </div>
  );
}