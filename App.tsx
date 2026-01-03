import JSZip from 'jszip';
import React, { useState, useEffect, useRef } from 'react';
import { AppView, Project, DESIGN_STYLES, DesignStyle, LightingMode, SubscriptionTier, UsageStats, EnvironmentMode, TIER_DETAILS, User, CameraAngle, ENVIRONMENT_TIERS, AspectRatio, RenderMode, RoomType, SavedColor, CompareState, BillingCycle } from './types';
import { generateDesignVision, generateCinematicVideo, formatGeminiError, extractColorFromChip } from './services/geminiService';
import { addWatermark, shouldWatermark } from './services/watermarkService';
import { processImageUpload, optimizeImage } from './services/imageService';
import { storage, isOnline, onOnlineStatusChange } from './services/storageService';
import { authService } from './services/authService';
import { supabase } from './services/supabaseClient';
import { saveProject, loadProjects, deleteProject } from './services/projectSyncService';
import { backendService } from './services/backendService';
import { sharingService } from './services/sharingService';
import { ReportProblemModal } from './components/ReportProblemModal';
import { ColorChipUpload } from './components/ColorChipUpload';
import { CompareView } from './components/CompareView';
import { SpecSheetModal } from './components/SpecSheetModal';
import { ShareModal } from './components/ShareModal';
import { BuilderDashboard } from './components/BuilderDashboard';
import { generateProjectPDF } from './services/pdfService';
import { upscaleImage, upscaleVideo } from './services/upscaleService';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PricingSection } from './components/PricingSection';

const LoadingOverlay = ({ message, variant = 'default', submessage }: { message: string, variant?: 'default' | 'cinematic', submessage?: string }) => (
  <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-700">
    <div className="relative">
      <div className={`w-32 h-32 border-2 ${variant === 'cinematic' ? 'border-amber-500/10' : 'border-white/5'} rounded-full flex items-center justify-center`}>
        <div className={`w-20 h-20 border-t-2 ${variant === 'cinematic' ? 'border-amber-500' : 'border-white'} rounded-full animate-spin`}></div>
      </div>
    </div>
    <div className="space-y-6 text-center max-w-sm px-8">
      {variant === 'cinematic' && <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.5em] mb-2 text-center">CINEMATIC CORE ENGAGED</p>}
      <p className="text-white text-[11px] font-black uppercase tracking-[1.2em] leading-relaxed pl-[1.2em] text-center">{message}</p>
      {submessage && <p className="text-zinc-500 text-[10px] uppercase tracking-widest text-center">{submessage}</p>}
      <div className="w-48 h-[1px] bg-white/10 mx-auto overflow-hidden relative mt-4">
        <div className={`absolute inset-0 h-full ${variant === 'cinematic' ? 'bg-amber-500' : 'bg-white'} animate-[loading-bar_2s_infinite_ease-in-out]`}></div>
      </div>
    </div>
  </div>
);

