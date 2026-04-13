'use client';

import { useState, useRef } from 'react';

const STEPS = [
  'reading ad creative via ai vision model...',
  'extracting: headline, offer, cta, tone...',
  'scraping landing page html...',
  'parsing zones: hero, subtext, cta, proof...',
  'running llm cro gap analysis...',
  'generating personalized copy patch...',
  'running fallback validation pass...',
  'character limits + grounding check...',
  'patch validated — rendering.',
];

const TONES = ['urgent', 'aspirational', 'playful', 'professional'];

const DEMO = {
  headline: 'Finally. Skincare that actually works.',
  offer: '50% off your first order — today only',
  tone: 'urgent',
  url: '', // We will set this dynamically based on the environment
};

const ORIGINAL = {
  hero_headline: 'Skincare made for your skin',
  hero_subtext: 'Explore our range of clean, effective skincare products.',
  cta_text: 'Shop now',
  urgency_banner: null,
  social_proof_line: 'Loved by thousands of customers',
};

const PATCH = {
  hero_headline: 'Finally. Skincare that actually works.',
  hero_subtext: '50% off your first order — same formula, real results.',
  cta_text: 'Claim my 50% off →',
  urgency_banner: 'Offer ends midnight tonight.',
  social_proof_line: '1,200+ five-star reviews. Join them today.',
  rationale: {
    hero_headline: 'Message-match: mirrors the ad\'s core promise, creating click-to-page continuity.',
    hero_subtext: 'Specificity: replaces vague "explore" with the concrete offer from the ad.',
    cta_text: 'Action CTA: swaps generic "Shop now" with first-person, offer-specific language.',
    urgency_banner: 'Scarcity: the ad signals a time-limited offer — surfacing urgency above the fold.',
    social_proof_line: 'Social proof: replaces vague "thousands" with a specific number for credibility.',
  },
};

const ZONES = [
  { key: 'hero_headline', label: 'Hero Headline' },
  { key: 'hero_subtext', label: 'Hero Subtext' },
  { key: 'cta_text', label: 'CTA Button' },
  { key: 'urgency_banner', label: 'Urgency Banner' },
  { key: 'social_proof_line', label: 'Social Proof' },
];

const TAGS = {
  hero_headline: 'Message Match',
  hero_subtext: 'Specificity',
  cta_text: 'Action CTA',
  urgency_banner: 'Scarcity',
  social_proof_line: 'Social Proof',
};

