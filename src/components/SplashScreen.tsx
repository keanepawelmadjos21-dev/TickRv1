import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TickrLogo } from './TickrLogo';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
  appName?: string;
  appVersion?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDurationMs = 1800,
  appName = 'Daily Time Keeper',
  appVersion = 'v2.4'
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(10);
  const [statusText, setStatusText] = useState<string>('Initializing workspace...');

  useEffect(() => {
    // Step progress indicators for a natural loading feel
    const t1 = setTimeout(() => {
      setProgress(45);
      setStatusText('Loading local time logs & cache...');
    }, 450);

    const t2 = setTimeout(() => {
      setProgress(85);
      setStatusText('Connecting cloud synchronization...');
    }, 1050);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Ready');
    }, 1500);

    const tFinish = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) {
        onFinish();
      }
    }, minDurationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tFinish);
    };
  }, [minDurationMs, onFinish]);

  const handleManualDismiss = () => {
    setIsVisible(false);
    if (onFinish) {
      onFinish();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="app-splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleManualDismiss}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white cursor-pointer select-none overflow-hidden"
        >
          {/* Subtle Radial Gradient Background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/60 via-slate-950 to-black pointer-events-none" />

          {/* Ambient Blurred Colored Orbs */}
          <div className="absolute w-96 h-96 -top-20 -left-20 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute w-96 h-96 -bottom-20 -right-20 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Center Logo & Branding Content */}
          <div className="relative z-10 flex flex-col items-center max-w-xs sm:max-w-sm px-6 text-center">
            {/* Animated Logo Container with Glow Halo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-6"
            >
              {/* Outer Pulsing Glow */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-purple-600 opacity-40 blur-xl animate-pulse" />
              
              {/* Logo Card */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-tr from-indigo-500 via-sky-400 to-purple-500 shadow-2xl shadow-indigo-950/60">
                <div className="w-full h-full rounded-[22px] overflow-hidden bg-slate-900 flex items-center justify-center">
                  <TickrLogo className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Sparkle Badge */}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-indigo-600 border-2 border-slate-950 flex items-center justify-center text-white shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </motion.div>
            </motion.div>

            {/* App Name & Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="space-y-1.5 mb-6"
            >
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {appName}
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {appVersion}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Cloud & Offline Work Hours & Payroll System
              </p>
            </motion.div>

            {/* Micro Progress Bar & Status */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="w-full space-y-2.5"
            >
              {/* Progress Track */}
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden p-[1px] border border-slate-800">
                <motion.div
                  className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.4 }}
                />
              </div>

              {/* Status Text */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="truncate">{statusText}</span>
                <span className="text-indigo-400 font-semibold ml-2">{progress}%</span>
              </div>
            </motion.div>

            {/* Tap to skip prompt */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="mt-8 text-[10px] text-slate-500 tracking-wider uppercase font-semibold hover:text-slate-300 transition"
            >
              Tap anywhere to enter
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