const CreditTopUpModal = ({ onPurchase, onCancel }: { onPurchase: () => void, onCancel: () => void }) => (
    <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-500">
        <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-12 text-center space-y-12 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            <div className="space-y-4">
                <i className="fa-solid fa-bolt-lightning text-amber-500 text-4xl mb-4"></i>
                <h3 className="text-3xl font-serif-display uppercase tracking-tighter">Archive Credits</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed">Purchase an additional credit block to continue rendering.</p>
            </div>
            <div className="bg-black p-8 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.4em]">Credit Block</p>
                <p className="text-4xl font-serif-display text-white">20 CREDITS</p>
                <p className="text-amber-500 text-sm font-black">$20.00</p>
            </div>
            <div className="space-y-4">
                <button onClick={onPurchase} className="w-full py-6 bg-white text-black text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl active:scale-95 transition-all">Purchase (Apple/Google Pay)</button>
                <button onClick={onCancel} className="w-full text-zinc-600 text-[9px] uppercase tracking-widest">Cancel</button>
            </div>
        </div>
    </div>
);

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingTier, setPendingTier] = useState<SubscriptionTier>(SubscriptionTier.STANDARD);
  const [showTopUp, setShowTopUp] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [renderMode, setRenderMode] = useState<RenderMode>('EXTERIOR');
  const [roomType, setRoomType] = useState<RoomType>(RoomType.KITCHEN);
  const [savedColors, setSavedColors] = useState<SavedColor[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [compareState, setCompareState] = useState<CompareState | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showSpecSheet, setShowSpecSheet] = useState(false);
  const [showBuilderDashboard, setShowBuilderDashboard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingProfileName, setEditingProfileName] = useState(false);
  const [profileNameValue, setProfileNameValue] = useState('');

  // Close account menu when clicking outside
  useEffect(() => {
    if (!showAccountMenu) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-account-menu]')) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showAccountMenu]);
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [interiorMaterials, setInteriorMaterials] = useState<{ flooring?: string; cabinets?: string; countertops?: string; backsplash?: string }>({});
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('ANNUAL');
  const [usage, setUsage] = useState<UsageStats>({ 
    rendersCount: 0, cineRenderCount: 0, 
    lastRenderAt: 0, 
    tier: SubscriptionTier.FREE_TRIAL, 
    credits: 3, 
    isSubscribed: false 
  });

  useEffect(() => {
    const initApp = async () => {
      try {
        if (typeof (window as any).aistudio !== 'undefined') {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        }

        await storage.init();
        const user = await authService.getCurrentUser();
        const savedProjects = await storage.getAllProjects();
        const savedUsage = await storage.getUsage();
        const colors = await storage.getAllColors();
        const pending = await storage.getPendingSyncItems();
        
        if (savedProjects.length > 0) setProjects(savedProjects);
        if (colors.length > 0) setSavedColors(colors);
        setPendingSyncCount(pending.length);
        
        if (savedUsage) {
          setUsage(savedUsage);
        }
        if (user) {
          setUsage({ 
            tier: user.tier, 
            credits: user.creditsLimit, 
            rendersCount: user.creditsUsed, 
            cineRenderCount: 0, 
            lastRenderAt: Date.now(), 
            isSubscribed: false 
          });
          const cloudProjects = await loadProjects(user.id); 
          if (cloudProjects.length > 0) setProjects(cloudProjects); 
          setCurrentUser(user); 
          setView(AppView.DASHBOARD); 
        }
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    initApp();
    
    const unsubscribe = onOnlineStatusChange((online) => {
      setIsOffline(!online);
      if (online) {
        storage.getPendingSyncItems().then(items => setPendingSyncCount(items.length));
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading) { storage.saveProjects(projects); storage.saveUsage(usage); }
  }, [projects, usage, isLoading]);

  const handleAuthSuccess = async (user: User & { creditsUsed?: number; creditsLimit?: number }) => {
    setCurrentUser(user);
    setUsage(prev => ({ 
      ...prev, 
      tier: user.tier, 
      credits: user.creditsLimit ?? TIER_DETAILS[user.tier].renders, 
      rendersCount: user.creditsUsed ?? 0 
    }));
    setView(AppView.DASHBOARD);
    const cloudProjects = await loadProjects(user.id);
    if (cloudProjects.length > 0) {
      setProjects(cloudProjects);
    }
  };

  const handleLogout = async () => {
      await authService.logout();
      setCurrentUser(null);
      setView(AppView.LANDING);
      setShowAccountMenu(false);
  };

  const handleRefresh = async () => {
    if (isRefreshing || !currentUser) return;
    setIsRefreshing(true);
    try {
      const cloudProjects = await loadProjects(currentUser.id);
      if (cloudProjects.length > 0) setProjects(cloudProjects);
      const { data } = await supabase.from("profiles").select("credits_used, credits_limit").eq("id", currentUser.id).single();
      if (data) {
        setUsage(prev => ({ ...prev, rendersCount: data.credits_used || 0, credits: data.credits_limit || prev.credits }));
      }
    } catch (e) { console.error("Refresh failed:", e); }
    finally { setIsRefreshing(false); }
  };


  const handleDeleteProject = async (id: string) => {
    if (!confirm("Permanently archive this vision?")) return;
    await storage.deleteProject(id);
    await deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handlePurchaseCredits = async () => {
      setIsPurchasing(true);
      try {
        const { url } = await backendService.purchaseCreditPack();
        if (url.includes('credits=purchased')) {
          setUsage(prev => ({ ...prev, credits: prev.credits + 20 }));
          setShowTopUp(false);
          alert("20 Credits added to your Archive.");
        } else {
          window.location.href = url;
        }
      } catch (e: any) {
        alert(e.message || 'Purchase failed');
      } finally {
        setIsPurchasing(false);
      }
  };

  const handleProjectUpload = async (file: File) => {
    if (usage.credits - usage.rendersCount <= 0) { setShowTopUp(true); return; }
    setIsLoading(true);
    try {
      const processed = await processImageUpload(file);
      const newProject: Project = {
        id: crypto.randomUUID(),
        name: file.name.split('.')[0].toUpperCase(),
        imageUrl: processed.coverImage,
        createdAt: Date.now(),
        generatedRenderings: [],
        generatedFloorPlans: [],
        generatedVideos: [],
        lighting: LightingMode.GOLDEN,
        environment: EnvironmentMode.EXISTING,
        cameraAngle: CameraAngle.FRONT,
        activeStyleId: 'original',
        referenceImages: [],
        customDirectives: '',
        preferredAspectRatio: "16:9"
      };
      setProjects(prev => [newProject, ...prev]);
      if (currentUser) saveProject(newProject, currentUser.id);
      setCurrentProjectId(newProject.id);
      setTimeout(() => { setView(AppView.EDITOR); setIsLoading(false); }, 800);
    } catch (e) { setIsLoading(false); alert("Upload failed."); }
  };

  const handleOpenSelectKey = async () => {
    await (window as any).aistudio.openSelectKey();
    setHasApiKey(true);
  };

  const GlobalHeader = () => (
    <header className="fixed top-0 inset-x-0 h-28 pt-14 md:pt-0 md:h-20 glass-panel border-b border-transparent md:border-white/5 z-[1000] px-8 md:px-12 flex items-center justify-between">
        <button onClick={handleRefresh} className={`font-serif-display text-2xl tracking-[0.2em] transition-all duration-300 ${isRefreshing ? "animate-pulse" : "hover:text-amber-500"}`} style={{ color: isRefreshing ? "#0ABAB5" : "white" }}>CLAD</button>
        
        <div className="relative">
            <button 
                data-account-menu
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2.5 rounded-full transition-all active:scale-95"
            >
                <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[8px] font-black">{currentUser?.name?.charAt(0)}</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Principal Architect</span>
                <i className={`fa-solid fa-chevron-down text-[8px] transition-transform ${showAccountMenu ? 'rotate-180' : ''}`}></i>
            </button>

            {showAccountMenu && (
                <div data-account-menu className="absolute top-full right-0 mt-4 w-64 bg-zinc-900/95 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-4 animate-in fade-in slide-in-from-top-4 duration-300 z-50">
                    <div className="p-4 border-b border-white/5 mb-4">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest truncate">{currentUser?.name}</p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">{usage.tier}</p>
                    </div>
                    <div className="space-y-1">
                        <button onClick={() => { setView(AppView.ACCOUNT); setShowAccountMenu(false); }} className="w-full text-left p-4 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-4">
                            <i className="fa-solid fa-sliders text-zinc-500"></i> Account Specification
                        </button>
                        <button onClick={() => { setView(AppView.MEMBERSHIP); setShowAccountMenu(false); }} className="w-full text-left p-4 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-4">
                            <i className="fa-solid fa-vault text-zinc-500"></i> Upgrade Archive
                        </button>
                        <button onClick={handleLogout} className="w-full text-left p-4 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 transition-all flex items-center gap-4">
                            <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
                        </button>
                    </div>
                    <div className="border-t border-white/5 pt-4 mt-4 flex gap-4 justify-center">
                        <a href="/privacy.html" target="_blank" className="text-[8px] text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Privacy</a>
                        <a href="/terms.html" target="_blank" className="text-[8px] text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Terms</a>
                    </div>
                </div>
            )}
        </div>
    </header>
  );

  return (
    <div className="bg-black h-screen w-full text-white overflow-hidden flex flex-col fixed inset-0">
      {isLoading && <LoadingOverlay message="VIRTUALIZING ARCHITECTURAL SPACE" />}
      {showTopUp && <CreditTopUpModal onPurchase={handlePurchaseCredits} onCancel={() => setShowTopUp(false)} />}
      {showReportModal && <ReportProblemModal onClose={() => setShowReportModal(false)} />}
      {showShare && currentProjectId && (
        <ShareModal 
          project={projects.find(p => p.id === currentProjectId)!}
          onClose={() => setShowShare(false)}
        />
      )}
      {showCompare && compareState && (
        <CompareView 
          compareState={compareState}
          onClose={() => setShowCompare(false)}
          onShare={() => { setShowCompare(false); setShowShare(true); }}
        />
      )}
      {showSpecSheet && currentProjectId && (
        <SpecSheetModal
          imageUrl={projects.find(p => p.id === currentProjectId)?.generatedRenderings?.slice(-1)[0] || ""}
          styleName={DESIGN_STYLES.find(s => s.id === projects.find(p => p.id === currentProjectId)?.activeStyleId)?.name || "Custom"}
          projectName={projects.find(p => p.id === currentProjectId)?.name || "Project"}
          onClose={() => setShowSpecSheet(false)}
        />
      )}
      {currentUser && view !== AppView.EDITOR && <GlobalHeader />}

      {!hasApiKey && (
        <div className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
            <div className="max-w-md w-full text-center space-y-12">
                <i className="fa-solid fa-key text-5xl text-amber-500"></i>
                <h2 className="text-4xl font-serif-display uppercase tracking-tighter">Archive Activation Required</h2>
                <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] leading-relaxed">
                    Accessing Pro features like VEO Cinematic Previews requires a connected API key from a paid GCP project.
                </p>
                <div className="space-y-6">
                    <button 
                        onClick={handleOpenSelectKey}
                        className="w-full py-7 bg-white text-black text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl active:scale-95 transition-all"
                    >
                        Authorize Project Key
                    </button>
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest">
                        View <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-zinc-400 underline">Billing Documentation</a>
                    </p>
                </div>
            </div>
        </div>
      )}

      {view === AppView.LANDING && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black">
          <h1 className="font-serif-display text-9xl tracking-tighter mb-8 animate-fade-in">CLAD</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.8em] mb-12 text-center max-w-sm italic">The Digital Atelier for Luxury Builders</p>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button onClick={() => { setPendingTier(SubscriptionTier.FREE_TRIAL); setView(AppView.SIGNUP); }} className="bg-white text-black py-7 text-[11px] font-black uppercase tracking-[0.5em] active:scale-95 transition-all shadow-2xl">Start Free Trial</button>
            <button onClick={() => setView(AppView.LOGIN)} className="bg-transparent text-white border border-white/10 py-5 text-[11px] font-black uppercase tracking-[0.5em] hover:bg-white/5 transition-all">Principal Login</button>
          </div>
        </div>
      )}

      {view === AppView.MEMBERSHIP && (
        <MembershipPortal 
            onSelectTier={(t) => { setPendingTier(t); setView(AppView.CHECKOUT); }} 
            onBack={() => setView(currentUser ? AppView.DASHBOARD : AppView.LANDING)}
        />
      )}

      {view === AppView.CHECKOUT && (
        <CheckoutFlow 
            tier={pendingTier} 
            onSuccess={() => setView(AppView.SIGNUP)} 
            onCancel={() => setView(AppView.MEMBERSHIP)}
        />
      )}

      {view === AppView.SIGNUP && (
        <SignupStep 
            tier={pendingTier}
            onComplete={(user) => { handleAuthSuccess(user); }}
            onBack={() => setView(AppView.LANDING)}
        />
      )}

      {view === AppView.LOGIN && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black">
          <div className="w-full max-w-md space-y-12 text-center">
            <h2 className="text-6xl font-serif-display uppercase tracking-tighter">Principal</h2>
            <div className="bg-zinc-900 border border-white/5 p-10 text-left space-y-8 rounded-[2rem] shadow-2xl">
                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                    <p className="text-red-500 text-[10px] uppercase tracking-widest">{loginError}</p>
                  </div>
                )}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Credential</p>
                    <input type="email" placeholder="EMAIL@CLAD.AI" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-black border border-white/10 p-5 text-[11px] tracking-widest focus:border-white focus:outline-none uppercase" />
                </div>
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Passphrase</p>
                    <input type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-black border border-white/10 p-5 text-[11px] tracking-widest focus:border-white focus:outline-none" />
                </div>
                <button onClick={async () => {
                    setLoginError('');
                    setIsLoading(true);
                    try {
                      const user = await authService.login(loginEmail, loginPassword);
                      handleAuthSuccess(user);
                    } catch (e: any) {
                      setLoginError(e.message || 'Login failed');
                    } finally {
                      setIsLoading(false);
                    }
                  }} className="w-full bg-white text-black py-6 text-[11px] font-black uppercase tracking-[0.5em] active:scale-95 transition-all">Authorize Vision</button>
            </div>
            <button onClick={async () => { if (!loginEmail) { setLoginError("Enter your email first"); return; } try { await supabase.auth.resetPasswordForEmail(loginEmail, { redirectTo: window.location.origin }); setLoginError("Password reset email sent!"); } catch (e) { setLoginError("Failed to send reset email"); } }} className="text-amber-500 text-[10px] uppercase tracking-widest hover:text-amber-400">Forgot Password?</button>
            <button onClick={() => setView(AppView.LANDING)} className="text-zinc-600 text-[10px] uppercase tracking-widest">Back to Studio Entrance</button>
          </div>
        </div>
      )}

      {view === AppView.DASHBOARD && (
        <div className="flex-1 flex flex-col p-6 md:p-16 pt-32 overflow-y-auto bg-black scrollbar-hide">
          <div className="max-w-7xl mx-auto w-full mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
            <div className="space-y-4">
              <h1 className="font-serif-display text-7xl md:text-9xl md:pt-4 leading-[1.1] tracking-tighter uppercase">Studio</h1>
              <div className="flex flex-wrap items-center gap-6 py-4 px-8 bg-zinc-900/40 rounded-full border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-zinc-500 text-[9px] uppercase tracking-[0.3em] font-black">Archive: <span className="text-white whitespace-nowrap">{usage.tier}</span></p>
                </div>
                <div className="w-[1px] h-4 bg-white/10"></div>
                <p className="text-zinc-500 text-[9px] uppercase tracking-[0.3em] font-black">Credits: <span className="text-emerald-500">{usage.credits - usage.rendersCount}</span></p>
                <button onClick={() => setShowTopUp(true)} className="text-[9px] font-black text-white underline uppercase tracking-widest hover:text-amber-500 transition-colors">Purchase Credits</button>
              </div>
            </div>
            <label className="px-12 py-7 bg-white text-black text-[11px] font-black uppercase tracking-[0.5em] cursor-pointer shadow-2xl active:scale-95 transition-transform flex-shrink-0">
                + New Vision
                <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleProjectUpload(e.target.files[0])} />
            </label>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-7xl mx-auto w-full mb-10">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 text-sm"></i>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-full py-4 pl-14 pr-6 text-white text-[11px] font-medium tracking-wide placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl mx-auto w-full pb-20">
            {projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
              <div key={p.id} className="aspect-[4/5] bg-zinc-900 border border-white/5 rounded-2xl relative group overflow-hidden shadow-2xl transition-all hover:border-white/20">
                <img onClick={() => { setCurrentProjectId(p.id); setView(AppView.EDITOR); }} src={(p.generatedRenderings?.length > 0) ? p.generatedRenderings[p.generatedRenderings.length-1] : p.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 cursor-pointer" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-60 pointer-events-none"></div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDeleteProject(p.id)} className="w-10 h-10 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                        <i className="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                </div>
                <div className="absolute bottom-8 left-8 space-y-2">
                    {editingProjectId === p.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => {
                          if (editingName.trim()) {
                            const updated = projects.map(proj => proj.id === p.id ? {...proj, name: editingName.trim()} : proj);
                            setProjects(updated);
                            if (currentUser) saveProject({...p, name: editingName.trim()}, currentUser.id);
                          }
                          setEditingProjectId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          if (e.key === 'Escape') setEditingProjectId(null);
                        }}
                        autoFocus
                        className="bg-black/80 border border-white/20 rounded px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] w-[150px] focus:outline-none focus:border-amber-500"
                      />
                    ) : (
                      <p 
                        onClick={(e) => { e.stopPropagation(); setEditingProjectId(p.id); setEditingName(p.name); }}
                        className="text-[10px] font-black uppercase tracking-[0.4em] truncate max-w-[150px] cursor-pointer hover:text-amber-500 transition-colors"
                      >{p.name}</p>
                    )}
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest pointer-events-none">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === AppView.ACCOUNT && currentUser && (
          <div className="flex-1 flex flex-col p-6 md:p-16 pt-32 overflow-y-auto bg-black scrollbar-hide">
            <div className="max-w-4xl mx-auto w-full space-y-20 pb-32">
                <header className="space-y-4">
                    <h2 className="font-serif-display text-7xl tracking-tighter uppercase">Account</h2>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.8em]">Architectural Profile & Archive Status</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <section className="bg-zinc-900 border border-white/5 p-12 rounded-[2.5rem] space-y-10">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Master Specification</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-[9px] text-zinc-600 uppercase tracking-widest">Full Name</p>
                                {editingProfileName ? (
                                  <input
                                    type="text"
                                    value={profileNameValue}
                                    onChange={(e) => setProfileNameValue(e.target.value)}
                                    onBlur={async () => {
                                      if (profileNameValue.trim() && currentUser) {
                                        await authService.updateProfile({ name: profileNameValue.trim() });
                                        setCurrentUser({...currentUser, name: profileNameValue.trim()});
                                      }
                                      setEditingProfileName(false);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                      if (e.key === 'Escape') setEditingProfileName(false);
                                    }}
                                    autoFocus
                                    className="bg-black border border-white/20 rounded-lg px-4 py-2 text-lg font-medium w-full focus:outline-none focus:border-amber-500"
                                  />
                                ) : (
                                  <p 
                                    onClick={() => { setEditingProfileName(true); setProfileNameValue(currentUser.name); }}
                                    className="text-lg font-medium cursor-pointer hover:text-amber-500 transition-colors flex items-center gap-2"
                                  >
                                    {currentUser.name}
                                    <i className="fa-solid fa-pen text-[10px] text-zinc-600"></i>
                                  </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] text-zinc-600 uppercase tracking-widest">Studio Email</p>
                                <p className="text-lg font-medium">{currentUser.email}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] text-zinc-600 uppercase tracking-widest">Archive Identity</p>
                                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{usage.tier}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-zinc-900 border border-white/5 p-12 rounded-[2.5rem] space-y-10">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Vision Credits</h3>
                        <div className="space-y-8">
                            <div className="flex justify-between items-end border-b border-white/5 pb-6">
                                <div>
                                    <p className="text-4xl font-serif-display">{usage.credits - usage.rendersCount}</p>
                                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-2">Available Renders</p>
                                </div>
                                <button onClick={() => setShowTopUp(true)} className="text-[10px] font-black text-white underline uppercase tracking-widest hover:text-amber-500 transition-colors">Top Up</button>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[9px] text-zinc-600 uppercase tracking-widest">Active Plan: <span className="text-white">{TIER_DETAILS[usage.tier].price} / MO</span></p>
                                <button onClick={() => setView(AppView.MEMBERSHIP)} className="w-full py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all">Manage Subscription</button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Tutorial Section */}
                <section className="bg-zinc-900 border border-white/5 p-12 rounded-[2.5rem] space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500">How to Use CLAD</h3>
                    
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <span className="text-amber-500 text-[10px] font-black">1</span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium mb-1">Upload Your Photo</p>
                                <p className="text-zinc-500 text-[11px] leading-relaxed">Click "+ New Vision" and upload a photo of your home's exterior. For best results, use a clear front-facing photo in good lighting.</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <span className="text-amber-500 text-[10px] font-black">2</span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium mb-1">Choose Your Style</p>
                                <p className="text-zinc-500 text-[11px] leading-relaxed">Browse 31 architectural styles from Modern Farmhouse to Mediterranean. Each style has unique DNA that transforms your home's finishes while preserving its structure.</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <span className="text-amber-500 text-[10px] font-black">3</span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium mb-1">Customize Settings</p>
                                <p className="text-zinc-500 text-[11px] leading-relaxed">Adjust lighting (Golden Hour, Overcast, etc.), camera angle, site context, and canvas format. Add custom instructions for specific changes.</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <span className="text-amber-500 text-[10px] font-black">4</span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium mb-1">Magic Pencil & Materials</p>
                                <p className="text-zinc-500 text-[11px] leading-relaxed">Use Magic Pencil to extract colors from photos. Select specific materials for siding, roofing, stone, and trim. Upload reference images to guide material choices.</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <span className="text-amber-500 text-[10px] font-black">5</span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium mb-1">Execute Vision</p>
                                <p className="text-zinc-500 text-[11px] leading-relaxed">Click "Execute Vision" to generate your rendering. Each image render uses 1 credit. Toggle to Cinematic mode for video renders (5 credits).</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <span className="text-amber-500 text-[10px] font-black">6</span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium mb-1">Save & Share</p>
                                <p className="text-zinc-500 text-[11px] leading-relaxed">Download renders, share via email, or compare before/after with the Compare tool. All projects auto-save to your studio.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/5">
                        <p className="text-zinc-600 text-[10px] uppercase tracking-widest mb-3">Pro Tips</p>
                        <ul className="space-y-2 text-zinc-500 text-[11px]">
                            <li>• Use reference images to guide specific material choices</li>
                            <li>• Tap the CLAD logo to refresh and sync your projects</li>
                            <li>• Click project names on dashboard to rename them</li>
                            <li>• Use the search bar to quickly find projects</li>
                            <li>• Cinematic videos create stunning fly-around animations</li>
                        </ul>
                    </div>
                </section>

                <div className="pt-12 flex justify-center">
                    <button onClick={() => setView(AppView.DASHBOARD)} className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 hover:text-white transition-colors flex items-center gap-4">
                        <i className="fa-solid fa-arrow-left"></i> Return to Studio
                    </button>
                </div>
            </div>
          </div>
      )}

      {view === AppView.EDITOR && projects.find(p => p.id === currentProjectId) && (
        <EditorView 
          project={projects.find(p => p.id === currentProjectId)!} 
          userTier={usage.tier}
          user={currentUser}
          onBack={() => setView(AppView.DASHBOARD)}
          onUpgrade={() => setView(AppView.MEMBERSHIP)}
          onTopUp={() => setShowTopUp(true)}
          onReAuthorize={handleOpenSelectKey}
          creditsAvailable={usage.credits - usage.rendersCount}
          setShowCompare={setShowCompare}
          setCompareState={setCompareState}
          setShowShare={setShowShare}
          setShowSpecSheet={setShowSpecSheet}
          onUpdateProject={(u: Project, creditCost: number = 1) => { 
            if (currentUser) {
              saveProject(u, currentUser.id);
              supabase.rpc("increment_credits", { user_id: currentUser.id, amount: creditCost }).then(({ error }) => { if (error) console.error("[CREDITS RPC ERROR]", error); else console.log("[CREDITS] Added", creditCost); });
            }
            setProjects(prev => prev.map(p => p.id === u.id ? u : p)); 
            setUsage(prev => ({...prev, rendersCount: prev.rendersCount + creditCost})); 
          }}
        />
      )}
    </div>
  );
}

