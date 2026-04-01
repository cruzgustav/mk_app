'use client';

import FaceAnalysisWidget from '@/components/widget/FaceAnalysisWidget';

export default function Home() {
  return (
    <div className="min-h-screen sm:min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 flex flex-col items-center sm:justify-center p-4 sm:p-4 pb-[env(safe-area-inset-bottom)]">
      <FaceAnalysisWidget />
      <div className="mt-6 text-center max-w-[480px] w-full hidden sm:block">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <span className="w-8 h-px bg-slate-200" />
          <span>Widget Embarcável</span>
          <span className="w-8 h-px bg-slate-200" />
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Use via iframe:{' '}
          <code className="bg-white/60 px-2 py-0.5 rounded text-[10px] font-mono">
            {'<iframe src="URL" width="480" height="800"></iframe>'}
          </code>
        </p>
      </div>
    </div>
  );
}
