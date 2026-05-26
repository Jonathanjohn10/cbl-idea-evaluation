import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Send, 
  AlertCircle, 
  RefreshCw,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ChevronDown,
  Check,
  Cpu,
  Zap,
  History,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { evaluateIdea, validateApiKey, fetchModels, DEFAULT_PROMPT } from './services/GeminiService';
import { 
  initSupabase, 
  isSupabaseConfigured, 
  saveEvaluation, 
  fetchEvaluations, 
  deleteEvaluation, 
  clearAllEvaluations 
} from './services/SupabaseService';

const ScoreCard = ({ title, score, type, description }) => {
  let cardClass = "";
  let progressTrackClass = "";
  let progressBarClass = "";

  if (type === 'feasibility') {
    cardClass = "signature-card-lovable coral";
    progressTrackClass = "card-progress-track light";
    progressBarClass = "card-progress-bar light";
  } else if (type === 'impact') {
    cardClass = "signature-card-lovable forest";
    progressTrackClass = "card-progress-track light";
    progressBarClass = "card-progress-bar light";
  } else if (type === 'cbl') {
    cardClass = "signature-card-lovable navy";
    progressTrackClass = "card-progress-track dark";
    progressBarClass = "card-progress-bar dark";
  } else { // sdg
    cardClass = "signature-card-lovable cream";
    progressTrackClass = "card-progress-track dark";
    progressBarClass = "card-progress-bar dark";
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={cardClass}
      style={{ minHeight: '220px', padding: '24px' }}
    >
      <div>
        <span className="font-caption uppercase tracking-wider opacity-85" style={{ fontSize: '12px' }}>{title}</span>
        <div className="font-display-md mt-2" style={{ color: 'inherit', fontSize: '28px' }}>{score}%</div>
      </div>
      <div className="mt-auto" style={{ marginTop: '24px' }}>
        <p className="font-body-md opacity-90 leading-relaxed mb-4" style={{ fontSize: '14px', lineHeight: '1.45' }}>{description}</p>
        <div className={progressTrackClass}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={progressBarClass}
          />
        </div>
      </div>
    </motion.div>
  );
};

const CustomSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.custom-select-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <div className="relative custom-select-container w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between input-dropdown"
        style={{
          height: '44px',
          padding: '0 16px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-passive)',
          borderRadius: 'var(--rounded-sm)',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
        }}
      >
        <div className="flex items-center gap-2 font-body-md text-ink">
          {selectedOption.icon}
          <span>{selectedOption.label}</span>
        </div>
        <ChevronDown 
          size={16} 
          className="text-muted" 
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            marginLeft: '8px'
          }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 w-full mt-2 custom-dropdown-menu"
            style={{
              zIndex: 50,
              padding: '6px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-passive)',
              boxShadow: 'rgba(0,0,0,0.06) 0px 4px 20px',
              borderRadius: 'var(--rounded-md)'
            }}
          >
            <div className="flex flex-col gap-1">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between w-full dropdown-option-item ${isSelected ? 'selected' : ''}`}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--rounded-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      backgroundColor: isSelected ? 'var(--bg-surface-strong)' : 'transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div className="flex items-center gap-2 font-body-md text-ink" style={{ fontWeight: isSelected ? 500 : 400 }}>
                      {opt.icon}
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-ink" style={{ marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const App = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || 'AlzaSyCMNjKK_TvQrpAaMpHFJtwDsuuqrr-EhNA');
  const [showKey, setShowKey] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [model, setModel] = useState('gemini-1.5-flash');
  const [prompt, setPrompt] = useState(localStorage.getItem('system_prompt') || DEFAULT_PROMPT);
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Collapsible configuration block state (as shown in screenshot)
  const [showSettings, setShowSettings] = useState(false);
  
  // Theme Mode (Lovable Light / Organic Dark Counterpart)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Available AI models dynamically updated on API key verification
  const [availableModels, setAvailableModels] = useState([
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast)', icon: <Cpu size={15} className="text-muted" style={{ display: 'flex', alignItems: 'center' }} /> },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Powerful)', icon: <Zap size={15} className="text-muted" style={{ display: 'flex', alignItems: 'center' }} /> }
  ]);

  // Collapsible result project idea and history drawer variables
  const [showResultIdea, setShowResultIdea] = useState(true);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [history, setHistory] = useState(JSON.parse(localStorage.getItem('cbl_evaluations_history') || '[]'));

  // API Key validation state variables
  const [validatingKey, setValidatingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState(null); // 'valid' | 'invalid' | null
  const [keyError, setKeyError] = useState('');

  // Supabase Link state variables
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('supabase_anon_key') || '');
  const [supabaseStatus, setSupabaseStatus] = useState('disconnected'); // 'connected' | 'error' | 'disconnected' | 'connecting'
  const [supabaseError, setSupabaseError] = useState('');
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);

  const handleValidateKey = async () => {
    if (!apiKey.trim()) return;
    setValidatingKey(true);
    setKeyStatus(null);
    setKeyError('');
    try {
      // 1. Verify the credentials against Google
      await validateApiKey(apiKey);
      setKeyStatus('valid');

      // 2. Dynamic model collection fetch
      try {
        const fetched = await fetchModels(apiKey);
        if (fetched && fetched.length > 0) {
          const mapped = fetched.map(m => {
            let icon = <Cpu size={15} className="text-muted" style={{ display: 'flex', alignItems: 'center' }} />;
            if (m.value.includes('pro')) {
              icon = <Zap size={15} className="text-muted" style={{ display: 'flex', alignItems: 'center' }} />;
            }
            return {
              value: m.value,
              label: m.label,
              icon: icon
            };
          });
          setAvailableModels(mapped);
          
          // 3. Auto-adjust active model selection
          const exists = mapped.some(m => m.value === model);
          if (!exists) {
            const flashModel = mapped.find(m => m.value.includes('1.5-flash'));
            if (flashModel) {
              setModel(flashModel.value);
            } else {
              setModel(mapped[0].value);
            }
          }
        }
      } catch (fetchErr) {
        console.warn("Could not dynamically load models list, utilizing standard defaults:", fetchErr);
      }
    } catch (err) {
      setKeyStatus('invalid');
      setKeyError(err.message || 'Validation failed.');
    } finally {
      setValidatingKey(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('system_prompt', prompt);
  }, [prompt]);

  // Synchronize dynamic dark/light class on body
  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  // Loading splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3800); // 3.8s allows full load and comfortable reading of app benefits
    return () => clearTimeout(timer);
  }, []);

  // Synchronize Supabase credentials and fetch history dynamically
  useEffect(() => {
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_anon_key', supabaseKey);

    const initAndSync = async () => {
      if (!supabaseUrl.trim() || !supabaseKey.trim()) {
        initSupabase(null, null);
        setSupabaseStatus('disconnected');
        setSupabaseError('');
        // Fallback to localStorage history
        const localHist = JSON.parse(localStorage.getItem('cbl_evaluations_history') || '[]');
        setHistory(localHist);
        return;
      }

      setSupabaseStatus('connecting');
      setSupabaseError('');

      try {
        const client = initSupabase(supabaseUrl.trim(), supabaseKey.trim());
        if (!client) {
          throw new Error("Invalid URL or Key format");
        }

        // Test connection by fetching evaluations
        const dbEvaluations = await fetchEvaluations();
        setHistory(dbEvaluations);
        setSupabaseStatus('connected');
      } catch (err) {
        console.error("Supabase sync failed:", err);
        setSupabaseStatus('error');
        setSupabaseError(err.message || "Failed to connect to Supabase. Check your URL, Key, and table policies.");
        
        // Fallback to localStorage history
        const localHist = JSON.parse(localStorage.getItem('cbl_evaluations_history') || '[]');
        setHistory(localHist);
      }
    };

    initAndSync();
  }, [supabaseUrl, supabaseKey]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleEvaluate = async () => {
    if (!apiKey) {
      setError('Please expand the Configuration panel and enter a Gemini API Key to evaluate your idea.');
      setShowSettings(true);
      return;
    }
    if (!idea.trim()) {
      setError('Please describe your project idea before evaluating.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await evaluateIdea(apiKey, model, prompt, idea);
      
      const resultData = { ...data, project_idea: idea };
      setResult(resultData);

      // Prepare history item
      let historyItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        idea: idea,
        result: data
      };

      // Try to save to Supabase if active
      if (isSupabaseConfigured()) {
        try {
          const savedRow = await saveEvaluation(idea, data);
          if (savedRow) {
            historyItem = {
              id: savedRow.id,
              timestamp: new Date(savedRow.created_at).toLocaleString(),
              idea: savedRow.idea,
              result: savedRow.result
            };
          }
        } catch (dbErr) {
          console.error("Failed to save to Supabase, falling back to local storage:", dbErr);
          setError("Analyzed successfully, but failed to save to Supabase database. Saved offline in local cache instead.");
        }
      }

      const updatedHistory = [historyItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('cbl_evaluations_history', JSON.stringify(updatedHistory));

      setShowResultIdea(true);

      // Scroll to results beautifully
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err.message || 'An error occurred during evaluation. Please verify your API key and AI settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistoryItem = async (e, id) => {
    e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this evaluation?")) {
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        await deleteEvaluation(id);
      } catch (dbErr) {
        console.error("Failed to delete from Supabase:", dbErr);
        if (!window.confirm("Failed to delete from the live database. Do you want to remove it from local cache only?")) {
          return;
        }
      }
    }

    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('cbl_evaluations_history', JSON.stringify(updatedHistory));

    // Clear result if deleted item is active
    if (result && (result.id === id || (result.project_idea === history.find(item => item.id === id)?.idea && !result.id))) {
      setResult(null);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your entire evaluation history? This cannot be undone.")) {
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        await clearAllEvaluations();
      } catch (dbErr) {
        console.error("Failed to clear Supabase evaluations:", dbErr);
        if (!window.confirm("Failed to clear remote database. Do you want to clear local cache only?")) {
          return;
        }
      }
    }

    setHistory([]);
    localStorage.removeItem('cbl_evaluations_history');
    setResult(null);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6"
            style={{
              backgroundColor: 'var(--bg-page)',
              minHeight: '100vh',
              overflowY: 'auto'
            }}
          >
            <div className="max-w-xl w-full flex flex-col items-center text-center gap-8 py-12">
              
              {/* App Icon / Pulsing Loading Indicator */}
              <div className="relative flex items-center justify-center" style={{ width: '80px', height: '80px' }}>
                {/* Outermost pulsing ring */}
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.4, 0.15] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '2px solid var(--colors-signature-peach)',
                  }}
                />
                
                {/* Middle pulsing ring */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.6, 0.25] }}
                  transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut", delay: 0.3 }}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '2px solid var(--colors-signature-mint)',
                  }}
                />

                {/* Inner rotating core */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                  className="flex items-center justify-center"
                  style={{
                    width: '50%',
                    height: '50%',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface-strong)',
                    border: '1px solid var(--border-passive)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                >
                  <Cpu size={22} className="text-ink" />
                </motion.div>
              </div>

              {/* Title & Subtitle */}
              <div className="flex flex-col gap-3">
                <motion.h1 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="font-display-md" 
                  style={{ fontSize: '36px', letterSpacing: '-0.8px', fontWeight: 600, margin: 0 }}
                >
                  CBL Idea Evaluator
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="font-body-large text-muted" 
                  style={{ fontSize: '15px', maxWidth: '380px', margin: '0 auto', lineHeight: '1.45' }}
                >
                  AI-powered SDG Alignment & Project Analysis for Challenge-Based Learning
                </motion.p>
              </div>

              {/* Benefits Section */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="w-full flex flex-col gap-3.5 mt-2"
              >
                <span className="font-caption uppercase tracking-wider text-muted text-center block mb-1" style={{ fontSize: '11px' }}>
                  What You Get Using This Application
                </span>

                <div className="grid grid-cols-1 gap-3 text-left">
                  {/* Benefit 1 */}
                  <div className="lovable-card compact flex gap-4 items-start" style={{ padding: '16px', backgroundColor: 'var(--bg-surface-soft)', border: '1px solid var(--border-passive)', borderLeft: '4px solid var(--colors-signature-peach)', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
                    <span style={{ fontSize: '20px', lineHeight: '1.2', flexShrink: 0 }}>🎯</span>
                    <div className="flex flex-col gap-1">
                      <h4 className="font-title-sm text-ink" style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Instant SDG & NITI India Alignment</h4>
                      <p className="font-body-md text-muted" style={{ fontSize: '12.5px', margin: 0, lineHeight: '1.4' }}>
                        Directly map any challenge to the UN Sustainable Development Goals and national index benchmarks in seconds.
                      </p>
                    </div>
                  </div>

                  {/* Benefit 2 */}
                  <div className="lovable-card compact flex gap-4 items-start" style={{ padding: '16px', backgroundColor: 'var(--bg-surface-soft)', border: '1px solid var(--border-passive)', borderLeft: '4px solid var(--colors-signature-mint)', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
                    <span style={{ fontSize: '20px', lineHeight: '1.2', flexShrink: 0 }}>🗺️</span>
                    <div className="flex flex-col gap-1">
                      <h4 className="font-title-sm text-ink" style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>CBL Roadmap to Excellence</h4>
                      <p className="font-body-md text-muted" style={{ fontSize: '12.5px', margin: 0, lineHeight: '1.4' }}>
                        Obtain structured guides containing concrete Big Ideas, Essential Questions, and actionable student challenges.
                      </p>
                    </div>
                  </div>

                  {/* Benefit 3 */}
                  <div className="lovable-card compact flex gap-4 items-start" style={{ padding: '16px', backgroundColor: 'var(--bg-surface-soft)', border: '1px solid var(--border-passive)', borderLeft: '4px solid var(--colors-signature-yellow)', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
                    <span style={{ fontSize: '20px', lineHeight: '1.2', flexShrink: 0 }}>☁️</span>
                    <div className="flex flex-col gap-1">
                      <h4 className="font-title-sm text-ink" style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Secure Real-Time Database Sync</h4>
                      <p className="font-body-md text-muted" style={{ fontSize: '12.5px', margin: 0, lineHeight: '1.4' }}>
                        Sync your analysis history securely to your private Supabase DB, featuring full offline-fallback backups.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Progress Loading Bar */}
              <div className="w-full max-w-xs flex flex-col items-center gap-2 mt-6">
                <div className="card-progress-track dark w-full" style={{ height: '4px', backgroundColor: 'var(--border-passive)', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3.5, ease: "easeInOut" }}
                    className="card-progress-bar dark"
                  />
                </div>
                <span className="font-legal text-muted" style={{ fontSize: '11.5px', marginTop: '4px' }}>Initializing CBL workspace...</span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showSplash && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col min-h-screen"
        >
      
      {/* Top Utility bar holding the Pill Mode Toggle & History */}
      <div className="max-w-3xl mx-auto w-full px-6 pt-6 flex justify-end gap-3">
        <button 
          onClick={() => setShowHistoryDrawer(true)}
          className="button-pill"
          aria-label="Open evaluation history"
          style={{ padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <History size={14} className="text-muted" />
          <span className="font-button-small" style={{ fontSize: '13px' }}>
            History ({history.length})
          </span>
        </button>

        <button 
          onClick={toggleTheme}
          className="button-pill"
          aria-label="Toggle dark and light mode theme"
          style={{ padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          <span className="font-button-small" style={{ fontSize: '13px' }}>
            {theme === 'light' ? 'Dark' : 'Light'}
          </span>
        </button>
      </div>

      {/* Main Container following screenshot layout style */}
      <main className="flex-grow w-full max-w-3xl mx-auto px-6 py-6 flex flex-col gap-6">
        
        {/* Header matching screenshot */}
        <header className="text-center flex flex-col gap-2 my-4">
          <h1 className="font-display-md" style={{ fontSize: '36px', letterSpacing: '-0.8px', fontWeight: 600 }}>
            CBL Idea Evaluator
          </h1>
          <p className="font-body-large text-muted" style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            AI-powered SDG Alignment & Project Analysis
          </p>
        </header>

        {/* Collapsible Configuration Panel (As shown in screenshot) */}
        <section className="lovable-card" style={{ padding: '16px 24px' }}>
          <div 
            onClick={() => setShowSettings(!showSettings)} 
            className="flex items-center justify-between cursor-pointer py-1"
          >
            <div className="flex items-center gap-2 font-title-sm text-ink" style={{ fontWeight: 600, fontSize: '16px' }}>
              <Settings size={18} className="text-muted" />
              Configuration
            </div>
            <span style={{ 
              fontSize: '12px', 
              color: 'var(--text-muted)', 
              transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              display: 'inline-block'
            }}>
              ▼
            </span>
          </div>

          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{ overflow: 'hidden' }}
              >
                <div className="flex flex-col gap-5 pt-5 mt-4" style={{ borderTop: '1px solid var(--border-passive)' }}>
                  
                  {/* API Key */}
                  <div className="flex flex-col gap-2">
                    <label className="font-caption text-muted" style={{ fontSize: '13px' }}>Gemini API Key</label>
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <input 
                          type={showKey ? "text" : "password"} 
                          value={apiKey}
                          onChange={(e) => {
                            setApiKey(e.target.value);
                            setKeyStatus(null);
                          }}
                          placeholder="Enter API Key..."
                          className="w-full pr-10"
                          style={{ height: '44px' }}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                          style={{ background: 'none', border: 'none', padding: 0 }}
                        >
                          {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleValidateKey}
                        disabled={validatingKey || !apiKey.trim()}
                        className="button-secondary"
                        style={{ height: '44px', padding: '0 16px', flexShrink: 0, fontSize: '14px', cursor: 'pointer' }}
                      >
                        {validatingKey ? (
                          <>
                            <span className="spinner" style={{ width: '12px', height: '12px', marginRight: '6px' }} />
                            Verifying...
                          </>
                        ) : (
                          "Verify Key"
                        )}
                      </button>
                    </div>
                    {keyStatus === 'valid' && (
                      <div className="success-box">
                        <div className="success-title">
                          <span>✓</span> API Key Verified Successfully
                        </div>
                        <p className="success-text">
                          Your Gemini API Key is fully authenticated and active. The connection has been successfully validated. **{model === 'gemini-1.5-flash' ? 'Gemini 1.5 Flash' : 'Gemini 1.5 Pro'}** is set as your active model engine for project evaluations.
                        </p>
                      </div>
                    )}
                    {keyStatus === 'invalid' && (
                      <div className="flex flex-col gap-2 mt-2">
                        <p className="font-legal" style={{ color: 'var(--colors-error)', fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '4px', fontWeight: 500, lineHeight: '1.3' }}>
                          <span style={{ marginTop: '1px' }}>✗</span> {keyError}
                        </p>
                        
                        {(keyError.includes("authenticated") || keyError.includes("not found") || keyError.includes("404") || keyError.includes("ModelService")) && (
                          <div className="diagnostic-box">
                            <div className="diagnostic-title">
                              🛠️ How to resolve this issue:
                            </div>
                            <ol className="diagnostic-list">
                              <li className="diagnostic-item">
                                <strong>Create a new key in AI Studio</strong>: Go to <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-link" style={{ color: 'var(--colors-link)' }}>Google AI Studio</a> and generate a fresh key inside a standard project. This takes less than a minute and automatically has default access to `gemini-1.5-flash`.
                              </li>
                              <li className="diagnostic-item">
                                <strong>Enable the API in Google Cloud</strong>: If this key is from a custom GCP project, go to your Cloud Console Library and make sure the <strong>Generative Language API</strong> is enabled.
                              </li>
                              <li className="diagnostic-item">
                                <strong>Check your region</strong>: Some GCP enterprise keys restrict Gemini models based on regional resource policies.
                              </li>
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                    {keyStatus === null && (
                      <p className="font-legal text-muted" style={{ fontSize: '11.5px' }}>Your key is stored locally in your browser cache.</p>
                    )}
                  </div>

                  {/* Model */}
                  <div className="flex flex-col gap-2">
                    <label className="font-caption text-muted" style={{ fontSize: '13px' }}>AI Model Engine</label>
                    <CustomSelect 
                      value={model} 
                      onChange={setModel} 
                      options={availableModels}
                    />
                  </div>

                  {/* Supabase Link Database Connection */}
                  <div style={{ borderTop: '1px dashed var(--border-passive)', paddingTop: '20px', marginTop: '4px' }}>
                    <h4 className="font-title-sm text-ink mb-3 flex items-center gap-2" style={{ fontWeight: 600, fontSize: '14.5px', margin: '0 0 16px 0' }}>
                      <span>⚡</span> Supabase Database Link
                    </h4>
                    
                    <div className="flex flex-col gap-4">
                      {/* Supabase Project URL */}
                      <div className="flex flex-col gap-2">
                        <label className="font-caption text-muted" style={{ fontSize: '13px' }}>Supabase Project URL</label>
                        <input 
                          type="text" 
                          value={supabaseUrl}
                          onChange={(e) => setSupabaseUrl(e.target.value)}
                          placeholder="https://your-project-id.supabase.co"
                          className="w-full"
                          style={{ height: '44px' }}
                        />
                      </div>

                      {/* Supabase Anon Public Key */}
                      <div className="flex flex-col gap-2">
                        <label className="font-caption text-muted" style={{ fontSize: '13px' }}>Supabase Anon Public API Key</label>
                        <div className="relative">
                          <input 
                            type={showSupabaseKey ? "text" : "password"} 
                            value={supabaseKey}
                            onChange={(e) => setSupabaseKey(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            className="w-full pr-10"
                            style={{ height: '44px' }}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                            style={{ background: 'none', border: 'none', padding: 0 }}
                          >
                            {showSupabaseKey ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      {/* Supabase Status Banner Notifications */}
                      {supabaseStatus === 'connecting' && (
                        <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface-soft)', borderColor: 'var(--border-passive)', color: 'var(--text-muted)' }}>
                          <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid var(--border-passive)', borderTopColor: 'var(--text-ink)', display: 'inline-block' }} />
                          <span className="font-body-md" style={{ fontSize: '13px' }}>Validating connection to Supabase...</span>
                        </div>
                      )}

                      {supabaseStatus === 'connected' && (
                        <div className="success-box" style={{ marginTop: '0', padding: '16px' }}>
                          <div className="success-title" style={{ fontSize: '13.5px', fontWeight: 600 }}>
                            <span>✓</span> Connected to Supabase
                          </div>
                          <p className="success-text" style={{ fontSize: '12.5px', marginTop: '6px', lineHeight: '1.4' }}>
                            Your evaluation history is successfully synced and persisted in real-time with the live Supabase <strong>evaluations</strong> database table.
                          </p>
                        </div>
                      )}

                      {supabaseStatus === 'error' && (
                        <div className="flex flex-col gap-2 p-4 rounded-lg border" style={{ backgroundColor: 'rgba(170, 45, 0, 0.05)', borderColor: 'var(--colors-error-border)', color: 'var(--colors-error)' }}>
                          <div className="flex items-center gap-2 font-body-md" style={{ fontWeight: 600, fontSize: '13.5px' }}>
                            <span>✗</span> Connection Error
                          </div>
                          <p className="font-body-md" style={{ fontSize: '12.5px', lineHeight: '1.45', margin: 0 }}>
                            {supabaseError}
                          </p>
                          <div className="diagnostic-box" style={{ margin: '8px 0 0 0', padding: '12px' }}>
                            <div className="diagnostic-title" style={{ fontSize: '12px', color: 'var(--text-ink)', fontWeight: 600 }}>
                              Setup Diagnostic Steps:
                            </div>
                            <ul className="diagnostic-list" style={{ margin: '6px 0 0 0', paddingLeft: '16px', fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <li>Verify the <strong>evaluations</strong> table was created successfully via SQL Editor.</li>
                              <li>Check if your Row Level Security (RLS) policies permit public SELECT, INSERT, and DELETE commands.</li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {supabaseStatus === 'disconnected' && (
                        <p className="font-legal text-muted" style={{ fontSize: '11.5px', margin: 0 }}>
                          Supabase is currently disconnected. The application is running in fully functional offline mode (persisting ideas to browser cache).
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Prompt */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="font-caption text-muted" style={{ fontSize: '13px' }}>System Prompt</label>
                      <button 
                        onClick={() => setPrompt(DEFAULT_PROMPT)}
                        className="font-legal text-link flex items-center gap-1"
                        style={{ background: 'none', border: 'none', padding: 0, textDecoration: 'none', fontSize: '11.5px' }}
                      >
                        <RefreshCw size={10} /> Reset Default
                      </button>
                    </div>
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full font-body-md"
                      style={{ minHeight: '150px', resize: 'none', fontFamily: 'monospace', fontSize: '12px', padding: '12px' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Your Project Idea Card (As shown in screenshot) */}
        <section className="lovable-card" style={{ padding: '24px' }}>
          <div className="flex items-center gap-2 mb-2 font-title-sm text-ink" style={{ fontWeight: 600, fontSize: '16px' }}>
            <span>💡</span>
            Your Project Idea
          </div>
          <p className="font-caption text-muted mb-4" style={{ fontSize: '13.5px' }}>
            Describe your challenge or project idea in detail...
          </p>

          <textarea 
            placeholder="e.g., Designing a sustainable waste management system for our local school cafeteria..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="w-full font-body-md"
            style={{ 
              minHeight: '140px', 
              padding: '16px', 
              fontSize: '15px', 
              borderRadius: 'var(--rounded-sm)',
              backgroundColor: 'var(--bg-surface-soft)'
            }}
          />

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg flex items-start gap-3 border mt-4"
              style={{ 
                backgroundColor: 'rgba(170, 45, 0, 0.05)', 
                borderColor: 'var(--colors-error-border)',
                color: 'var(--colors-error)'
              }}
            >
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-body-md" style={{ fontSize: '13.5px', lineHeight: '1.4' }}>{error}</p>
              </div>
            </motion.div>
          )}

          <div className="mt-5">
            <button 
              onClick={handleEvaluate}
              disabled={loading}
              className="button-primary w-full"
              style={{ height: '48px', fontSize: '15px', width: '100%', cursor: 'pointer' }}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Analyzing Project Idea...
                </>
              ) : (
                <>
                  Analyze Project Idea
                </>
              )}
            </button>
          </div>
        </section>

        {/* Results Section */}
        <AnimatePresence>
          {result && !loading && (
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-10 mt-8 pt-8" 
              id="results"
              style={{ borderTop: '1px solid var(--border-passive)' }}
            >
              <div className="text-center flex flex-col gap-2">
                <span className="font-caption uppercase tracking-wider text-muted" style={{ fontSize: '12px' }}>Evaluation Outcomes</span>
                <h2 className="font-display-md" style={{ fontSize: '28px', letterSpacing: '-0.5px' }}>Analysis & SDG Matrix</h2>
              </div>

              {/* Collapsible Project Idea and Overall Score on Top! */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                {/* Submitted Project Idea (Collapsible) */}
                <div className="md:col-span-2 lovable-card flex flex-col gap-3" style={{ padding: '20px 24px' }}>
                  <div 
                    onClick={() => setShowResultIdea(!showResultIdea)}
                    className="flex items-center justify-between cursor-pointer py-1"
                  >
                    <div className="flex items-center gap-2 font-title-sm text-ink" style={{ fontWeight: 600, fontSize: '15px' }}>
                      <span>💡</span>
                      Submitted Project Idea
                    </div>
                    <span style={{ 
                      fontSize: '11px', 
                      color: 'var(--text-muted)',
                      transform: showResultIdea ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      display: 'inline-block'
                    }}>
                      ▼
                    </span>
                  </div>
                  
                  <AnimatePresence initial={true}>
                    {showResultIdea && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p className="font-body-md text-body leading-relaxed pt-3" style={{ fontSize: '14px', borderTop: '1px solid var(--border-passive)', margin: 0 }}>
                          {result.project_idea || idea}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Overall Score Card on Top! */}
                <div className="md:col-span-1">
                  <div className="lovable-card flex flex-col justify-between" style={{ backgroundColor: 'var(--colors-signature-peach)', minHeight: '115px', border: 'none', padding: '20px 24px' }}>
                    <div>
                      <span className="font-caption uppercase tracking-wider text-ink opacity-80" style={{ color: '#1c1c1c', fontSize: '11px' }}>Overall Score</span>
                      <div className="font-display-md mt-1" style={{ color: '#1c1c1c', fontSize: '26px' }}>{result.overall_score} <span className="font-title-sm opacity-60">/ 100</span></div>
                    </div>
                    <p className="font-body-md leading-relaxed mt-2" style={{ color: '#1c1c1c', fontSize: '13px', lineHeight: '1.4', margin: 0 }}>
                      {result.overall_score >= 80 ? "Exemplary proposal demonstrating high feasibility and alignment." : 
                       result.overall_score >= 50 ? "Solid foundation with room for local scaling and engagement." :
                       "Early stage project. Focus on sharpening essential questions."}
                    </p>
                  </div>
                </div>
              </div>

              {/* High Voltage Score Grid in Lovable Styling */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ScoreCard title="Feasibility" score={result.scores.feasibility} type="feasibility" description="Measures operational practicality and student resource constraints." />
                <ScoreCard title="Impact" score={result.scores.impact} type="impact" description="Assesses tangible socio-economic benefit in local target areas." />
                <ScoreCard title="CBL Alignment" score={result.scores.cbl_alignment} type="cbl" description="Evaluates integration of the Big Idea, Essential Question, and Challenge." />
                <ScoreCard title="SDG Alignment" score={result.scores.sdg_alignment} type="sdg" description="Tracks alignment with the NITI Aayog SDG India Index indicators." />
              </div>

              {/* Core SDGs Addressed Card (Full Width!) */}
              <div className="lovable-card flex flex-col justify-between w-full" style={{ minHeight: '180px', padding: '24px' }}>
                <div>
                  <span className="font-caption uppercase tracking-wider text-muted" style={{ fontSize: '12px' }}>Core SDGs Addressed</span>
                  <h3 className="font-title-sm mt-1" style={{ fontWeight: 600, fontSize: '16px' }}>India SDG Map</h3>
                </div>
                <div className="flex flex-wrap gap-2.5 my-4">
                  {result.sdg_goals.map((sdg, i) => {
                    const pastels = ['var(--colors-signature-mint)', 'var(--colors-signature-yellow)', 'var(--colors-signature-peach)', 'var(--colors-signature-mustard)'];
                    const pastelColor = pastels[i % pastels.length];
                    return (
                      <span 
                        key={i} 
                        className="px-3 py-1.5 font-body-md text-ink rounded-lg font-medium"
                        style={{ backgroundColor: pastelColor, fontSize: '13px', color: '#1c1c1c' }}
                      >
                        {sdg}
                      </span>
                    );
                  })}
                </div>
                <p className="font-body-md text-muted" style={{ fontSize: '13px', margin: 0 }}>Mapped dynamically based on NITI Aayog indicators.</p>
              </div>

              {/* Detailed Evaluation & Roadmap */}
              <div className="flex flex-col gap-10 mt-6 pt-10" style={{ borderTop: '1px solid var(--border-passive)' }}>
                {/* Detailed evaluation */}
                <div className="flex flex-col gap-4">
                  <h3 className="font-display-md" style={{ fontSize: '24px' }}>Detailed Evaluation</h3>
                  <div className="markdown-content">
                    <ReactMarkdown>{result.evaluation}</ReactMarkdown>
                  </div>
                </div>

                {/* Roadmap to Excellence (Recommendations) */}
                <div className="flex flex-col gap-6">
                  <h3 className="font-display-md" style={{ fontSize: '24px' }}>Roadmap</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Short Term */}
                    <div className="lovable-card" style={{ backgroundColor: 'var(--bg-surface-soft)', border: 'none', padding: '24px' }}>
                      <h4 className="font-title-sm mb-3 text-ink flex items-center gap-2" style={{ fontWeight: 600, fontSize: '15px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--colors-signature-coral)' }} />
                        Quick Wins
                      </h4>
                      <ul className="flex flex-col gap-3.5" style={{ listStyleType: 'none' }}>
                        {result.recommendations.short_term.map((rec, i) => (
                          <li key={i} className="font-body-md text-body flex gap-2" style={{ fontSize: '14.5px', lineHeight: '1.45' }}>
                            <span className="text-muted">•</span> {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Long Term */}
                    <div className="lovable-card" style={{ backgroundColor: 'var(--bg-surface-soft)', border: 'none', padding: '24px' }}>
                      <h4 className="font-title-sm mb-3 text-ink flex items-center gap-2" style={{ fontWeight: 600, fontSize: '15px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--colors-signature-forest)' }} />
                        Scaling Impact
                      </h4>
                      <ul className="flex flex-col gap-3.5" style={{ listStyleType: 'none' }}>
                        {result.recommendations.long_term.map((rec, i) => (
                          <li key={i} className="font-body-md text-body flex gap-2" style={{ fontSize: '14.5px', lineHeight: '1.45' }}>
                            <span className="text-muted">•</span> {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="footer mt-16">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-6" style={{ borderTop: '1px solid var(--border-passive)' }}>
          <span className="font-legal text-muted" style={{ fontSize: '13px' }}>© 2026 CBL Idea Evaluation Tool. All rights reserved.</span>
          <span className="font-legal text-muted flex gap-4" style={{ fontSize: '13px' }}>
            <a href="https://sdgindia.niti.gov.in" target="_blank" rel="noreferrer" className="text-link" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>SDG India Index</a>
            <span>•</span>
            <a href="https://www.challengebasedlearning.org" target="_blank" rel="noreferrer" className="text-link" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>CBL Framework</a>
          </span>
        </div>
      </footer>

      {/* Evaluation History Drawer */}
      <AnimatePresence>
        {showHistoryDrawer && (
          <>
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryDrawer(false)}
              className="settings-overlay"
            />

            {/* Drawer Container */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="settings-drawer"
              style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border-passive)' }}>
                <h3 className="font-title-sm text-ink" style={{ fontWeight: 600, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <History size={20} className="text-muted" />
                  Evaluation History
                </h3>
                <button 
                  onClick={() => setShowHistoryDrawer(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  className="text-muted hover:text-ink flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              {/* List */}
              <div className="flex-grow flex flex-col gap-3" style={{ overflowY: 'auto', paddingRight: '4px' }}>
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-2">
                    <span style={{ fontSize: '28px' }}>📜</span>
                    <h4 className="font-body-md text-ink" style={{ fontWeight: 500, margin: 0 }}>No evaluations yet</h4>
                    <p className="font-legal text-muted" style={{ fontSize: '12px', margin: 0 }}>Your analyzed projects will appear here.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id}
                      className="lovable-card compact flex items-center justify-between"
                      style={{ 
                        backgroundColor: 'var(--bg-surface-soft)', 
                        border: '1px solid var(--border-passive)',
                        transition: 'background-color 0.2s ease, border-color 0.2s ease',
                        padding: '12px',
                        position: 'relative'
                      }}
                    >
                      <div 
                        onClick={() => {
                          setIdea(item.idea);
                          setResult({
                            ...item.result,
                            project_idea: item.idea
                          });
                          setShowHistoryDrawer(false);
                          setShowResultIdea(true);
                          setTimeout(() => {
                            document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className="flex flex-col gap-1 flex-grow cursor-pointer"
                        style={{ maxWidth: '65%', marginRight: '8px', textAlign: 'left' }}
                      >
                        <span className="font-caption text-muted" style={{ fontSize: '11px' }}>{item.timestamp}</span>
                        <p className="font-body-md text-ink" style={{ 
                          fontSize: '13.5px', 
                          fontWeight: 500, 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          margin: 0
                        }}>
                          {item.idea}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
                        {/* Overall Score Badge */}
                        <div 
                          onClick={() => {
                            setIdea(item.idea);
                            setResult({
                              ...item.result,
                              project_idea: item.idea
                            });
                            setShowHistoryDrawer(false);
                            setShowResultIdea(true);
                            setTimeout(() => {
                              document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                          className="font-title-sm flex items-center justify-center cursor-pointer"
                          style={{ 
                            width: '38px', 
                            height: '38px', 
                            borderRadius: 'var(--rounded-md)', 
                            backgroundColor: 'var(--colors-signature-peach)',
                            color: '#1c1c1c',
                            fontWeight: 600,
                            fontSize: '13px'
                          }}
                        >
                          {item.result.overall_score}
                        </div>

                        {/* Deletion Control */}
                        <button
                          onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                          className="text-muted hover:text-ink flex items-center justify-center transition-colors"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: 'var(--rounded-sm)',
                          }}
                          aria-label="Delete evaluation"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Clear button */}
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="button-secondary"
                  style={{ 
                    width: '100%', 
                    height: '44px', 
                    color: 'var(--colors-error)', 
                    borderColor: 'rgba(170, 45, 0, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Trash2 size={16} />
                  Clear History
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
        </motion.div>
      )}
    </>
  );
};

export default App;