const MembershipPortal = ({ onSelectTier, onBack }: { onSelectTier: (t: SubscriptionTier) => void, onBack: () => void }) => {
    const [selectedDetailTier, setSelectedDetailTier] = useState<SubscriptionTier | null>(null);

    return (
        <div className="flex-1 overflow-y-auto p-8 md:p-20 pt-32 pb-32 bg-black scrollbar-hide relative">
            <button onClick={onBack} className="fixed top-16 left-6 z-50 w-12 h-12 bg-black/80 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all border border-white/10"><i className="fa-solid fa-arrow-left"></i></button>
            <div className="max-w-6xl mx-auto space-y-20">
                <header className="text-center space-y-6">
                    <h2 className="text-7xl font-serif-display uppercase tracking-tighter">Archive Access</h2>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-[0.8em] font-black italic">Select your architectural intelligence tier</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[SubscriptionTier.STANDARD, SubscriptionTier.PRO, SubscriptionTier.ENTERPRISE].map((tierKey) => {
                        const details = TIER_DETAILS[tierKey];
                        return (
                            <div key={tierKey} className="group bg-zinc-900 border border-white/5 p-10 rounded-[3rem] space-y-10 flex flex-col hover:border-white transition-all cursor-pointer shadow-2xl" onClick={() => setSelectedDetailTier(tierKey)}>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{details.name}</p>
                                    <p className="text-5xl font-serif-display">{details.priceMonthly}</p>
                                </div>
                                <div className="flex-1 space-y-8">
                                    <ul className="space-y-3">
                                        {details.features.map(f => (
                                            <li key={f} className="text-[9px] uppercase tracking-widest flex items-center gap-3">
                                                <i className="fa-solid fa-check text-emerald-500 text-[8px]"></i>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button className="w-full py-5 bg-white text-black text-[11px] font-black uppercase tracking-[0.4em] group-hover:bg-amber-500 transition-all">Select Plan</button>
                            </div>
                        );
                    })}
                </div>
                <div className="text-center pt-12">
                    <button onClick={onBack} className="text-zinc-600 text-[10px] uppercase tracking-[0.4em] hover:text-white transition-colors">Return to Studio</button>
                </div>
            </div>

            {selectedDetailTier && (
                <div className="fixed inset-0 z-[2500] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-zinc-900 border border-white/10 w-full max-w-4xl rounded-[4rem] p-12 md:p-20 space-y-16 relative overflow-y-auto max-h-[90vh] scrollbar-hide">
                        <button onClick={() => setSelectedDetailTier(null)} className="absolute top-10 right-10 w-12 h-12 flex items-center justify-center border border-white/10 rounded-full hover:bg-white/5"><i className="fa-solid fa-xmark"></i></button>
                        
                        <div className="text-center space-y-6">
                            <h3 className="text-5xl font-serif-display uppercase tracking-tighter">{TIER_DETAILS[selectedDetailTier].name}</h3>
                            <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.8em]">Complete Specification Sheet</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            <section className="space-y-8">
                                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] border-b border-white/5 pb-4">Style DNAs</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {((TIER_DETAILS[selectedDetailTier] as any).styles || []).map((s: string) => (
                                        <div key={s} className="text-[9px] uppercase tracking-widest text-zinc-500 flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30"></div>
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            </section>
                            <section className="space-y-8">
                                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] border-b border-white/5 pb-4">Site Contexts</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {((TIER_DETAILS[selectedDetailTier] as any).environments || []).map((e: string) => (
                                        <div key={e} className="text-[9px] uppercase tracking-widest text-zinc-500 flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30"></div>
                                            {e}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="pt-10 flex flex-col md:flex-row gap-6">
                            <button onClick={() => onSelectTier(selectedDetailTier)} className="flex-1 py-7 bg-white text-black text-[11px] font-black uppercase tracking-[0.5em] active:scale-95 transition-all">Authorize Plan: {TIER_DETAILS[selectedDetailTier].price}</button>
                            <button onClick={() => setSelectedDetailTier(null)} className="md:w-48 py-7 bg-zinc-800 text-white text-[11px] font-black uppercase tracking-[0.5em]">Dismiss</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CheckoutFlow = ({ tier, onSuccess, onCancel }: any) => {
    const [step, setStep] = useState<'pay' | 'processing'>('pay');
    const [error, setError] = useState('');
    const details = TIER_DETAILS[tier];

    const handlePay = async () => {
        setStep('processing');
        setError('');
        try {
            const { url } = await backendService.createCheckoutSession(tier);
            if (url.includes('checkout=success')) {
                setTimeout(() => onSuccess(), 1500);
            } else {
                window.location.href = url;
            }
        } catch (e: any) {
            setError(e.message || 'Payment failed');
            setStep('pay');
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-black p-8">
            <div className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] p-12 space-y-12 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                {step === 'pay' ? (
                    <>
                        <div className="text-center space-y-4">
                            <h3 className="text-3xl font-serif-display uppercase">Checkout</h3>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Enrolling in {details.name}</p>
                        </div>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                                <p className="text-red-500 text-[10px] uppercase tracking-widest text-center">{error}</p>
                            </div>
                        )}
                        <div className="bg-black p-6 rounded-2xl flex justify-between items-center border border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Total Deposit</span>
                            <span className="text-2xl font-serif-display">{details.priceMonthly}</span>
                        </div>
                        <div className="space-y-4">
                            <button onClick={handlePay} className="w-full py-6 bg-white text-black rounded-xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-transform">
                                <i className="fa-solid fa-credit-card"></i>
                                <span className="text-[11px] font-black uppercase tracking-widest">Continue to Payment</span>
                            </button>
                        </div>
                        <button onClick={onCancel} className="w-full text-zinc-600 text-[9px] uppercase tracking-widest text-center">Cancel Transaction</button>
                    </>
                ) : (
                    <div className="py-20 flex flex-col items-center space-y-10">
                        <div className="w-16 h-16 border-t-2 border-white rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">Confirming Archive Access...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const SignupStep = ({ tier, onComplete, onBack }: any) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [pass, setPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleFinish = async () => {
        if (!email || !pass || pass !== confirm) { setError("All fields required and passwords must match."); return; }
        setIsSubmitting(true);
        setError('');
        try {
            const user = await authService.register(email, pass, name || email.split('@')[0]);
            onComplete({ ...user, tier });
        } catch (e: any) {
            setError(e.message || 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-black p-8 pt-16">
            <button onClick={onBack} className="self-start mb-4 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"><i className="fa-solid fa-arrow-left text-white"></i></button>
            <div className="flex-1 flex items-center justify-center">
            <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-12 space-y-12 shadow-2xl">
                <div className="text-center space-y-4">
                    <i className="fa-solid fa-shield-halved text-emerald-500 text-4xl"></i>
                    <h3 className="text-3xl font-serif-display uppercase">Create Account</h3>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-relaxed">Setup your CLAD Archive credentials.</p>
                </div>
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                        <p className="text-red-500 text-[10px] uppercase tracking-widest text-center">{error}</p>
                    </div>
                )}
                <div className="space-y-6">
                    <input type="email" placeholder="EMAIL ADDRESS" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-white/10 p-5 text-[11px] tracking-widest focus:border-white focus:outline-none uppercase" />
                    <input type="text" placeholder="STUDIO NAME (OPTIONAL)" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-white/10 p-5 text-[11px] tracking-widest focus:border-white focus:outline-none uppercase" />
                    <input type="password" placeholder="CREATE PASSPHRASE" value={pass} onChange={e => setPass(e.target.value)} className="w-full bg-black border border-white/10 p-5 text-[11px] tracking-widest focus:border-white focus:outline-none uppercase" />
                    <input type="password" placeholder="CONFIRM PASSPHRASE" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full bg-black border border-white/10 p-5 text-[11px] tracking-widest focus:border-white focus:outline-none uppercase" />
                    <button onClick={handleFinish} disabled={isSubmitting} className="w-full bg-white text-black py-6 text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl active:scale-95 transition-all disabled:opacity-50">
                        {isSubmitting ? 'Creating...' : 'Start Free Trial'}
                    </button>
                </div>
            </div>
            </div>
        </div>
    );
};

const EditorView = ({ project, userTier, user, onBack, onUpdateProject, onUpgrade, onTopUp, onReAuthorize, creditsAvailable, setShowCompare, setCompareState, setShowShare, setShowSpecSheet }: any) => {
  const [style, setStyle] = useState(DESIGN_STYLES.find(s => s.id === project.activeStyleId) || DESIGN_STYLES[0]);
  const [env, setEnv] = useState(project.environment || EnvironmentMode.EXISTING);
  const [light, setLight] = useState(project.lighting || LightingMode.GOLDEN);
  const [angle, setAngle] = useState(project.cameraAngle || CameraAngle.FRONT);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(project.preferredAspectRatio || "16:9");
  const [magicPencil, setMagicPencil] = useState(project.customDirectives || '');
  const [viewMode, setViewMode] = useState<'3D' | 'CINEMATIC'>('3D');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCinematic, setIsCinematic] = useState(false);
  const [refImages, setRefImages] = useState<string[]>(project.referenceImages || []);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 1024);
  const [renderMode, setRenderMode] = useState<"EXTERIOR" | "INTERIOR">(project.renderMode || "EXTERIOR");
  const [roomType, setRoomType] = useState<RoomType>(project.roomType || RoomType.KITCHEN);
  const [interiorMaterials, setInteriorMaterials] = useState<{ flooring?: string; cabinets?: string; countertops?: string; backsplash?: string }>(project.interiorMaterials || {});
  
  const [renderIdx, setRenderIdx] = useState(project.generatedRenderings?.length > 0 ? project.generatedRenderings.length - 1 : -1);
  const [videoIdx, setVideoIdx] = useState(project.generatedVideos?.length > 0 ? project.generatedVideos.length - 1 : -1);
  const [hdVersions, setHdVersions] = useState<{[key: number]: string}>(project.hdVersions || {});
  const [hdVideoVersions, setHdVideoVersions] = useState<{[key: number]: string}>(project.hdVideoVersions || {});
  const [isUpscaling, setIsUpscaling] = useState(false);

  const tierValue = (t: SubscriptionTier) => {
      if (t === SubscriptionTier.ENTERPRISE) return 3;
      if (t === SubscriptionTier.PRO) return 2;
      return 1;
  };
  const filteredStyles = DESIGN_STYLES.filter(s => tierValue(s.tier) <= tierValue(userTier));
  const filteredEnvironments = Object.values(EnvironmentMode).filter(e => tierValue(ENVIRONMENT_TIERS[e]) <= tierValue(userTier));

  const handleExecute = async () => {
    let wakeLock: any = null;
    try { wakeLock = await navigator.wakeLock?.request("screen"); } catch (e) { console.log("Wake lock not supported"); }
    if (creditsAvailable <= 0) { onTopUp(); return; }
    setIsProcessing(true);
    try {
      const activeProject = { ...project, environment: env, lighting: light, cameraAngle: angle, customDirectives: magicPencil, referenceImages: refImages, preferredAspectRatio: aspectRatio, renderMode, roomType, interiorMaterials };
      const result = await generateDesignVision(activeProject, style, magicPencil, true, aspectRatio);
      const optimized = await optimizeImage(result);
      const finalImage = shouldWatermark(userTier) ? await addWatermark(optimized) : optimized;
      const newRenders = [...(project.generatedRenderings || []), finalImage];
      onUpdateProject({ ...activeProject, generatedRenderings: newRenders, activeStyleId: style.id, customDirectives: magicPencil }, 1);
      setRenderIdx(newRenders.length - 1);
      setViewMode('3D');
      setShowSidebar(false);
    } catch (e: any) { 
        const msg = formatGeminiError(e);
        if (msg.includes("re-authorize")) {
            await onReAuthorize();
        } else {
            alert(msg);
        }
    }
    finally { setIsProcessing(false); if (wakeLock) wakeLock.release(); }
  };

  const handleCinematic = async () => {
    let wakeLock: any = null;
    try { wakeLock = await navigator.wakeLock?.request("screen"); } catch (e) { console.log("Wake lock not supported"); }
    if (creditsAvailable < 5) { onTopUp(); return; }
    const currentImg = renderIdx >= 0 ? project.generatedRenderings[renderIdx] : project.imageUrl;
    setIsCinematic(true);
    try {
      const videoUrl = await generateCinematicVideo(currentImg, style.dna + " " + magicPencil, aspectRatio);
      const newVideos = [...(project.generatedVideos || []), videoUrl];
      onUpdateProject({ ...project, generatedVideos: newVideos, customDirectives: magicPencil }, 5);
      setVideoIdx(newVideos.length - 1);
      setViewMode('CINEMATIC');
      setShowSidebar(false);
    } catch (e: any) { 
        const msg = formatGeminiError(e);
        if (msg.includes("re-authorize")) {
            await onReAuthorize();
        } else {
            alert(msg);
        }
    }
    finally { setIsCinematic(false); if (wakeLock) wakeLock.release(); }
  };

  const handleRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      const newRefs = [...refImages];
      for (let i = 0; i < files.length; i++) {
          if (newRefs.length >= 10) break;
          const processed = await processImageUpload(files[i]);
          newRefs.push(processed.coverImage);
      }
      setRefImages(newRefs);
      onUpdateProject({ ...project, referenceImages: newRefs }, 0);
  };

  const activeImage = viewMode === '3D' 
    ? (renderIdx >= 0 ? project.generatedRenderings[renderIdx] : project.imageUrl)
    : null;

  const activeVideo = viewMode === 'CINEMATIC' && videoIdx >= 0 ? project.generatedVideos[videoIdx] : null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-[1500] overflow-hidden">
      {isProcessing && <LoadingOverlay message="CALIBRATING ARCHITECTURAL LIGHT" />}
      {isCinematic && <LoadingOverlay message="ORBITING CINEMATIC CORE" variant="cinematic" />}
      {isUpscaling && <LoadingOverlay message="ENHANCING TO 4K RESOLUTION" submessage="Keep screen on • This may take several minutes" />}
      
      <header className="h-32 pt-10 md:pt-0 md:h-24 border-b border-white/5 px-4 md:px-12 flex items-center justify-between bg-black shrink-0 relative z-[1600]">
        <div className="flex items-center gap-4 md:gap-8 flex-shrink-0 min-w-0">
            <button onClick={onBack} className="text-[11px] font-black uppercase text-zinc-500 hover:text-white transition-colors tracking-[0.4em] flex-shrink-0">BACK</button>
            <div className="flex bg-zinc-900 p-1 rounded-full border border-white/10 flex-shrink-0 overflow-hidden">
                <button onClick={() => setViewMode('3D')} className={`px-4 md:px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${viewMode === '3D' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>3D</button>
                {renderMode === "EXTERIOR" && <button onClick={() => setViewMode('CINEMATIC')} className={`px-4 md:px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${viewMode === 'CINEMATIC' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Cinematic</button>}
            </div>
            <button onClick={() => setShowSidebar(!showSidebar)} className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-full text-[10px] font-black hover:border-white transition-all flex-shrink-0">
                <i className={`fa-solid ${showSidebar ? 'fa-xmark' : 'fa-sliders'}`}></i>
            </button>
        </div>
        <div className="flex gap-4 items-center flex-shrink-0 ml-4 overflow-hidden">
            {viewMode === 'CINEMATIC' && renderMode === "EXTERIOR" && (
                <button onClick={handleCinematic} className="hidden lg:block px-6 py-3 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all rounded-sm">GEN CINEMATIC</button>
            )}
            <button onClick={handleExecute} className="px-4 py-2 sm:px-6 sm:py-3 bg-white text-black text-[7px] sm:text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl rounded-sm leading-tight text-center flex flex-col items-center justify-center min-w-[90px] sm:min-w-[120px]">
              <span>EXECUTE</span>
              <span>VISION</span>
            </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className={`absolute lg:relative inset-y-0 left-0 w-80 border-r border-white/5 bg-black/95 backdrop-blur-3xl lg:bg-black overflow-y-auto shrink-0 scrollbar-hide pb-20 z-[1550] transition-all duration-500 ease-in-out ${showSidebar ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100'}`}>
          <div className="p-8 space-y-12">
            



            <section className="space-y-4">
                <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em]">Canvas Format</h4>
                <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-white/5">
                    <button 
                        onClick={() => setAspectRatio("16:9")} 
                        className={`flex-1 py-3 text-[8px] font-black uppercase tracking-widest rounded transition-all ${aspectRatio === "16:9" ? 'bg-white text-black' : 'text-zinc-600 hover:text-white'}`}
                    >
                        Pano (16:9)
                    </button>
                    <button 
                        onClick={() => setAspectRatio("9:16")} 
                        className={`flex-1 py-3 text-[8px] font-black uppercase tracking-widest rounded transition-all ${aspectRatio === "9:16" ? 'bg-white text-black' : 'text-zinc-600 hover:text-white'}`}
                    >
                        Portrait (9:16)
                    </button>
                </div>
            </section>

            {renderMode === "EXTERIOR" && (
            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em]">Site Context</h4>
                    {userTier !== SubscriptionTier.ENTERPRISE && <button onClick={onUpgrade} className="text-[8px] text-amber-500 font-black uppercase tracking-widest underline">Unlock More</button>}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                {filteredEnvironments.map(e => (
                    <button key={e} onClick={() => setEnv(e)} className={`text-left p-3 text-[8px] uppercase tracking-widest border transition-all truncate rounded-sm ${env === e ? 'bg-white text-black border-white' : 'border-white/5 text-zinc-600 hover:text-white'}`}>{e.split(' ')[0]}</button>
                ))}
                </div>
            </section>
            )}

            <section className="space-y-4">
                <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em]">Atmosphere</h4>
                <div className="grid grid-cols-3 gap-1.5 bg-zinc-900/50 p-1 rounded-lg border border-white/5">
                    {[
                        { label: 'Morning', value: LightingMode.MORNING },
                        { label: 'Mid Day', value: LightingMode.MIDDAY },
                        { label: 'Evening', value: LightingMode.GOLDEN }
                    ].map((l) => (
                        <button 
                            key={l.value}
                            onClick={() => setLight(l.value)} 
                            className={`py-3 text-[8px] font-black uppercase tracking-widest rounded transition-all ${light === l.value ? 'bg-white text-black' : 'text-zinc-600 hover:text-white'}`}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="space-y-4 p-6 bg-zinc-900/40 border border-white/5 rounded-2xl relative overflow-hidden">
                <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.4em] flex items-center gap-2">
                    <i className="fa-solid fa-pencil"></i> Magic Pencil
                </h4>
                <textarea 
                    value={magicPencil}
                    onChange={(e) => setMagicPencil(e.target.value)}
                    placeholder="Charcoal roof, move entrance, change stone..."
                    className="w-full h-24 bg-black border border-white/10 p-4 text-[10px] text-white focus:border-amber-500 focus:outline-none transition-all uppercase tracking-widest placeholder:text-zinc-800 resize-none leading-relaxed rounded-lg"
                />
                <button 
                  onClick={handleExecute}
                  disabled={isProcessing || !magicPencil.trim()}
                  className="w-full py-5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white transition-all disabled:opacity-20 active:scale-95 rounded-lg"
                >
                  Apply Directive
                </button>
            </section>

            {renderMode === "EXTERIOR" && (
            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em]">Arch DNA</h4>
                    {userTier !== SubscriptionTier.ENTERPRISE && <button onClick={onUpgrade} className="text-[8px] text-amber-500 font-black uppercase tracking-widest underline">Expand Archive</button>}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                {filteredStyles.map(s => (
                    <button key={s.id} onClick={() => setStyle(s)} className={`text-left p-3 text-[8px] uppercase tracking-widest border transition-all truncate rounded-sm ${style.id === s.id ? 'bg-white text-black border-white' : 'border-white/5 text-zinc-600 hover:text-white'}`}>{s.name}</button>
                ))}
                </div>
            </section>
            )}



            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em]">Assets ({refImages.length})</h4>
                    <label className="text-[8px] font-black text-white hover:text-amber-500 cursor-pointer transition-colors uppercase tracking-widest">
                        + ADD
                        <input type="file" multiple className="hidden" onChange={handleRefUpload} />
                    </label>
                </div>
                <div className="grid grid-cols-5 gap-2">
                    {refImages.map((img, i) => (
                        <div key={i} className="aspect-square bg-zinc-900 border border-white/5 relative group overflow-hidden rounded-sm">
                            <img src={img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                        </div>
                    ))}
                    {refImages.length === 0 && Array.from({length: 5}).map((_,i) => <div key={i} className="aspect-square bg-zinc-900/10 border border-white/5 border-dashed rounded-sm" />)}
                </div>
            </section>
          </div>
        </aside>

        <main className="flex-1 flex flex-col items-center justify-center transition-all duration-1000 relative overflow-hidden bg-[#050505]">
          <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden p-4">
            <div className={`transition-all duration-700 flex items-center justify-center ${aspectRatio === "9:16" ? 'h-full aspect-[9/16]' : 'w-full aspect-[16/9]'} max-w-full max-h-full relative group`}>
                {viewMode === 'CINEMATIC' && activeVideo ? (
                  <>
                    <video 
                      src={hdVideoVersions[project.generatedVideos.indexOf(activeVideo)] || activeVideo} 
                      className="w-full h-full shadow-2xl animate-fade-in rounded-sm object-contain" 
                      autoPlay 
                      loop 
                      muted 
                      controls 
                      playsInline
                    />
                    <div className="absolute top-4 right-4 hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={async () => {
                          const vidIdx = project.generatedVideos.indexOf(activeVideo);
                          const videoToDownload = hdVideoVersions[vidIdx] || activeVideo;
                          const is4K = !!hdVideoVersions[vidIdx];
                          const suffix = is4K ? '-4K' : '';
                          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                          if (isMobile && navigator.share) {
                            try {
                              const response = await fetch(videoToDownload);
                              const blob = await response.blob();
                              const file = new File([blob], `${project.name.toLowerCase().replace(/\s+/g, '-')}${suffix}-video-${Date.now()}.mp4`, { type: 'video/mp4' });
                              await navigator.share({ files: [file], title: 'CLAD Video' });
                            } catch (err) {
                              window.open(videoToDownload, '_blank');
                            }
                          } else {
                            const link = document.createElement('a');
                            link.href = videoToDownload;
                            link.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}${suffix}-video-${Date.now()}.mp4`;
                            link.click();
                          }
                        }}
                        className="w-12 h-12 bg-black/80 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-amber-500 hover:text-black transition-all"
                        title="Download Video"
                      >
                        <i className="fa-solid fa-download"></i>
                      </button>
                      <button
                        onClick={async () => {
                          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                          if (isMobile && navigator.share) {
                            try {
                              const response = await fetch(activeVideo);
                              const blob = await response.blob();
                              const file = new File([blob], `${project.name.toLowerCase().replace(/\s+/g, "-")}-video.mp4`, { type: "video/mp4" });
                              await navigator.share({ files: [file], title: "CLAD Video" });
                            } catch (err) { console.log("Share cancelled"); }
                          } else { setShowShare(true); }
                        }}
                        className="w-12 h-12 bg-black/80 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-amber-500 hover:text-black transition-all"
                        title="Share Video"
                      >
                        <i className="fa-solid fa-share-nodes"></i>
                      </button>
                      {(userTier === 'PRO' || userTier === 'ENTERPRISE') && (
                        <button
                          onClick={async () => {
                            const videoIdx = project.generatedVideos.indexOf(activeVideo);
                            if (hdVideoVersions[videoIdx]) {
                              alert('4K version already saved! Use download button to get it.');
                              return;
                            }
                            if (creditsAvailable < 5) {
                              alert('You need 5 credits for 4K video export');
                              return;
                            }
                            if (!confirm('Upscale video to 4K? This uses 5 credits and takes 2-4 minutes.')) return;
                            setIsUpscaling(true);
                            try {
                              const hdUrl = await upscaleVideo(activeVideo);
                              // Upload to Supabase storage permanently
                              const response = await fetch(hdUrl);
                              const blob = await response.blob();
                              const fileName = `${user?.id || 'anon'}/${project.id}/4k-video-${videoIdx}-${Date.now()}.mp4`;
                              const { error: uploadError } = await supabase.storage
                                .from('renders')
                                .upload(fileName, blob, { contentType: 'video/mp4', upsert: true });
                              
                              if (uploadError) throw new Error('Failed to save 4K video');
                              
                              const { data: urlData } = supabase.storage.from('renders').getPublicUrl(fileName);
                              const hdStorageUrl = urlData.publicUrl;
                              
                              // Save to project - syncs across all devices
                              const newHdVideoVersions = { ...hdVideoVersions, [videoIdx]: hdStorageUrl };
                              setHdVideoVersions(newHdVideoVersions);
                              onUpdateProject({ ...project, hdVideoVersions: newHdVideoVersions }, 5);
                              
                              alert('4K video saved permanently! Use download button anytime.');
                            } catch (err: any) {
                              alert(err.message || '4K video export failed');
                            } finally {
                              setIsUpscaling(false);
                            }
                          }}
                          className={`w-12 h-12 bg-black/80 backdrop-blur rounded-full flex items-center justify-center transition-all ${hdVideoVersions[project.generatedVideos.indexOf(activeVideo)] ? 'text-amber-500 border-2 border-amber-500' : 'text-amber-500 border border-amber-500/50 hover:bg-amber-500 hover:text-black'}`}
                          title={hdVideoVersions[project.generatedVideos.indexOf(activeVideo)] ? "4K Ready - Download anytime" : "4K Video (5 credits)"}
                        >
                          <i className={`fa-solid ${hdVideoVersions[project.generatedVideos.indexOf(activeVideo)] ? 'fa-check' : 'fa-film'}`}></i>
                        </button>
                      )}
                    </div>
                  </>
                ) : activeImage ? (
                  <>
                    <img src={activeImage} className="w-full h-full object-contain shadow-[0_40px_120px_rgba(0,0,0,0.9)] animate-fade-in transition-all duration-1000" alt="Studio Asset" />
                    {hdVersions[renderIdx] && (
                      <div className="absolute top-4 left-4 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                        <i className="fa-solid fa-expand text-[10px]"></i> 4K READY
                      </div>
                    )}
                    <div className="absolute top-4 right-4 hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          const imageToDownload = hdVersions[renderIdx] || activeImage;
                          const ext = hdVersions[renderIdx] ? 'png' : 'jpg';
                          const suffix = hdVersions[renderIdx] ? '-4K' : '';
                          const link = document.createElement('a');
                          link.href = imageToDownload;
                          link.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}${suffix}-${Date.now()}.${ext}`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="w-12 h-12 bg-black/80 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                        title={hdVersions[renderIdx] ? "Download 4K" : "Download Image"}
                      >
                        <i className="fa-solid fa-download"></i>
                      </button>
                      {project.generatedRenderings?.length > 1 && (
                        <button 
                          onClick={async () => {
                            const zip = new JSZip();
                            zip.file("original.jpg", await fetch(project.imageUrl).then(r => r.blob()));
                            for (let i = 0; i < project.generatedRenderings.length; i++) {
                              zip.file(`render-${i + 1}.jpg`, await fetch(project.generatedRenderings[i]).then(r => r.blob()));
                            }
                            const blob = await zip.generateAsync({ type: "blob" });
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(blob);
                            link.download = `${project.name.toLowerCase().replace(/\s+/g, "-")}-all-renders.zip`;
                            link.click();
                          }}
                          className="w-12 h-12 bg-black/80 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-blue-500 hover:text-white transition-all"
                          title="Download All as ZIP"
                        >
                          <i className="fa-solid fa-file-zipper"></i>
                        </button>
                      )}
                      {renderIdx >= 0 && (
                        <button 
                          onClick={() => {
                            setCompareState({
                              leftImage: project.imageUrl,
                              rightImage: activeImage,
                              leftLabel: 'ORIGINAL',
                              rightLabel: style?.name?.toUpperCase() || 'RENDERED'
                            });
                            setShowCompare(true);
                          }}
                          className="w-12 h-12 bg-black/80 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                          title="Compare"
                        >
                          <i className="fa-solid fa-arrows-left-right"></i>
                        </button>
                      )}
                      <button 
                        onClick={async () => { const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent); if (isMobile && navigator.share) { try { const response = await fetch(activeImage); const blob = await response.blob(); const file = new File([blob], `${project.name.toLowerCase().replace(/\s+/g, "-")}-render-${Date.now()}.jpg`, { type: "image/jpeg" }); await navigator.share({ files: [file], title: "CLAD Render" }); } catch (err: any) { if (err.name !== "AbortError") setShowShare(true); } } else { setShowShare(true); } }}
                        className="w-12 h-12 bg-black/80 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-amber-500 hover:text-black transition-all"
                        title="Share"
                      >
                        <i className="fa-solid fa-share-nodes"></i>
                      </button>
                      {renderIdx >= 0 && (
                        <button
                          onClick={() => setShowSpecSheet(true)}
                          className="w-12 h-12 bg-black/80 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-emerald-500 hover:text-black transition-all"
                          title="Material Specs"
                        >
                          <i className="fa-solid fa-list-check"></i>
                        </button>
                      )}
                      {renderIdx >= 0 && (
                        <button
                          onClick={() => generateProjectPDF(project, style)}
                          className="w-12 h-12 bg-black/80 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-red-500 hover:text-white transition-all"
                          title="Export PDF"
                        >
                          <i className="fa-solid fa-file-pdf"></i>
                        </button>
                      )}
                      {renderIdx >= 0 && (
                        <button
                          onClick={async () => {
                            // If already have HD version, just download it
                            if (hdVersions[renderIdx]) {
                              const link = document.createElement('a');
                              link.href = hdVersions[renderIdx];
                              link.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-4K-${Date.now()}.png`;
                              link.click();
                              return;
                            }
                            
                            if (creditsAvailable < 2) {
                              alert('You need at least 2 credits for 4K export');
                              onTopUp();
                              return;
                            }
                            
                            if (!confirm('Upscale to 4K HD? This uses 2 credits.')) return;
                            
                            setIsUpscaling(true);
                            try {
                              const hdUrl = await upscaleImage(activeImage);
                              
                              // Upload HD to Supabase storage and save URL
                              const byteString = atob(hdUrl.split(',')[1]);
                              const mimeType = hdUrl.split(',')[0].split(':')[1].split(';')[0];
                              const ab = new ArrayBuffer(byteString.length);
                              const ia = new Uint8Array(ab);
                              for (let i = 0; i < byteString.length; i++) {
                                ia[i] = byteString.charCodeAt(i);
                              }
                              const blob = new Blob([ab], { type: mimeType });
                              const fileName = `${user?.id || 'anon'}/${project.id}/4k-${renderIdx}-${Date.now()}.png`;
                              const { data: uploadData, error: uploadError } = await supabase.storage
                                .from('renders')
                                .upload(fileName, blob, { contentType: 'image/png', upsert: true });
                              
                              if (uploadError) {
                                console.error('Upload error:', uploadError);
                                throw new Error('Failed to save 4K image');
                              }
                              
                              const { data: urlData } = supabase.storage.from('renders').getPublicUrl(fileName);
                              const hdStorageUrl = urlData.publicUrl;
                              
                              const newHdVersions = { ...hdVersions, [renderIdx]: hdStorageUrl };
                              setHdVersions(newHdVersions);
                              onUpdateProject({ ...project, hdVersions: newHdVersions }, 2);
                              
                              // Just save - user can download via regular download button
                              alert('4K version ready! Use the download button to save.');
                            } catch (err: any) {
                              alert(err.message || 'HD export failed');
                            } finally {
                              setIsUpscaling(false);
                            }
                          }}
                          className={`w-12 h-12 bg-black/80 backdrop-blur rounded-full flex items-center justify-center transition-all ${hdVersions[renderIdx] ? 'text-purple-500 border-2 border-purple-500 hover:bg-purple-500 hover:text-white' : 'text-white hover:bg-purple-500 hover:text-white'}`}
                          title={hdVersions[renderIdx] ? "Download 4K (already upscaled)" : "4K HD Export (2 credits)"}
                        >
                          <i className={`fa-solid ${hdVersions[renderIdx] ? 'fa-check' : 'fa-expand'}`}></i>
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                    <div className="text-center space-y-8 max-w-lg p-10">
                        <div className="p-16 bg-zinc-900/10 border border-white/5 rounded-[3rem] backdrop-blur-3xl shadow-2xl">
                            <i className="fa-solid fa-film text-amber-500 text-6xl mb-8 opacity-20"></i>
                            <h3 className="text-zinc-400 text-3xl font-serif-display uppercase mb-4">Studio Branch Empty</h3>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mb-12">No high-fidelity {viewMode} assets detected.</p>
                            {viewMode === 'CINEMATIC' && renderMode === "EXTERIOR" && (
                                <button onClick={handleCinematic} className="w-full py-6 bg-amber-600 text-white text-[11px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all rounded-full shadow-2xl">RENDER CINEMATIC</button>
                            )}
                        </div>
                    </div>
                )}
            </div>
          </div>
          
          <div className="w-full h-24 md:h-32 flex gap-6 overflow-x-auto pb-6 shrink-0 px-6 scrollbar-hide flex-nowrap touch-pan-x">
             {viewMode === '3D' && (
               <>
                 <button onClick={() => setRenderIdx(-1)} className={`h-full aspect-video border shrink-0 overflow-hidden rounded-xl transition-all ${renderIdx === -1 ? 'border-white scale-105 z-10 shadow-2xl' : 'border-white/10 opacity-30 hover:opacity-100'}`}><img src={project.imageUrl} className="w-full h-full object-cover grayscale" /></button>
                 {project.generatedRenderings?.map((r:any, i:number) => (
                    <div key={i} className={`h-full aspect-video border shrink-0 overflow-hidden rounded-xl transition-all relative group/thumb ${renderIdx === i ? 'border-white scale-105 z-10 shadow-2xl' : 'border-white/10 opacity-30 hover:opacity-100'}`}>
                      <img onClick={() => setRenderIdx(i)} src={r} className="w-full h-full object-cover cursor-pointer" />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!confirm('Delete this render?')) return;
                          const newRenders = project.generatedRenderings.filter((_:any, idx:number) => idx !== i);
                          onUpdateProject({ ...project, generatedRenderings: newRenders }, 0);
                          if (renderIdx === i) setRenderIdx(newRenders.length > 0 ? newRenders.length - 1 : -1);
                          else if (renderIdx > i) setRenderIdx(renderIdx - 1);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 hover:bg-red-600 transition-all"
                      >
                        <i className="fa-solid fa-xmark text-[8px]"></i>
                      </button>
                    </div>
                 ))}
               </>
             )}
             {viewMode === 'CINEMATIC' && project.generatedVideos?.map((v:any, i:number) => (
                <button key={i} onClick={() => setVideoIdx(i)} className={`h-full aspect-video border shrink-0 overflow-hidden rounded-xl transition-all ${videoIdx === i ? 'border-amber-500 scale-105 z-10 shadow-2xl shadow-amber-500/30' : 'border-amber-500/10 opacity-30 hover:opacity-100'}`}><video src={v} className="w-full h-full object-cover" /></button>
             ))}
          </div>
          
          {/* Mobile Action Bar - only shows on mobile */}
          {viewMode === 'CINEMATIC' && activeVideo && (
            <div className="md:hidden w-full py-4 px-6 bg-black border-t border-white/5 flex justify-center gap-4">
              <button 
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      const response = await fetch(activeVideo);
                      const blob = await response.blob();
                      const file = new File([blob], `${project.name.toLowerCase().replace(/\s+/g, '-')}-video.mp4`, { type: 'video/mp4' });
                      await navigator.share({ files: [file], title: 'CLAD Video' });
                    } catch (err) {
                      window.open(activeVideo, '_blank');
                    }
                  } else {
                    const link = document.createElement('a');
                    link.href = activeVideo;
                    link.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-video.mp4`;
                    link.click();
                  }
                }}
                className="w-11 h-11 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-white active:bg-amber-500 transition-all"
                title="Download Video"
              >
                <i className="fa-solid fa-download text-sm"></i>
              </button>
              
              <button 
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      const response = await fetch(activeVideo);
                      const blob = await response.blob();
                      const file = new File([blob], `${project.name.toLowerCase().replace(/\s+/g, "-")}-video.mp4`, { type: "video/mp4" });
                      await navigator.share({ files: [file], title: "CLAD Video" });
                    } catch (err) { console.log("Share cancelled"); }
                  } else { setShowShare(true); }
                }}
                className="w-11 h-11 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-white active:bg-amber-500 transition-all"
                title="Share Video"
              >
                <i className="fa-solid fa-share-nodes text-sm"></i>
              </button>
              {/* 4K Video - Desktop only for now */}
            </div>
          )}
          
          {viewMode === '3D' && activeImage && (
            <div className="md:hidden w-full py-4 px-6 bg-black border-t border-white/5 flex justify-center gap-4">
              <button 
                onClick={async () => {
                  const imageToDownload = hdVersions[renderIdx] || activeImage;
                  const is4K = !!hdVersions[renderIdx];
                  const ext = is4K ? 'png' : 'jpg';
                  const suffix = is4K ? '-4K' : '';
                  const filename = `${project.name.toLowerCase().replace(/\s+/g, '-')}${suffix}-${Date.now()}.${ext}`;
                  
                  try {
                    // For base64 4K images, convert to blob
                    let blob;
                    if (imageToDownload.startsWith('data:')) {
                      const byteString = atob(imageToDownload.split(',')[1]);
                      const mimeType = imageToDownload.split(',')[0].split(':')[1].split(';')[0];
                      const ab = new ArrayBuffer(byteString.length);
                      const ia = new Uint8Array(ab);
                      for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                      }
                      blob = new Blob([ab], { type: mimeType });
                    } else {
                      const response = await fetch(imageToDownload);
                      blob = await response.blob();
                    }
                    
                    const file = new File([blob], filename, { type: is4K ? 'image/png' : 'image/jpeg' });
                    
                    if (navigator.share && navigator.canShare({ files: [file] })) {
                      await navigator.share({ files: [file], title: 'CLAD Render' });
                    } else {
                      const blobUrl = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = blobUrl;
                      link.download = filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(blobUrl);
                    }
                  } catch (err) {
                    console.error('Download error:', err);
                  }
                }}
                className="w-11 h-11 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-white active:bg-white active:text-black transition-all"
                title={hdVersions[renderIdx] ? "Download 4K" : "Download"}
              >
                <i className="fa-solid fa-download text-sm"></i>
              </button>
              
              {project.generatedRenderings?.length > 1 && (
                <button 
                  onClick={async () => {
                    const zip = new JSZip();
                    zip.file("original.jpg", await fetch(project.imageUrl).then(r => r.blob()));
                    for (let i = 0; i < project.generatedRenderings.length; i++) {
                      zip.file(`render-${i + 1}.jpg`, await fetch(project.generatedRenderings[i]).then(r => r.blob()));
                    }
                    const blob = await zip.generateAsync({ type: "blob" });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = `${project.name.toLowerCase().replace(/\s+/g, "-")}-all-renders.zip`;
                    link.click();
                  }}
                  className="w-11 h-11 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-white active:bg-blue-500 transition-all"
                  title="Download All"
                >
                  <i className="fa-solid fa-file-zipper text-sm"></i>
                </button>
              )}
              
              {renderIdx >= 0 && (
                <button 
                  onClick={() => {
                    setCompareState({
                      leftImage: project.imageUrl,
                      rightImage: activeImage,
                      leftLabel: 'ORIGINAL',
                      rightLabel: style?.name?.toUpperCase() || 'RENDERED'
                    });
                    setShowCompare(true);
                  }}
                  className="w-11 h-11 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-white active:bg-white active:text-black transition-all"
                  title="Compare"
                >
                  <i className="fa-solid fa-arrows-left-right text-sm"></i>
                </button>
              )}
              
              <button 
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      const response = await fetch(activeImage);
                      const blob = await response.blob();
                      const file = new File([blob], `${project.name.toLowerCase().replace(/\s+/g, "-")}-render.jpg`, { type: "image/jpeg" });
                      await navigator.share({ files: [file], title: "CLAD Render" });
                    } catch (err: any) {
                      if (err.name !== "AbortError") setShowShare(true);
                    }
                  } else {
                    setShowShare(true);
                  }
                }}
                className="w-11 h-11 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-white active:bg-amber-500 active:text-black transition-all"
                title="Share"
              >
                <i className="fa-solid fa-share-nodes text-sm"></i>
              </button>
              
              {renderIdx >= 0 && (
                <button
                  onClick={() => setShowSpecSheet(true)}
                  className="w-11 h-11 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-white active:bg-emerald-500 active:text-black transition-all"
                  title="Material Specs"
                >
                  <i className="fa-solid fa-list-check text-sm"></i>
                </button>
              )}
              
              {renderIdx >= 0 && (
                <button
                  onClick={() => generateProjectPDF(project, style)}
                  className="w-11 h-11 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-white active:bg-red-500 transition-all"
                  title="Export PDF"
                >
                  <i className="fa-solid fa-file-pdf text-sm"></i>
                </button>
              )}
              {renderIdx >= 0 && (
                <button
                  onClick={async () => {
                    if (hdVersions[renderIdx]) {
                      alert('4K version is ready! Use the download button to save.');
                      return;
                    }
                    
                    if (creditsAvailable < 2) {
                      alert('You need at least 2 credits for 4K export');
                      onTopUp();
                      return;
                    }
                    
                    if (!confirm('Upscale to 4K HD? This uses 2 credits.')) return;
                    
                    setIsUpscaling(true);
                    try {
                      const hdUrl = await upscaleImage(activeImage);
                      
                      // Upload to Supabase storage
                      const byteString = atob(hdUrl.split(',')[1]);
                      const mimeType = hdUrl.split(',')[0].split(':')[1].split(';')[0];
                      const ab = new ArrayBuffer(byteString.length);
                      const ia = new Uint8Array(ab);
                      for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                      }
                      const blob = new Blob([ab], { type: mimeType });
                      const fileName = `${user?.id || 'anon'}/${project.id}/4k-${renderIdx}-${Date.now()}.png`;
                      const { error: uploadError } = await supabase.storage
                        .from('renders')
                        .upload(fileName, blob, { contentType: 'image/png', upsert: true });
                      
                      if (uploadError) throw new Error('Failed to save 4K');
                      
                      const { data: urlData } = supabase.storage.from('renders').getPublicUrl(fileName);
                      const hdStorageUrl = urlData.publicUrl;
                      
                      const newHdVersions = { ...hdVersions, [renderIdx]: hdStorageUrl };
                      setHdVersions(newHdVersions);
                      onUpdateProject({ ...project, hdVersions: newHdVersions }, 2);
                      
                      alert('4K version ready! Use the download button to save.');
                    } catch (err: any) {
                      alert(err.message || 'HD export failed');
                    } finally {
                      setIsUpscaling(false);
                    }
                  }}
                  className={`w-11 h-11 bg-zinc-900 border rounded-full flex items-center justify-center transition-all ${hdVersions[renderIdx] ? 'border-purple-500 text-purple-500' : 'border-white/10 text-white'} active:bg-purple-500`}
                  title={hdVersions[renderIdx] ? "Download 4K" : "4K HD Export"}
                >
                  <i className={`fa-solid ${hdVersions[renderIdx] ? 'fa-check' : 'fa-expand'} text-sm`}></i>
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
