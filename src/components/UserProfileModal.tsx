import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Trash2, 
  User, 
  Mail, 
  Briefcase, 
  Building2, 
  Clock, 
  Globe, 
  Check, 
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { UserAccount } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: UserAccount;
  onSave: (updatedAccount: UserAccount) => void;
}

// Preset avatars curated for professional yet energetic profiles
const PRESET_AVATARS = [
  {
    id: 'preset-1',
    label: 'Alex (Executive)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-2',
    label: 'Marcus (Tech Lead)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-3',
    label: 'Elena (Design Lead)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-4',
    label: 'David (Developer)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-5',
    label: 'Sofia (Product Lead)',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-6',
    label: 'Kavita (Engineer)',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-7',
    label: 'Chen (Analyst)',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-8',
    label: 'Sam (Creative)',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80'
  }
];

const TIMEZONES = [
  { value: 'Asia/Manila', label: 'Asia/Manila (PHT, UTC+8)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT, UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, UTC+9)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT, UTC-8)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT, UTC-5)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT, UTC-6)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST, UTC+0)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST, UTC+1)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST, UTC+10)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' }
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  account,
  onSave
}) => {
  const [formData, setFormData] = useState<UserAccount>({ ...account });
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(account.avatarUrl);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('presets');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...account });
      setAvatarPreview(account.avatarUrl);
      setErrorMessage(null);
    }
  }, [isOpen, account]);

  if (!isOpen) return null;

  // Process uploaded image file: compress to lightweight Base64 to safely store in localStorage
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP, GIF).');
      return;
    }
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        // Resize canvas to max 400x400 to keep localStorage snappy & lightweight
        const maxDim = 400;
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarPreview(compressedDataUrl);
          setFormData(prev => ({ ...prev, avatarUrl: compressedDataUrl }));
        }
      };
      img.onerror = () => {
        setErrorMessage('Failed to decode image file. Please try another image.');
      };
      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectPreset = (url: string) => {
    setAvatarPreview(url);
    setFormData(prev => ({ ...prev, avatarUrl: url }));
    setErrorMessage(null);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    try {
      new URL(customUrlInput.trim());
      setAvatarPreview(customUrlInput.trim());
      setFormData(prev => ({ ...prev, avatarUrl: customUrlInput.trim() }));
      setErrorMessage(null);
    } catch {
      setErrorMessage('Please enter a valid HTTP or HTTPS image URL.');
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(undefined);
    setFormData(prev => ({ ...prev, avatarUrl: undefined }));
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserAccount = {
      ...formData,
      avatarUrl: avatarPreview,
      defaultHourlyRate: Number(formData.defaultHourlyRate) || 85,
      dailyTargetHours: Number(formData.dailyTargetHours) || 8,
      weeklyTargetHours: Number(formData.weeklyTargetHours) || 40,
      currency: 'PHP',
      currencySymbol: '₱'
    };

    onSave(updated);
    setShowSavedFeedback(true);
    setTimeout(() => {
      setShowSavedFeedback(false);
      onClose();
    }, 600);
  };

  const handleResetToDefault = () => {
    const defaultData: UserAccount = {
      id: 'default-user',
      name: 'Alex Rivera',
      email: 'alex.rivera@enterprise.io',
      role: 'Senior Systems Architect',
      department: 'Product & Systems',
      company: 'Apex Digital Labs',
      defaultHourlyRate: 85,
      currency: 'PHP',
      currencySymbol: '₱',
      weeklyTargetHours: 40,
      dailyTargetHours: 8,
      timezone: 'Asia/Manila',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
    };
    setFormData(defaultData);
    setAvatarPreview(defaultData.avatarUrl);
    setErrorMessage(null);
  };

  const initials = formData.name
    ? formData.name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
    : 'AR';

  return (
    <div 
      id="user-profile-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div 
        id="user-profile-modal"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                Employee Profile Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update user avatar, bio credentials, billing rate (₱), and workload goals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="btn-close-profile-modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Avatar / User Picture Hero Section */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-slate-50 to-purple-50/40 dark:from-slate-800/60 dark:via-slate-900 dark:to-indigo-950/30 border border-indigo-100/70 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              
              {/* Animated Avatar Preview Card */}
              <div className="flex flex-col items-center gap-2">
                <div 
                  id="animated-avatar-preview-container"
                  className="relative group cursor-pointer"
                  title="Animated user picture thumbnail"
                >
                  {/* Outer animated rotating halo ring */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-75 blur-xs animate-spin-slow group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Subtle pulsing expansion ring */}
                  <div className="absolute -inset-1.5 rounded-full border-2 border-indigo-400/40 dark:border-indigo-500/30 animate-pulse-ring pointer-events-none" />

                  {/* Inner thumbnail frame */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-white dark:bg-slate-900 overflow-hidden shadow-lg">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt={formData.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
                        onError={() => {
                          setAvatarPreview(undefined);
                          setErrorMessage('Selected picture failed to load. Reset to default initials.');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl tracking-wider shadow-inner">
                        {initials}
                      </div>
                    )}

                    {/* Camera overlay hover prompt */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-medium gap-1"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Upload</span>
                    </div>
                  </div>

                  {/* Animated Active Status Indicator */}
                  <span className="absolute bottom-1 right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
                  </span>
                </div>

                <div className="text-center">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-100/70 dark:bg-indigo-950/60">
                    <Sparkles className="w-3 h-3 animate-spin-slow" />
                    Animated Thumbnail
                  </span>
                </div>
              </div>

              {/* Picture Change Controls & Options */}
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Change User Picture
                  </span>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      id="btn-remove-avatar"
                      className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove Picture
                    </button>
                  )}
                </div>

                {/* Picture Source Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs mb-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('presets')}
                    className={`flex-1 py-1 px-2 rounded-lg font-medium transition ${
                      activeTab === 'presets'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Preset Gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 py-1 px-2 rounded-lg font-medium transition ${
                      activeTab === 'upload'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('url')}
                    className={`flex-1 py-1 px-2 rounded-lg font-medium transition ${
                      activeTab === 'url'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Image URL
                  </button>
                </div>

                {/* Tab 1: Preset Avatars Gallery */}
                {activeTab === 'presets' && (
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                      Choose a curated high-resolution profile photo:
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_AVATARS.map((preset) => {
                        const isSelected = avatarPreview === preset.url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectPreset(preset.url)}
                            title={preset.label}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${
                              isSelected
                                ? 'border-indigo-600 dark:border-indigo-400 scale-105 shadow-md ring-2 ring-indigo-500/20'
                                : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:scale-102'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <span className="absolute inset-0 bg-indigo-600/30 backdrop-blur-[1px] flex items-center justify-center text-white">
                                <Check className="w-4 h-4" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 2: Upload File & Drag/Drop */}
                {activeTab === 'upload' && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="input-upload-avatar-file"
                    />
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-4 rounded-xl border-2 border-dashed text-center cursor-pointer transition ${
                        dragActive
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                          : 'border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-800/50 hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Click to browse or drag & drop photo here
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Supports PNG, JPG, WebP, GIF (auto-resized for quick local loading)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Image URL Input */}
                {activeTab === 'url' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Paste a direct web link to any avatar or photo:
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/..."
                          value={customUrlInput}
                          onChange={(e) => setCustomUrlInput(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyCustomUrl}
                        className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-xs"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Banner if any */}
                {errorMessage && (
                  <div className="mt-2.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Identity Information Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Personal & Role Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  Work Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. alex.rivera@enterprise.io"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Job Title / Role */}
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                  Job Title / Position
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Senior Systems Architect"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Department */}
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Product & Systems"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Company */}
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. Apex Digital Labs"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Timezone */}
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  Work Timezone
                </label>
                <select
                  value={formData.timezone || 'Asia/Manila'}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Compensation & Workload Goals Section */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Compensation & Workload Targets
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Default Hourly Rate in PHP */}
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₱</span>
                  Default Hourly Rate (PHP) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 select-none">
                    ₱
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.defaultHourlyRate}
                    onChange={(e) => setFormData({ ...formData, defaultHourlyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-7 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Used in payroll computations & time logs
                </span>
              </div>

              {/* Daily Target Hours */}
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  Daily Target Hours *
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  required
                  value={formData.dailyTargetHours}
                  onChange={(e) => setFormData({ ...formData, dailyTargetHours: parseFloat(e.target.value) || 8 })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Standard workday workload (e.g. 8h)
                </span>
              </div>

              {/* Weekly Target Hours */}
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  Weekly Target Hours *
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  step="1"
                  required
                  value={formData.weeklyTargetHours}
                  onChange={(e) => setFormData({ ...formData, weeklyTargetHours: parseFloat(e.target.value) || 40 })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Full-time week workload (e.g. 40h)
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Defaults
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                id="btn-cancel-profile-modal"
                className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-profile"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
              >
                {showSavedFeedback ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Profile Saved!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
