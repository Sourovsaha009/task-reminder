import React, { useState } from 'react';
import { Smartphone, Download, X, CheckCircle, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playTactileClick } from '../utils/audio';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already installed in standalone mode or user dismissed the top banner, don't show full banner
  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    playTactileClick('press');
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {/* Neomorphic Tactile Install App Card */}
      <aside aria-label="Install App Banner" className="w-full neu-raised rounded-2xl p-3 sm:p-4 mb-4 relative flex items-center justify-between gap-3 border border-sky-400/30 transition-all duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl neu-convex flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full skeuo-led-blue shrink-0" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                Install as Android Phone App
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Add to Home Screen for fullscreen alarms &amp; instant access
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="neu-btn-accent px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Install</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTactileClick('release');
              setDismissed(true);
            }}
            title="Dismiss banner"
            className="w-7 h-7 rounded-lg neu-btn text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Android Installation Instructions Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm neu-raised rounded-3xl p-6 relative shadow-2xl border border-slate-200/50 dark:border-white/5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl neu-convex flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {isIOS ? 'Install on iPhone' : 'Install on Android Phone'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  playTactileClick('release');
                  setShowGuide(false);
                }}
                className="w-7 h-7 rounded-lg neu-btn text-slate-400 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl neu-inset">
                    <span className="font-bold text-sky-500 font-digital">1.</span>
                    <span>Tap the <strong>Share</strong> button in Safari's bottom toolbar.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl neu-inset">
                    <span className="font-bold text-sky-500 font-digital">2.</span>
                    <span>Scroll down and select <strong>Add to Home Screen</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl neu-inset">
                    <span className="font-bold text-sky-500 font-digital">3.</span>
                    <span>Tap <strong>Add</strong> to launch it as a full standalone app.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl neu-inset">
                    <span className="font-bold text-sky-500 font-digital">1.</span>
                    <span>
                      Open this URL in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your phone.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl neu-inset">
                    <span className="font-bold text-sky-500 font-digital">2.</span>
                    <span>
                      Tap the <strong>three dots menu (⋮)</strong> at the top right of your browser.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl neu-inset">
                    <span className="font-bold text-sky-500 font-digital">3.</span>
                    <span>
                      Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>).
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl neu-inset">
                    <span className="font-bold text-sky-500 font-digital">4.</span>
                    <span>
                      The app icon will be added to your Android home screen and app drawer, opening fullscreen like a native app!
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  playTactileClick('press');
                  setShowGuide(false);
                }}
                className="w-full py-2.5 rounded-xl neu-btn-accent font-bold text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
