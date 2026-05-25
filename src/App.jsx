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
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { evaluateIdea, validateApiKey, fetchModels, DEFAULT_PROMPT } from './services/GeminiService';

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

  // API Key validation state variables
  const [validatingKey, setValidatingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState(null); // 'valid' | 'invalid' | null
  const [keyError, setKeyError] = useState('');

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
      setResult(data);
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

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Top Utility bar holding the Pill Mode Toggle */}
      <div className="max-w-3xl mx-auto w-full px-6 pt-6 flex justify-end">
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

              {/* High Voltage Score Grid in Lovable Styling */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ScoreCard title="Feasibility" score={result.scores.feasibility} type="feasibility" description="Measures operational practicality and student resource constraints." />
                <ScoreCard title="Impact" score={result.scores.impact} type="impact" description="Assesses tangible socio-economic benefit in local target areas." />
                <ScoreCard title="CBL Alignment" score={result.scores.cbl_alignment} type="cbl" description="Evaluates integration of the Big Idea, Essential Question, and Challenge." />
                <ScoreCard title="SDG Alignment" score={result.scores.sdg_alignment} type="sdg" description="Tracks alignment with the NITI Aayog SDG India Index indicators." />
              </div>

              {/* Overall Score & SDG Badges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Overall score */}
                <div className="md:col-span-1">
                  <div className="lovable-card flex flex-col justify-between" style={{ backgroundColor: 'var(--colors-signature-peach)', minHeight: '220px', border: 'none', padding: '24px' }}>
                    <div>
                      <span className="font-caption uppercase tracking-wider text-ink opacity-80" style={{ color: '#1c1c1c', fontSize: '12px' }}>Overall Score</span>
                      <div className="font-display-md mt-2" style={{ color: '#1c1c1c', fontSize: '28px' }}>{result.overall_score} <span className="font-title-sm opacity-60">/ 100</span></div>
                    </div>
                    <div className="mt-auto" style={{ marginTop: '20px' }}>
                      <p className="font-body-md leading-relaxed" style={{ color: '#1c1c1c', fontSize: '14px', lineHeight: '1.45' }}>
                        {result.overall_score >= 80 ? "Exemplary proposal demonstrating high feasibility and alignment with key SDG indicators." : 
                         result.overall_score >= 50 ? "Solid foundation with room for expanding local community engagement and technical scaling." :
                         "Early stage project. Focus on sharpening essential questions and identifying local SDG metrics."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Target SDGs */}
                <div className="md:col-span-2 lovable-card flex flex-col justify-between" style={{ minHeight: '220px', padding: '24px' }}>
                  <div>
                    <span className="font-caption uppercase tracking-wider text-muted" style={{ fontSize: '12px' }}>Core SDGs Addressed</span>
                    <h3 className="font-title-sm mt-1" style={{ fontWeight: 600, fontSize: '16px' }}>India SDG Map</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 my-4">
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
                  <p className="font-body-md text-muted" style={{ fontSize: '13px' }}>Mapped dynamically based on NITI Aayog indicators.</p>
                </div>
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
    </div>
  );
};

export default App;