export default function OutlawPage() {
  const [adImage, setAdImage] = useState(null);
  const [adName, setAdName] = useState('');
  const [headline, setHeadline] = useState('');
  const [offer, setOffer] = useState('');
  const [tone, setTone] = useState('');
  const [url, setUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState([]);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (f) => {
    if (!f?.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = (e) => { setAdImage(e.target.result); setAdName(f.name); };
    r.readAsDataURL(f);
  };

  const canGo = () => (adImage || (headline.trim() && offer.trim() && tone)) && url.trim() && !running;

  const [isFallback, setIsFallback] = useState(false);

  const executePipeline = async (payload) => {
    setRunning(true); setError(null); setResult(null); setStep(0); setDone([]); setIsFallback(false);
    
    let currentStep = 0;
    const progressInterval = setInterval(() => {
      if (currentStep < STEPS.length - 2) {
        setDone(prev => [...prev, currentStep]);
        currentStep++;
        setStep(currentStep);
      }
    }, 800);

    try {
      const res = await fetch('/api/personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      clearInterval(progressInterval);
      setStep(STEPS.length - 1);
      setDone(STEPS.map((_, i) => i));

      if (data.error) throw new Error(data.error);
      setResult({ original: data.original, patched: data.patched });
      if (data.fallback) setIsFallback(true);
    } catch (e) {
      clearInterval(progressInterval);
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const run = async () => {
    await executePipeline({ adImageBase64: adImage, landingPageUrl: url, headline, offer, tone });
  };

  const loadTextDemo = async () => {
    const fullDemoUrl = window.location.origin + '/lume';
    setHeadline(DEMO.headline); setOffer(DEMO.offer);
    setTone(DEMO.tone); setUrl(fullDemoUrl);
    setAdImage(null); setAdName('');
    await executePipeline({ adImageBase64: null, landingPageUrl: fullDemoUrl, headline: DEMO.headline, offer: DEMO.offer, tone: DEMO.tone });
  };

  const loadImageDemo = async () => {
    const fullDemoUrl = window.location.origin + '/lume';
    setHeadline(''); setOffer(''); setTone(''); setUrl(fullDemoUrl);
    
    try {
      const res = await fetch('/lume_ad_creative.png');
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        setAdImage(reader.result);
        setAdName('lume_ad_creative.png');
        // We only send the image and URL, forcing Gemini to extract signals from the image itself
        await executePipeline({ 
          adImageBase64: reader.result, 
          landingPageUrl: fullDemoUrl, 
          headline: '', 
          offer: '', 
          tone: '' 
        });
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.warn("Failed to load demo image", err);
      await executePipeline({ adImageBase64: null, landingPageUrl: fullDemoUrl, headline: '', offer: '', tone: '' });
    }
  };

  const wiz = result ? 3 : running ? 2 : (adImage || (headline && offer && tone)) ? 1 : 0;
  const statusText = error || (step >= 0 && STEPS[step]) || 'ready // awaiting input';

  return (
    <div className="outlaw-page">
      <div className="o-vignette" />
      {/* Nav */}
      <nav className="o-nav">
        <div className="o-logo">
          <span className="o-logo-mark">T</span>
          <span className="o-logo-text">TROO<span>POD</span></span>
        </div>
        <div className="o-header-credits" style={{ fontFamily: 'var(--o-font-mono, monospace)', fontSize: '11px', color: '#111', backgroundColor: '#f1f1f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 'auto', marginLeft: '2rem', padding: '6px 12px', border: '1px solid #e5e5e5', borderRadius: '6px', fontWeight: '500' }}>
          TROOPOD: AI PM Internship Assignment by Geervan
        </div>
        <ul className="o-nav-links">
          <li><a href="/lume">lumé demo</a></li>
          <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">github ↗</a></li>
        </ul>
      </nav>

      {/* Hero */}
      <section className="o-hero">
        <div className="o-hero-eyebrow">AI-powered landing page personalizer</div>
        <h1>
          YOUR AD DESERVES<br />
          A <span className="o-hero-accent">BETTER PAGE</span>
        </h1>
        <p className="o-hero-sub">
          Upload your ad creative. Paste a landing page. Watch AI rewrite the copy to actually match what you promised.
        </p>
      </section>

      {/* Pipeline steps */}
      <div className="o-pipeline">
        {['Ad Creative', 'Landing Page', 'Generate', 'Results'].map((label, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <span className="o-pipe-slash">/</span>}
            <div className={`o-pipe-step ${wiz === i ? 'active' : wiz > i ? 'done' : ''}`}>
              <span className="o-pipe-num">{wiz > i ? '✓' : i + 1}</span>
              <span className="o-pipe-label">{label}</span>
            </div>
          </span>
        ))}
      </div>

      {/* Main */}
      <div className="o-main">
        <div className="o-grid">
          {/* Left — Config */}
          <div className="o-card" style={{ animationDelay: '0.1s' }}>
            <div className="o-card-head">
              <span className="o-card-title">CONFIGURE</span>
              <span className="o-card-tag">inputs</span>
            </div>

            {/* Demos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              <button className="o-demo-btn" onClick={loadTextDemo} disabled={running}>
                <span className="o-demo-pill-ember" />
                TEXT DEMO
              </button>
              <button className="o-demo-btn" onClick={loadImageDemo} disabled={running}>
                <span className="o-demo-pill-ember" style={{ background: '#ec4899' }} />
                IMAGE DEMO
              </button>
            </div>

            {/* Upload */}
            <div className="o-form-group">
              <label className="o-label">Ad Creative</label>
              <div className={`o-upload ${adImage ? 'has-file' : ''}`} onClick={() => fileRef.current?.click()}>
                {!adImage ? (
                  <>
                    <div className="o-upload-icon">↑</div>
                    <div className="o-upload-text">Drop ad image or click</div>
                    <div className="o-upload-hint">PNG, JPG, WebP</div>
                  </>
                ) : (
                  <div className="o-upload-text" style={{ color: 'var(--o-accent)' }}>✓ loaded — click to replace</div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} />
              </div>
              {adImage && <img src={adImage} alt="" className="o-upload-preview" />}
            </div>

            <div className="o-form-group">
              <label className="o-label" htmlFor="o-headline">Headline</label>
              <input className="o-input" id="o-headline" placeholder="The main promise from your ad" value={headline} onChange={(e) => setHeadline(e.target.value)} />
            </div>

            <div className="o-form-group">
              <label className="o-label" htmlFor="o-offer">Offer / Hook</label>
              <input className="o-input" id="o-offer" placeholder="The deal, discount, or hook" value={offer} onChange={(e) => setOffer(e.target.value)} />
            </div>

            <div className="o-form-group">
              <label className="o-label">Tone</label>
              <div className="o-tones">
                {TONES.map((t) => (
                  <button key={t} className={`o-tone ${tone === t ? 'active' : ''}`} onClick={() => setTone(t)}>{t}</button>
                ))}
              </div>
            </div>

            <div className="o-slash-divider">landing page</div>

            <div className="o-form-group">
              <label className="o-label" htmlFor="o-url">Target URL</label>
              <input className="o-input" id="o-url" type="url" placeholder="https://your-landing-page.com" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>

            <button className="o-cta" onClick={run} disabled={!canGo()}>
              {running ? '⟳ GENERATING...' : '→ PERSONALIZE TARGET'}
            </button>
          </div>

          {/* Right — Output */}
          <div className="o-card" style={{ animationDelay: '0.2s' }}>
            <div className="o-card-head">
              <span className="o-card-title">OUTPUT</span>
              <span className="o-card-tag">results</span>
            </div>

            {/* Preview */}
            {adImage ? (
              <div className="o-preview" style={{ marginBottom: '20px' }}>
                <img src={adImage} alt="" />
                <div className="o-preview-meta">
                  {adName && <div className="o-meta-row"><span className="o-meta-label">File</span><span className="o-meta-value">{adName}</span></div>}
                  {headline && <div className="o-meta-row"><span className="o-meta-label">Headline</span><span className="o-meta-value">{headline}</span></div>}
                  {offer && <div className="o-meta-row"><span className="o-meta-label">Offer</span><span className="o-meta-value">{offer}</span></div>}
                  {tone && <div className="o-meta-row"><span className="o-meta-label">Tone</span><span className="o-meta-value" style={{ textTransform: 'capitalize' }}>{tone}</span></div>}
                </div>
              </div>
            ) : (headline || offer || tone) ? (
              <div className="o-preview" style={{ marginBottom: '20px' }}>
                <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid var(--o-border-subtle)' }}>
                  <div style={{ fontFamily: 'var(--o-font-mono)', fontSize: '10px', color: 'var(--o-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>no image — text mode</div>
                </div>
                <div className="o-preview-meta">
                  {headline && <div className="o-meta-row"><span className="o-meta-label">Headline</span><span className="o-meta-value">{headline}</span></div>}
                  {offer && <div className="o-meta-row"><span className="o-meta-label">Offer</span><span className="o-meta-value">{offer}</span></div>}
                  {tone && <div className="o-meta-row"><span className="o-meta-label">Tone</span><span className="o-meta-value" style={{ textTransform: 'capitalize' }}>{tone}</span></div>}
                </div>
              </div>
            ) : (
              <div className="o-empty" style={{ marginBottom: '20px' }}>
                <span className="o-empty-icon">★</span>
                <span className="o-empty-text">no ad data yet</span>
                <span className="o-empty-sub">upload or fill in the fields</span>
              </div>
            )}

            {/* Results */}
            {running ? (
              <div className="o-loading">
                <div className="o-loading-ring" />
                <span className="o-loading-text">PERSONALIZING PAGE...</span>
                <span className="o-loading-sub">running the ai pipeline</span>
                <div className="o-loading-steps">
                  {STEPS.map((s, i) => (
                    <div key={i} className={`o-loading-step ${done.includes(i) ? 'done' : step === i ? 'act' : ''}`}>
                      <span className="o-loading-step-i">{done.includes(i) ? '✓' : step === i ? '▸' : '·'}</span>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            ) : result ? (
              <>
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="o-stamp">✓ Page personalized successfully</span>
                    {!isFallback && (
                      <span style={{ fontSize: '9px', fontWeight: 'bold', border: '1px solid #10b981', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--o-font-mono, monospace)' }}>
                        ✨ AI GENERATED
                      </span>
                    )}
                  </div>
                  {isFallback && (
                    <div style={{ padding: '8px 12px', background: '#fff9e6', border: '1px solid #ffeeba', borderRadius: '6px', color: '#856404', fontSize: '11px', fontFamily: 'var(--o-font-mono, monospace)' }}>
                      ⚠️ <strong>MOCK FALLBACK INITIATED:</strong> The AI provider (Gemini) is currently experiencing high demand. The system has automatically fallen back to validated mock data to ensure the demo continues without disruption.
                    </div>
                  )}
                </div>

                <div className="o-diff">
                  <div className="o-diff-head">
                    <div className="o-diff-head-cell">Before</div>
                    <div className="o-diff-head-cell">After</div>
                  </div>
                  {ZONES.map((z) => {
                    const orig = result.original[z.key];
                    const patched = result.patched[z.key];
                    if (!patched && !orig) return null;
                    return (
                      <div className="o-diff-row" key={z.key}>
                        <div className="o-diff-cell">
                          <span className="o-diff-zone">{z.label}</span>
                          {orig || '(none)'}
                        </div>
                        <div className="o-diff-cell o-new">
                          <span className="o-diff-zone">{z.label}</span>
                          {patched || '(unchanged)'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="o-view-btns">
                  <a href="/lume" target="_blank" rel="noopener noreferrer" className="o-ghost">↗ original page</a>
                  <button 
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('personalized', 'true');
                      Object.entries(result.patched).forEach(([k, v]) => {
                        if (typeof v === 'string') params.set(k, v);
                      });
                      window.open(`/lume?${params.toString()}`, '_blank');
                    }} 
                    className="o-cta" 
                    style={{ fontSize: '14px', padding: '10px 20px', width: '100%', textDecoration: 'none', textAlign: 'center', cursor: 'pointer' }}
                  >
                    ↗ PERSONALIZED PAGE
                  </button>
                </div>

                <div className="o-rationale">
                  <div className="o-rationale-title">
                    RATIONALE
                    <span className="o-rt-tag">CRO</span>
                  </div>
                  {Object.entries(result.patched.rationale).map(([zone, text]) => (
                    <div className="o-rationale-item" key={zone}>
                      <div className="o-r-zone">// {zone.replace(/_/g, ' ')}</div>
                      <div className="o-r-text">{text}</div>
                      <span className="o-r-tag">{TAGS[zone]}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="o-empty">
                <span className="o-empty-icon">⌖</span>
                <span className="o-empty-text">awaiting target</span>
                <span className="o-empty-sub">fill config → hit personalize</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="o-status">
        <span className={`o-status-dot ${running ? 'running' : ''}`} />
        <span className="o-status-text">{statusText}</span>
      </div>
    </div>
  );
}
