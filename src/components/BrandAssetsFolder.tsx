import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileImage, 
  Play, 
  Copy, 
  Download, 
  Check, 
  Sparkles, 
  Eye, 
  Code, 
  Layers, 
  Palette, 
  Maximize2, 
  RotateCcw,
  CheckCircle2,
  FileText,
  Sliders
} from 'lucide-react';
import { TickrLogo } from './TickrLogo';
import { motion, AnimatePresence } from 'motion/react';

interface BrandAssetsFolderProps {
  onReplaySplash?: () => void;
}

export const BrandAssetsFolder: React.FC<BrandAssetsFolderProps> = ({ onReplaySplash }) => {
  const [activeFile, setActiveFile] = useState<'logo-svg' | 'logo-jpg' | 'splash' | 'spec' | 'palette'>('logo-svg');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Mini interactive splash simulator state
  const [isSimulatingSplash, setIsSimulatingSplash] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [simStatus, setSimStatus] = useState<string>('Ready');

  const triggerMiniSplash = () => {
    setIsSimulatingSplash(true);
    setSimProgress(10);
    setSimStatus('Initializing workspace...');

    setTimeout(() => {
      setSimProgress(45);
      setSimStatus('Loading local time logs & cache...');
    }, 450);

    setTimeout(() => {
      setSimProgress(85);
      setSimStatus('Connecting cloud synchronization...');
    }, 1050);

    setTimeout(() => {
      setSimProgress(100);
      setSimStatus('Ready');
    }, 1500);

    setTimeout(() => {
      setIsSimulatingSplash(false);
    }, 2400);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadSVG = () => {
    const link = document.createElement('a');
    link.href = '/branding/tickr-logo.svg';
    link.download = 'tickr-logo.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJPG = () => {
    const link = document.createElement('a');
    link.href = '/branding/tickr-logo.jpg';
    link.download = 'tickr-logo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSpec = () => {
    const link = document.createElement('a');
    link.href = '/branding/splash-animation.json';
    link.download = 'splash-animation.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const brandColors = [
    { name: 'Primary Blue', hex: '#2563EB', role: 'Ribbon Base & Emblems' },
    { name: 'Electric Sky', hex: '#38BDF8', role: 'Ribbon Top & Accent Glow' },
    { name: 'Vibrant Violet', hex: '#7C3AED', role: 'Corner Gradient Depth' },
    { name: 'Cyan Glow', hex: '#67E8F9', role: 'Specular Highlighting' },
    { name: 'Slate Dark', hex: '#0F172A', role: 'App Canvas & Dark Mode' },
    { name: 'Success Emerald', hex: '#10B981', role: 'Active Timer & Ready State' }
  ];

  const files = [
    {
      id: 'logo-svg' as const,
      name: 'tickr-logo.svg',
      label: 'Vector Logo Mark',
      size: '3.4 KB',
      type: 'Vector SVG',
      icon: FileCode,
      color: 'text-sky-500'
    },
    {
      id: 'logo-jpg' as const,
      name: 'tickr-logo.jpg',
      label: 'Original 3D Emblem',
      size: '228 KB',
      type: 'Raster Image',
      icon: FileImage,
      color: 'text-indigo-500'
    },
    {
      id: 'splash' as const,
      name: 'splash-animation.tsx',
      label: 'Splash Screen Animation',
      size: '6.6 KB',
      type: 'Motion Component',
      icon: Sparkles,
      color: 'text-purple-500'
    },
    {
      id: 'spec' as const,
      name: 'splash-animation.json',
      label: 'Animation Timelines Spec',
      size: '1.2 KB',
      type: 'JSON Data',
      icon: FileText,
      color: 'text-amber-500'
    },
    {
      id: 'palette' as const,
      name: 'brand-palette.css',
      label: 'Official Color Swatches',
      size: '6 Colors',
      type: 'Color Tokens',
      icon: Palette,
      color: 'text-emerald-500'
    }
  ];

  return (
    <div id="brand-assets-folder-container" className="space-y-6">
      {/* Folder Header Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white break-words">
                  Brand Assets & Splash Animation Folder
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex-shrink-0">
                  /public/branding/
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                Centralized asset directory containing the official 3D logo emblem, scalable vector icon, and interactive splash screen animation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onReplaySplash && (
              <button
                onClick={onReplaySplash}
                id="btn-trigger-fullscreen-splash"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xs transition transform active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current flex-shrink-0" />
                <span className="whitespace-nowrap">Replay Splash Screen</span>
              </button>
            )}

            <button
              onClick={handleDownloadSVG}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
              title="Download official SVG logo"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span className="whitespace-nowrap">Download SVG</span>
            </button>
          </div>
        </div>

        {/* Directory Breadcrumb Strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-y-2 gap-x-3 text-xs text-slate-500 dark:text-slate-400 font-mono w-full min-w-0 max-w-full overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
            <Folder className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Root</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span>public</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">branding</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
            <span className="whitespace-nowrap">5 Asset Files</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 whitespace-nowrap">
              <Check className="w-3 h-3 flex-shrink-0" /> Synchronized
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Explorer Layout: File Tree on Left, Inspector / Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: File List inside Folder (4 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">
              Files in this Folder
            </h3>

            <div className="space-y-1.5">
              {files.map(file => {
                const Icon = file.icon;
                const isSelected = activeFile === file.id;
                return (
                  <button
                    key={file.id}
                    onClick={() => setActiveFile(file.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-300 dark:border-indigo-700/80 shadow-xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${file.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {file.label}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {file.size}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Path info helper */}
            <div className="mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="truncate font-mono">/public/branding/</span>
              <button
                onClick={() => handleCopy('/public/branding/', 'folder-path')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
              >
                {copiedKey === 'folder-path' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'folder-path' ? 'Copied' : 'Copy Path'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: File Inspector & Interactive Preview (7 cols) */}
        <div className="lg:col-span-7">
          
          {/* 1. Vector SVG Inspector */}
          {activeFile === 'logo-svg' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                    <FileCode className="w-4 h-4 text-sky-500 flex-shrink-0" />
                    <span>tickr-logo.svg</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Scalable Vector Graphics • Infinite Resolution • 3D Ribbon & Checkmark
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={handleDownloadSVG}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition flex-shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download SVG</span>
                  </button>
                </div>
              </div>

              {/* Live Preview Display */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[220px]">
                <div className="w-28 h-28 p-1 rounded-3xl bg-gradient-to-tr from-indigo-500 via-sky-400 to-purple-500 shadow-2xl shadow-indigo-500/20">
                  <div className="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center p-2">
                    <TickrLogo variant="vector" className="w-full h-full" />
                  </div>
                </div>

                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-4">
                  SVG ViewBox: 0 0 100 100 • Path: /public/branding/tickr-logo.svg
                </p>
              </div>

              {/* Attributes & Metadata */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Format</span>
                  <span className="font-bold text-slate-900 dark:text-white">SVG / Vector</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Scalability</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Lossless ∞</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Gradients</span>
                  <span className="font-bold text-slate-900 dark:text-white">5 Shaders</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Original Raster JPG Inspector */}
          {activeFile === 'logo-jpg' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                    <FileImage className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span>tickr-logo.jpg</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    High-Resolution 3D Master Emblem with Soft Shadows
                  </p>
                </div>

                <button
                  onClick={handleDownloadJPG}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition flex-shrink-0 self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JPG</span>
                </button>
              </div>

              {/* Master Image Preview */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[220px]">
                <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-xl ring-4 ring-indigo-500/20">
                  <img
                    src="/branding/tickr-logo.jpg"
                    alt="Tickr Master Emblem"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-4">
                  1024 × 1024px • 24-bit RGB • Master Production Render
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Dimensions</span>
                  <span className="font-bold text-slate-900 dark:text-white">1024 × 1024</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">File Size</span>
                  <span className="font-bold text-slate-900 dark:text-white">228 KB</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Aspect Ratio</span>
                  <span className="font-bold text-slate-900 dark:text-white">1:1 Square</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Interactive Splash Animation Simulator */}
          {activeFile === 'splash' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                    <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span>splash-animation.tsx</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Interactive Motion Animation • 1800ms Sequence • Multi-stage Loading
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={triggerMiniSplash}
                    disabled={isSimulatingSplash}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition disabled:opacity-50 flex-shrink-0"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isSimulatingSplash ? 'animate-spin' : ''}`} />
                    <span>Test In-Card</span>
                  </button>

                  {onReplaySplash && (
                    <button
                      onClick={onReplaySplash}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-2xs transition flex-shrink-0"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Full Screen</span>
                    </button>
                  )}
                </div>
              </div>

              {/* In-Card Interactive Splash Preview Container */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 text-white p-6 min-h-[260px] flex flex-col items-center justify-center text-center border border-slate-800">
                {/* Ambient Radial Background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/70 via-slate-950 to-black pointer-events-none" />
                <div className="absolute w-40 h-40 -top-10 -left-10 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute w-40 h-40 -bottom-10 -right-10 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

                {/* Animated Logo Container */}
                <div className="relative z-10 flex flex-col items-center max-w-xs">
                  <div className="relative mb-4">
                    {/* Glowing outer aura */}
                    <div className="absolute -inset-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 opacity-60 blur-lg animate-pulse" />
                    
                    <div className="relative w-20 h-20 rounded-2xl p-1 bg-gradient-to-tr from-indigo-500 via-sky-400 to-purple-500 shadow-xl">
                      <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center">
                        <TickrLogo className="w-full h-full" />
                      </div>
                    </div>

                    <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-indigo-600 text-white shadow-md">
                      <Sparkles className="w-3 h-3 animate-spin-slow" />
                    </div>
                  </div>

                  <h4 className="font-brand-rounded font-extrabold text-lg tracking-wide text-white">
                    TICKR
                  </h4>
                  <p className="text-[11px] text-indigo-300 font-medium">
                    Enterprise Workday & Attendance OS
                  </p>

                  {/* Dynamic Progress Bar */}
                  <div className="w-full mt-4 space-y-1.5">
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-300"
                        style={{ width: `${isSimulatingSplash ? simProgress : 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{isSimulatingSplash ? simStatus : 'Ready'}</span>
                      <span>{isSimulatingSplash ? `${simProgress}%` : '100%'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Timeline Scrubber Slider Bar */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Interactive Timeline Slider Bar
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                    {isSimulatingSplash ? simProgress : 100}%
                  </span>
                </div>
                <div className="px-0.5">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isSimulatingSplash ? simProgress : 100}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setIsSimulatingSplash(true);
                      setSimProgress(val);
                      if (val < 45) {
                        setSimStatus('Initializing core runtime...');
                      } else if (val < 85) {
                        setSimStatus('Connecting cloud synchronization...');
                      } else if (val < 100) {
                        setSimStatus('Finalizing local state...');
                      } else {
                        setSimStatus('Ready');
                      }
                    }}
                    className="slider-bar w-full"
                    title="Drag to scrub the splash screen animation timeline"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono gap-1">
                  <span>0% Entrance</span>
                  <span className="hidden sm:inline">45% Handshake</span>
                  <span className="hidden sm:inline">85% Sync</span>
                  <span>100% Ready</span>
                </div>
              </div>

              {/* Keyframe details table - Grid layout to guarantee no text collision */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs">
                <div className="grid grid-cols-12 gap-2 font-semibold text-slate-700 dark:text-slate-300 text-[11px] pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="col-span-4 sm:col-span-3">Timing / Stage</span>
                  <span className="col-span-8 sm:col-span-9">Action</span>
                </div>
                <div className="grid grid-cols-12 gap-2 text-[11px] text-slate-500 dark:text-slate-400 items-baseline">
                  <span className="col-span-4 sm:col-span-3 font-mono text-slate-700 dark:text-slate-300">0–450ms</span>
                  <span className="col-span-8 sm:col-span-9 leading-tight">Glide entrance & cache initialization (10%–45%)</span>
                </div>
                <div className="grid grid-cols-12 gap-2 text-[11px] text-slate-500 dark:text-slate-400 items-baseline">
                  <span className="col-span-4 sm:col-span-3 font-mono text-slate-700 dark:text-slate-300">450–1050ms</span>
                  <span className="col-span-8 sm:col-span-9 leading-tight">Cloud connectivity handshake & state sync (45%–85%)</span>
                </div>
                <div className="grid grid-cols-12 gap-2 text-[11px] text-slate-500 dark:text-slate-400 items-baseline">
                  <span className="col-span-4 sm:col-span-3 font-mono text-slate-700 dark:text-slate-300">1050–1500ms</span>
                  <span className="col-span-8 sm:col-span-9 leading-tight">Ready verification & sparkle trigger (100%)</span>
                </div>
                <div className="grid grid-cols-12 gap-2 text-[11px] text-slate-500 dark:text-slate-400 items-baseline">
                  <span className="col-span-4 sm:col-span-3 font-mono text-slate-700 dark:text-slate-300">1500–1800ms</span>
                  <span className="col-span-8 sm:col-span-9 leading-tight">Smooth scale-up exit fade transition</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. JSON Spec Inspector */}
          {activeFile === 'spec' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>splash-animation.json</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Structured Animation Configuration & Timeline Schema
                  </p>
                </div>

                <button
                  onClick={handleDownloadSpec}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition flex-shrink-0 self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </button>
              </div>

              {/* JSON Code Viewer with styled slider bar */}
              <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[260px] border border-slate-800">
                <pre>{`{
  "name": "TICKR Splash Screen Animation",
  "version": "2.4",
  "component": "SplashScreen.tsx",
  "logoComponent": "TickrLogo.tsx",
  "assetPath": "/branding/tickr-logo.svg",
  "imageAssetPath": "/branding/tickr-logo.jpg",
  "animationSpec": {
    "engine": "motion/react",
    "totalDurationMs": 1800,
    "stages": [
      { "timeMs": 0, "progress": 10, "label": "Initializing workspace..." },
      { "timeMs": 450, "progress": 45, "label": "Loading local time logs & cache..." },
      { "timeMs": 1050, "progress": 85, "label": "Connecting cloud synchronization..." },
      { "timeMs": 1500, "progress": 100, "label": "Ready" },
      { "timeMs": 1800, "progress": 100, "label": "App Mounted" }
    ]
  }
}`}</pre>
              </div>
            </div>
          )}

          {/* 5. Color Palette Inspector */}
          {activeFile === 'palette' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                  <Palette className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Brand Color Tokens & Swatches</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Official chromatic tokens applied across logo ribbons, ambient glows, and status badges
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {brandColors.map(c => (
                  <div 
                    key={c.hex}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition min-w-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                      <div 
                        className="w-9 h-9 rounded-lg shadow-xs flex-shrink-0 border border-black/10" 
                        style={{ backgroundColor: c.hex }}
                      />
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                          {c.hex}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {c.role}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopy(c.hex, c.hex)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition flex-shrink-0"
                      title="Copy Hex Code"
                    >
                      {copiedKey === c.hex ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
