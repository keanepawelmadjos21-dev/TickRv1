import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, User, Clock, ShieldCheck } from 'lucide-react';
import { TickrLogo } from './TickrLogo';

interface WelcomeScreenProps {
  profileName: string;
  avatarUrl?: string;
  role?: string;
  department?: string;
  company?: string;
  email?: string;
  durationMs?: number;
  onFinish: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  profileName,
  avatarUrl,
  role,
  department,
  company,
  email,
  durationMs = 2400,
  onFinish
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Derive initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const displayName = profileName || 'User';
  const roleDisplay = role ? role : 'Team Member';
  const subInfo = [department, company].filter(Boolean).join(' • ');

  // Auto-dismiss timer and smooth progress
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);
    }, 40);

    const finishTimeout = setTimeout(() => {
      handleDismiss();
    }, durationMs);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      clearTimeout(finishTimeout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [durationMs]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onFinish();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="welcome-flash-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleDismiss}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white cursor-pointer select-none overflow-hidden"
        >
          {/* Ambient Radial Gradient Lights */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/80 via-slate-950 to-black pointer-events-none" />
          <div className="absolute w-[500px] h-[500px] -top-32 left-1/2 -translate-x-1/2 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute w-80 h-80 bottom-10 left-1/2 -translate-x-1/2 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Central Welcome Card */}
          <div className="relative z-10 flex flex-col items-center max-w-sm sm:max-w-md px-6 text-center">
            
            {/* Top Logo / App Micro Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 mb-6 shadow-sm"
            >
              <div className="w-5 h-5 rounded-lg overflow-hidden flex items-center justify-center bg-indigo-600">
                <TickrLogo className="w-full h-full object-cover" />
              </div>
              <span className="text-[11px] font-bold tracking-wider text-slate-300 font-brand-rounded uppercase">
                TICKR WORKSPACE
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </motion.div>

            {/* Profile Avatar with Pulsing Ring */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
              className="relative mb-5"
            >
              {/* Outer Glow */}
              <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 opacity-30 blur-lg animate-pulse" />

              {/* Avatar Frame */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 shadow-xl shadow-indigo-950/70">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center border-2 border-slate-950">
                  {avatarUrl && !avatarError ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      onError={() => setAvatarError(true)}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-700 to-purple-800 flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl tracking-tight">
                      {getInitials(displayName)}
                    </div>
                  )}
                </div>
              </div>

              {/* Status / Sparkle Pin */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 300 }}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-white shadow-md"
                title="Active Profile"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              </motion.div>
            </motion.div>

            {/* Main Welcome Message: Hello [Name]! */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45 }}
              className="space-y-2 mb-4"
            >
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Welcome Back</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-300">{displayName}</span>!
              </h1>

              <p className="text-sm font-medium text-slate-300">
                {roleDisplay} {subInfo && <span className="text-slate-500">• {subInfo}</span>}
              </p>
            </motion.div>

            {/* Verified Profile Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="w-full bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3 mb-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  Profile Ready
                </span>
                <span className="font-mono text-slate-400 truncate max-w-[180px]">
                  {email || 'Local & Cloud Synced'}
                </span>
              </div>
            </motion.div>

            {/* Micro Progress Bar & Dismiss CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.3 }}
              className="w-full space-y-2"
            >
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 rounded-full transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition pt-1">
                <span>Entering workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
