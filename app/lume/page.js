'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import './lume.css';

// Original (generic) copy
const ORIGINAL = {
  hero_headline: 'Skincare made for your skin',
  hero_subtext: 'Explore our range of clean, effective skincare products.',
  cta_text: 'Shop now',
  social_proof_line: 'Loved by thousands of customers',
  urgency_banner: null,
};

// Personalized copy (what Claude would output)
const PATCHED = {
  hero_headline: 'Finally. Skincare that actually works.',
  hero_subtext: '50% off your first order — same formula, real results.',
  cta_text: 'Claim my 50% off →',
  social_proof_line: '1,200+ five-star reviews. Join them today.',
  urgency_banner: 'Offer ends midnight tonight.',
};

// Utility to strip markdown chars from AI output
const clean = (str) => typeof str === 'string' ? str.replace(/[*_]/g, '') : str;

function LumeContent() {
  const searchParams = useSearchParams();
  const isPersonalized = searchParams.get('personalized') === 'true';
  
  // Merge URL params with original/patched defaults
  const copy = { ...(isPersonalized ? PATCHED : ORIGINAL) };
  if (isPersonalized) {
    searchParams.forEach((val, key) => {
      if (val && key !== 'personalized') copy[key] = clean(val);
    });
  }

  return (
    <div className="lume-page">
      {/* Urgency banner — only in personalized mode */}
      {isPersonalized && copy.urgency_banner && (
        <div className="lume-urgency">
          <span className="urgency-dot" />
          {copy.urgency_banner}
        </div>
      )}

      {/* Nav */}
      <nav className="lume-nav">
        <div className="lume-brand">Lumé</div>
        <ul className="lume-nav-links">
          <li><a href="#">Products</a></li>
          <li><a href="#">Ingredients</a></li>
          <li><a href="#">Our Story</a></li>
          <li><a href="#">Reviews</a></li>
        </ul>
      </nav>

      {/* Hero */}
      <section className="lume-hero">
        <div className="lume-hero-content">
          <span className="lume-hero-tag">Clean Skincare</span>
          <h1 className={isPersonalized ? 'lume-patched' : ''}>
            {copy.hero_headline}
          </h1>
          <p className={`lume-hero-sub ${isPersonalized ? 'lume-patched' : ''}`}>
            {copy.hero_subtext}
          </p>
          <a
            href="#"
            className={`lume-hero-cta ${isPersonalized ? 'lume-patched' : ''}`}
            style={isPersonalized ? { background: '#C8956C' } : {}}
          >
            {copy.cta_text}
          </a>
        </div>
        <div className="lume-hero-image">
          <span className="lume-hero-image-placeholder">L</span>
        </div>
      </section>

      {/* Social Proof */}
      <div className={`lume-social-proof ${isPersonalized ? 'lume-patched' : ''}`}>
        <span className="lume-social-proof-stars">★★★★★</span>
        <span className="lume-social-proof-text">{copy.social_proof_line}</span>
        <span className="lume-social-proof-badge">Dermatologist Tested</span>
      </div>

      {/* Features */}
      <section className="lume-features">
        <h2 className="lume-features-title">Why Lumé?</h2>
        <div className="lume-features-grid">
          <div className="lume-feature-card">
            <div className="lume-feature-icon">🌿</div>
            <h3>Clean Formula</h3>
            <p>No parabens, no sulfates, no synthetic fragrances. Just ingredients your skin actually needs.</p>
          </div>
          <div className="lume-feature-card">
            <div className="lume-feature-icon">🔬</div>
            <h3>Clinically Tested</h3>
            <p>Every product is tested by dermatologists and backed by clinical trials for efficacy.</p>
          </div>
          <div className="lume-feature-card">
            <div className="lume-feature-icon">♻️</div>
            <h3>Sustainable</h3>
            <p>Recyclable packaging, cruelty-free production, and carbon-neutral shipping on every order.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lume-footer">
        <p>© 2026 Lumé Skincare — Clean skincare, clinically tested.</p>
        <p style={{ marginTop: '8px', fontSize: '11px', opacity: 0.6 }}>
          This is a demo landing page for the Troopod AI PM assignment.
        </p>
      </footer>

      {/* Personalized indicator badge */}
      {isPersonalized && (
        <div className="lume-personalized-banner">
          <span className="banner-dot" />
          Personalized by Troopod AI
        </div>
      )}
    </div>
  );
}

export default function LumePage() {
  return (
    <Suspense fallback={
      <div className="lume-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#999' }}>Loading Lumé...</p>
      </div>
    }>
      <LumeContent />
    </Suspense>
  );
}
