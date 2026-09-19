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
  AlertCircle,
  Sun,
  Moon,
  Cloud,
  CloudOff,
  RefreshCw,
  SlidersHorizontal,
  Wifi,
  WifiOff,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Key,
  HelpCircle,
  Send,
  ExternalLink
} from 'lucide-react';
import { UserAccount } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: UserAccount;
  onSave: (updatedAccount: UserAccount) => void;
  theme?: 'light' | 'dark';
  onSetTheme?: (theme: 'light' | 'dark') => void;
  onOpenWidgetModal?: () => void;
  isOnline?: boolean;
  isSyncing?: boolean;
  pendingCount?: number;
  onManualSync?: () => void;
  lastSyncTime?: string | null;
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
  onSave,
  theme = 'light',
  onSetTheme,
  onOpenWidgetModal,
  isOnline = true,
  isSyncing = false,
  pendingCount = 0,
  onManualSync,
  lastSyncTime
}) => {
  const [formData, setFormData] = useState<UserAccount>({ ...account });
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(account.avatarUrl);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('presets');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Firebase Auth integration inside Profile Settings
  const { 
    user, 
    loginWithEmail, 
    registerWithEmail, 
    resetPasswordEmail, 
    loginWithGoogle, 
    logout 
  } = useFirebase();

  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'forgot'>('signin');
  const [authEmail, setAuthEmail] = useState<string>(account.email || '');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authFeedback, setAuthFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAuthExpanded, setIsAuthExpanded] = useState<boolean>(!user);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...account });
      setAvatarPreview(account.avatarUrl);
      setErrorMessage(null);
      setAuthFeedback(null);
      setAuthPassword('');
      setAuthConfirmPassword('');
      setAuthEmail(user?.email || account.email || '');
      setIsAuthExpanded(!user);
    }
  }, [isOpen, account, user]);

  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || '';
    if (code === 'auth/operation-not-allowed') {
      return 'Email/Password sign-in is not yet enabled in the Firebase Console. In the Firebase Console, go to Authentication > Sign-in method > Email/Password to enable it, or use Continue with Google.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'Invalid email or password. Please verify your credentials or create a new account.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'This email address is already registered. Please switch to the Sign In tab.';
    }
    if (code === 'auth/weak-password') {
      return 'Password is too weak. Please use at least 6 characters.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Sign-in window was closed before completing.';
    }
    return message || 'Authentication failed. Please verify your credentials and network connection.';
  };

  const handleEmailSignIn = async () => {
    if (!authEmail.trim() || !authPassword) {
      setAuthFeedback({ type: 'error', text: 'Please enter your email and password.' });
      return;
    }
    setAuthLoading(true);
    setAuthFeedback(null);
    try {
      const loggedUser = await loginWithEmail(authEmail, authPassword);
      setAuthFeedback({ 
        type: 'success', 
        text: `Signed in as ${loggedUser.email || authEmail}! Cloud profile updated.` 
      });
      const updated: UserAccount = {
        ...formData,
        email: loggedUser.email || authEmail,
        name: loggedUser.displayName || formData.name
      };
      setFormData(updated);
      onSave(updated);
      setAuthPassword('');
      setIsAuthExpanded(false);
    } catch (err: any) {
      setAuthFeedback({ type: 'error', text: formatAuthError(err) });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailRegister = async () => {
    if (!authEmail.trim() || !authPassword) {
      setAuthFeedback({ type: 'error', text: 'Please enter both email and password.' });
      return;
    }
    if (authPassword.length < 6) {
      setAuthFeedback({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (authPassword !== authConfirmPassword) {
      setAuthFeedback({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setAuthLoading(true);
    setAuthFeedback(null);
    try {
      const newUser = await registerWithEmail(authEmail, authPassword, formData.name);
      setAuthFeedback({ 
        type: 'success', 
        text: `Account created successfully! Signed in as ${newUser.email || authEmail}.` 
      });
      const updated: UserAccount = {
        ...formData,
        email: newUser.email || authEmail
      };
      setFormData(updated);
      onSave(updated);
      setAuthPassword('');
      setAuthConfirmPassword('');
      setIsAuthExpanded(false);
    } catch (err: any) {
      setAuthFeedback({ type: 'error', text: formatAuthError(err) });
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!authEmail.trim()) {
      setAuthFeedback({ type: 'error', text: 'Please enter your email address to receive password reset link.' });
      return;
    }
    setAuthLoading(true);
    setAuthFeedback(null);
    try {
      await resetPasswordEmail(authEmail);
      setAuthFeedback({ 
        type: 'success', 
        text: `Password reset link sent to ${authEmail}. Please check your inbox.` 
      });
      setAuthMode('signin');
    } catch (err: any) {
      setAuthFeedback({ type: 'error', text: formatAuthError(err) });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthFeedback(null);
    try {
      await loginWithGoogle();
      setAuthFeedback({ type: 'success', text: 'Signed in with Google! Cloud sync enabled.' });
      setIsAuthExpanded(false);
    } catch (err: any) {
      setAuthFeedback({ type: 'error', text: formatAuthError(err) });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    setAuthFeedback(null);
    try {
      await logout();
      setAuthFeedback({ type: 'success', text: 'Signed out of cloud account.' });
      setIsAuthExpanded(true);
    } catch (err: any) {
      setAuthFeedback({ type: 'error', text: err.message || 'Failed to sign out.' });
    } finally {
      setAuthLoading(false);
    }
  };

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
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                    {formData.name || 'Employee'}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-100/70 dark:bg-indigo-950/60 mt-0.5">
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
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between gap-1.5 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    Work Email Address *
                  </span>
                  {user ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Account Linked
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.email) setAuthEmail(formData.email);
                        setIsAuthExpanded(true);
                      }}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                    >
                      Sign In with this email
                    </button>
                  )}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (!user) setAuthEmail(e.target.value);
                  }}
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

          {/* Account Authentication & Email Sign-In Section */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Account Authentication & Cloud Sign-In
                </h3>
              </div>
              {user ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Authenticated
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Offline / Local Account
                </span>
              )}
            </div>

            {/* Auth Feedback / Status Message Banner */}
            {authFeedback && (
              <div 
                id="auth-feedback-banner"
                className={`p-3 rounded-xl text-xs flex items-start gap-2.5 transition-all ${
                  authFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                {authFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs leading-relaxed">{authFeedback.text}</p>
                  {authFeedback.text.includes('Firebase Console') && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Tip: You can enable Email/Password provider in the Firebase Console under <strong>Authentication &gt; Sign-in method</strong>, or use Google Sign-In below for instant access.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setAuthFeedback(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* State A: User IS Authenticated */}
            {user && (
              <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || 'User'} 
                          className="w-full h-full object-cover rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        (user.email || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {user.email || user.displayName || 'Signed In User'}
                        </p>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                          {user.providerData[0]?.providerId === 'password' ? 'Email Account' : user.providerData[0]?.providerId === 'google.com' ? 'Google Account' : 'Cloud Auth'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        UID: {user.uid.slice(0, 16)}... • Cloud sync active
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      id="btn-profile-switch-account"
                      onClick={() => setIsAuthExpanded(!isAuthExpanded)}
                      className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                      {isAuthExpanded ? 'Hide Login Form' : 'Switch Account'}
                    </button>
                    <button
                      type="button"
                      id="btn-profile-signout"
                      onClick={handleSignOut}
                      disabled={authLoading}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{authLoading ? 'Signing out...' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* State B: Sign In / Register / Reset Card (visible if not logged in or if user clicked Switch Account) */}
            {(!user || isAuthExpanded) && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/60 text-xs font-semibold">
                    <button
                      type="button"
                      id="tab-auth-signin"
                      onClick={() => { setAuthMode('signin'); setAuthFeedback(null); }}
                      className={`px-3 py-1 rounded-md transition cursor-pointer ${
                        authMode === 'signin'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      id="tab-auth-register"
                      onClick={() => { setAuthMode('register'); setAuthFeedback(null); }}
                      className={`px-3 py-1 rounded-md transition cursor-pointer ${
                        authMode === 'register'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      Create Account
                    </button>
                    <button
                      type="button"
                      id="tab-auth-forgot"
                      onClick={() => { setAuthMode('forgot'); setAuthFeedback(null); }}
                      className={`px-3 py-1 rounded-md transition cursor-pointer ${
                        authMode === 'forgot'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      Reset Password
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                    {authMode === 'signin' ? 'Sign in with your email account' : authMode === 'register' ? 'Register new email account' : 'Recover password via email'}
                  </span>
                </div>

                {/* Form fields */}
                <div className="space-y-2.5">
                  {/* Email Input */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-indigo-500" />
                        Account Email Address
                      </span>
                      {formData.email && authEmail !== formData.email && (
                        <button
                          type="button"
                          onClick={() => setAuthEmail(formData.email)}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Use "{formData.email}"
                        </button>
                      )}
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        id="input-auth-email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="your.email@company.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  {/* Password Input (only for signin and register) */}
                  {authMode !== 'forgot' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Lock className="w-3 h-3 text-indigo-500" />
                            Password
                          </label>
                          {authMode === 'signin' && (
                            <button
                              type="button"
                              onClick={() => { setAuthMode('forgot'); setAuthFeedback(null); }}
                              className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              Forgot?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="input-auth-password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-9 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {authMode === 'register' ? (
                        <div>
                          <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                            <Key className="w-3 h-3 text-indigo-500" />
                            Confirm Password
                          </label>
                          <div className="relative">
                            <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              id="input-auth-confirm-password"
                              value={authConfirmPassword}
                              onChange={(e) => setAuthConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="hidden sm:flex flex-col justify-end">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                            Signing in links your time records, punch logs, and compensation profile safely to cloud storage.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        id="btn-auth-signin"
                        onClick={handleEmailSignIn}
                        disabled={authLoading || !authEmail.trim() || !authPassword}
                        className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-2xs transition cursor-pointer"
                      >
                        {authLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Signing In...</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Sign In with Email</span>
                          </>
                        )}
                      </button>
                    )}

                    {authMode === 'register' && (
                      <button
                        type="button"
                        id="btn-auth-register"
                        onClick={handleEmailRegister}
                        disabled={authLoading || !authEmail.trim() || !authPassword || !authConfirmPassword}
                        className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-2xs transition cursor-pointer"
                      >
                        {authLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Creating Account...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Create Email Account</span>
                          </>
                        )}
                      </button>
                    )}

                    {authMode === 'forgot' && (
                      <button
                        type="button"
                        id="btn-auth-reset-password"
                        onClick={handlePasswordReset}
                        disabled={authLoading || !authEmail.trim()}
                        className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white shadow-2xs transition cursor-pointer"
                      >
                        {authLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending link...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Password Reset Email</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Google Sign In option */}
                    <button
                      type="button"
                      id="btn-auth-google"
                      onClick={handleGoogleSignIn}
                      disabled={authLoading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs transition cursor-pointer"
                      title="Sign in with Google account"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Compensation & Workload Targets
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Default Hourly Rate in PHP */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">₱</span>
                    <span className="truncate">Default Hourly Rate *</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    ₱{formData.defaultHourlyRate}/hr
                  </span>
                </div>
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
                <div className="mt-2.5 px-0.5">
                  <input
                    type="range"
                    min="25"
                    max="500"
                    step="5"
                    value={Math.min(500, Math.max(25, formData.defaultHourlyRate || 25))}
                    onChange={(e) => setFormData({ ...formData, defaultHourlyRate: parseFloat(e.target.value) })}
                    className="slider-bar w-full"
                    title={`Rate slider: ₱${formData.defaultHourlyRate}/hr`}
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                    <span>₱25</span>
                    <span>₱250</span>
                    <span>₱500</span>
                  </div>
                </div>
              </div>

              {/* Daily Target Hours */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span className="truncate">Daily Target *</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    {formData.dailyTargetHours}h / day
                  </span>
                </div>
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
                <div className="mt-2.5 px-0.5">
                  <input
                    type="range"
                    min="1"
                    max="16"
                    step="0.5"
                    value={Math.min(16, Math.max(1, formData.dailyTargetHours || 8))}
                    onChange={(e) => setFormData({ ...formData, dailyTargetHours: parseFloat(e.target.value) })}
                    className="slider-bar w-full"
                    title={`Daily target slider: ${formData.dailyTargetHours} hours`}
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                    <span>1h</span>
                    <span>8h standard</span>
                    <span>16h</span>
                  </div>
                </div>
              </div>

              {/* Weekly Target Hours */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span className="truncate">Weekly Target *</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    {formData.weeklyTargetHours}h / week
                  </span>
                </div>
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
                <div className="mt-2.5 px-0.5">
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="1"
                    value={Math.min(60, Math.max(5, formData.weeklyTargetHours || 40))}
                    onChange={(e) => setFormData({ ...formData, weeklyTargetHours: parseFloat(e.target.value) })}
                    className="slider-bar w-full"
                    title={`Weekly target slider: ${formData.weeklyTargetHours} hours`}
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                    <span>5h</span>
                    <span>40h standard</span>
                    <span>60h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cloud Synchronization Section */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                <Cloud className="w-3.5 h-3.5 text-sky-500" />
                Cloud Synchronization & Storage
              </label>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70">
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    !isOnline 
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                      : isSyncing
                      ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-600'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                  }`}>
                    {isSyncing ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />
                    ) : isOnline ? (
                      <Cloud className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <CloudOff className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {isSyncing 
                          ? 'Syncing in progress...' 
                          : !isOnline 
                          ? 'Offline Mode' 
                          : pendingCount > 0 
                          ? `${pendingCount} changes waiting to sync` 
                          : 'Cloud Synced'}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        isOnline 
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {isOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {lastSyncTime ? `Last synced: ${new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Ready to synchronize'}
                    </p>
                  </div>
                </div>

                {onManualSync && (
                  <button
                    type="button"
                    onClick={onManualSync}
                    disabled={isSyncing || !isOnline}
                    id="btn-profile-sync-now"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white shadow-2xs transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Now'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Customize Dashboard Widgets Section */}
            {onOpenWidgetModal && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                  Dashboard Widgets
                </label>
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      Widget Layout & Visibility
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Customize cards on your dashboard (Punch clock, Weekly hours, Overtime)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenWidgetModal}
                    id="btn-profile-customize-widgets"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs transition cursor-pointer flex-shrink-0"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Customize Widgets</span>
                  </button>
                </div>
              </div>
            )}

            {/* Theme Appearance Scheme Setting */}
            {onSetTheme && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                  <Sun className="w-3.5 h-3.5 text-indigo-500" />
                  Appearance Theme Scheme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onSetTheme('light')}
                    id="btn-profile-theme-light"
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      theme === 'light'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-2xs ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-900 dark:text-white">Light Scheme</p>
                      <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400">Clean bright canvas</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSetTheme('dark')}
                    id="btn-profile-theme-dark"
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      theme === 'dark'
                        ? 'border-indigo-500 bg-indigo-950/60 text-white shadow-2xs ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-900 dark:text-white">Dark Scheme</p>
                      <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400">Night mode contrast</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
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
