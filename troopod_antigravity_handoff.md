# Troopod — AI PM Assignment Handoff
### For: Antigravity Dev Team
### From: [Your Name]
### Deadline: 3 days from receipt

---

## What we're building

A web tool where a user inputs an ad creative (image upload) + a landing page URL, and gets back a **personalized version of that landing page** — not a new page, but the existing page with targeted copy edits based on CRO principles and message-match with the ad.

---

## The 3 things you need to build

### 1. The MVP tool (main deliverable)
A single-page web app. Brutalist design language (spec below).

### 2. Demo landing page — "Lumé" skincare
A fake DTC skincare brand landing page hosted separately. This is what the tool will personalize in the demo. Build it as a realistic, generic landing page with a hero, CTA, social proof strip, and features section.

### 3. Demo ad creative
A static image (designed in Canva or Figma) — Instagram/Facebook ad format for Lumé. Strong offer hook: "Finally. Skincare that actually works. 50% off your first order — today only." This image gets uploaded into the tool for the demo.

---

## System flow (how it works)

```
User uploads ad image + pastes landing page URL
        ↓
Claude Vision reads the ad image
→ extracts: headline, offer, CTA, tone, audience signal
        ↓
Puppeteer / Cheerio scrapes the landing page
→ extracts: hero headline, subtext, CTA button text,
  social proof section, above-fold offer text
        ↓
Claude (Sonnet) runs gap analysis + generates JSON patch
→ outputs only: {hero_headline, hero_subtext, cta_text,
  urgency_banner, social_proof_line}
        ↓
Validation layer checks the patch
→ character limits, no hallucinated stats,
  fallback to original if field fails
        ↓
Output panel renders:
→ iframe of original page with patch injected via JS
→ diff view (original vs new, side by side)
→ rationale panel (which CRO principle drove each change)
```

---

## Design spec — Brutalist

### Why brutalist
Every other PM assignment will submit a SaaS dashboard in Inter font with a purple gradient. This is memorable, peppy, and signals design confidence. Brutalism done with rules looks intentional, not broken.

### The 4 non-negotiable rules
1. **Monospace font throughout** — use IBM Plex Mono or Courier New. Signals "technical tool," makes raw aesthetic feel intentional.
2. **3px solid black borders** — not 1px (looks like a bug), not 2px (looks timid). 3px is the brutalist standard.
3. **One accent color only** — `#FFD600` (yellow). Used on: logo accent, active states, CTA hover, tags. Nowhere else.
4. **Off-white background** — `#F5F0E8`, not pure white. Pure white + black borders reads as broken webpage. Warm off-white reads as a design decision.

### Color palette
| Token | Value | Usage |
|---|---|---|
| Background | `#F5F0E8` | Page background |
| Surface | `#FFFFFF` | Input fields, cards |
| Ink | `#111111` | All text, borders |
| Accent | `#FFD600` | Logo, CTAs, active chips |
| Muted | `#555555` | Secondary labels |
| Subtle | `#AAAAAA` | Placeholder, disabled |

### Typography
- **All text**: IBM Plex Mono (Google Fonts) or Courier New fallback
- **Hero headline**: 28–32px, weight 700, uppercase, letter-spacing -0.5px
- **Section labels**: 9px, weight 700, uppercase, letter-spacing 0.12em
- **Body / inputs**: 11–12px, weight 400
- **Buttons**: 13px, weight 700, uppercase, letter-spacing 0.1em
- **No serif. No sans-serif. Mono only.**

### Layout structure
```
[ TOPBAR — dark bg #111, logo left, nav links right ]
[ HERO STRIP — yellow bg, big uppercase headline ]
[ MAIN — 2 column grid, 3px border between columns ]
  [ LEFT PANEL ]          [ RIGHT PANEL ]
  01 — Your inputs        02 — Demo ad loaded
  - Ad image upload       - Ad preview card
  - Ad detail fields      03 — Output
  - Tone chips            - Before/after diff
  - Landing page URL      - Rationale panel
  - Run button
[ STATUS BAR — dark, monospace status text ]
```

### Interaction details
- Input focus state: background turns `#FFD600`
- Tone chips: 2×2 grid, selected = black bg + yellow text
- Run button: hover = inverts (yellow bg, black text); active = `transform: translate(2px, 2px)` (gives a "press" feel with no shadow)
- Output panel: starts as dashed placeholder → fills with diff view after generation

---

## Claude API integration — exact prompts to use

### Assumptions declared
- Ad creative is an image (uploaded by user). Claude Vision reads it.
- Landing page must be publicly accessible (no auth walls).
- Output is a JSON patch of max 5 fields. Not raw HTML. Not a new page.
- All claims in the patch must be grounded in the ad image or the existing page content. No invented stats.

---

### PROMPT 1 — Ad creative extraction (Vision call)

**Model**: `claude-opus-4-5` or `claude-sonnet-4-5`  
**Input**: Base64 image of the ad creative  
**Max tokens**: 400  
**Temperature**: 0

```
You are an expert ad analyst. The user has uploaded an ad creative image.

Extract the following from the image and return ONLY a valid JSON object. No preamble, no markdown, no explanation.

{
  "headline": "the main headline text visible in the ad",
  "subtext": "any supporting copy or body text",
  "offer": "the specific offer, discount, or hook (e.g. '50% off', 'free trial', 'limited time')",
  "cta_text": "the call-to-action button or text",
  "tone": one of ["urgent", "aspirational", "playful", "professional"],
  "audience_signal": "inferred target audience in 5 words or less",
  "brand_name": "brand name if visible, else null"
}

Rules:
- Only extract what is visibly present in the image. Do not invent or infer beyond what you can see.
- If a field is not visible, return null for that field.
- Return valid JSON only. No other text.
```

---

### PROMPT 2 — Gap analysis + JSON patch generation (main call)

**Model**: `claude-sonnet-4-5`  
**Input**: Output of Prompt 1 (ad signals) + scraped page zones (hero text, CTA, subtext, social proof)  
**Max tokens**: 500  
**Temperature**: 0.2

```
You are a senior CRO specialist and conversion copywriter.

You have been given:
1. An ad creative's extracted signals (what the ad promises)
2. The current text content of a landing page's key zones

Your job is to generate a JSON patch — a set of copy edits to the landing page that:
- Creates message-match between the ad and the page (the user clicked the ad expecting something specific — the page must deliver that)
- Applies proven CRO principles: clarity above the fold, urgency where appropriate, social proof placement, specific CTAs over generic ones
- Does NOT change layout, images, navigation, or any structural elements
- Does NOT invent statistics, reviews, or claims not present in the ad or the existing page

AD SIGNALS:
{{ad_signals_json}}

CURRENT PAGE ZONES:
- hero_headline: "{{current_hero_headline}}"
- hero_subtext: "{{current_hero_subtext}}"
- cta_text: "{{current_cta_text}}"
- social_proof: "{{current_social_proof}}"

Return ONLY a valid JSON object. No preamble. No markdown. No explanation.

{
  "hero_headline": "new headline (max 60 chars, must reflect the ad's core promise)",
  "hero_subtext": "new subtext (max 100 chars, supports the headline, adds specificity)",
  "cta_text": "new CTA button text (max 30 chars, action-oriented, matches the offer)",
  "urgency_banner": "short urgency line if the ad had a time/scarcity signal, else null (max 50 chars)",
  "social_proof_line": "reframed social proof line if present on page, else null (max 80 chars)",
  "rationale": {
    "hero_headline": "one sentence: which CRO principle drove this change",
    "hero_subtext": "one sentence",
    "cta_text": "one sentence",
    "urgency_banner": "one sentence or null",
    "social_proof_line": "one sentence or null"
  }
}

Hard rules:
- hero_headline must not exceed 60 characters
- cta_text must not exceed 30 characters
- Do not use the words "amazing", "revolutionary", "game-changing", "best-in-class"
- Do not invent numbers (reviews, percentages, dates) unless they appear in the ad or existing page
- Return valid JSON only
```

---

### PROMPT 3 — Validation check (lightweight call)

**Model**: `claude-haiku-4-5` (cheapest, fastest — use this for validation only)  
**Input**: The JSON patch from Prompt 2 + original ad signals  
**Max tokens**: 200  
**Temperature**: 0

```
You are a content validator. Check the following JSON patch against these rules and return a validation result.

ORIGINAL AD SIGNALS:
{{ad_signals_json}}

GENERATED PATCH:
{{patch_json}}

Check each field:
1. Is hero_headline ≤ 60 characters?
2. Is cta_text ≤ 30 characters?
3. Does urgency_banner (if present) reference a real signal from the ad, or is it invented?
4. Does social_proof_line contain any numbers not present in the ad signals or original page?
5. Are any of the fields empty strings?

Return ONLY this JSON:
{
  "valid": true or false,
  "failed_fields": ["list of field names that failed, empty array if none"],
  "reason": "one sentence summary if invalid, else null"
}
```

---

## Credit optimization rules (strict)

| Rule | Why |
|---|---|
| Never send full page HTML to Claude | Parse with Cheerio/BeautifulSoup first. Send only the 5 text zones (~300 tokens max) |
| Cache page scrapes by URL | Same URL = same scrape. Don't re-scrape on retry |
| Use Haiku for validation (Prompt 3) | It's 20x cheaper than Sonnet for a simple JSON check |
| Cap max_tokens on every call | Prompt 1: 400. Prompt 2: 500. Prompt 3: 200. Never leave uncapped |
| Two API calls for the demo, not one | Ad extraction + patch generation are separate calls. Keeps each prompt focused and cheaper than one giant call |
| Pre-load demo ad as text fallback | For the demo run, pre-fill the ad fields so Prompt 1 (Vision) can be skipped entirely if needed |

---

## Demo script (what the evaluator will see)

1. Page loads — brutalist design, Lumé demo ad pre-loaded in the right panel
2. Demo ad image is already displayed in the "Ad preview card"
3. Ad detail fields are pre-filled (headline, offer, tone = Urgent)
4. User pastes the Lumé landing page URL (we provide this URL)
5. User clicks **→ PERSONALIZE THIS PAGE**
6. Loading state: button text changes to "⟳ Generating..." (2–3 seconds)
7. Output panel reveals:
   - Left: original page zone text
   - Right: new personalized text (highlighted in yellow)
   - Below: rationale cards — one per change, showing which CRO principle was applied
8. Optional: "View live page" button that opens the Lumé landing page with the patch injected

---

## Lumé demo landing page — content spec

Build this as a standalone HTML page hosted on Vercel/Netlify. Generic enough to show a clear before/after gap.

**Brand**: Lumé Skincare — "Clean skincare, clinically tested"  
**Tone**: Calm, premium, generic — deliberately vague so the ad patch makes a dramatic difference

| Zone | Content to build in |
|---|---|
| Hero headline | "Skincare made for your skin" |
| Hero subtext | "Explore our range of clean, effective skincare products." |
| CTA button | "Shop now" |
| Social proof strip | "Loved by thousands of customers" |
| Urgency | None (this is intentional — the ad will add one) |

**After personalization (what Claude outputs):**

| Zone | Personalized content |
|---|---|
| Hero headline | "Finally. Skincare that actually works." |
| Hero subtext | "50% off your first order — same formula, real results." |
| CTA button | "Claim my 50% off →" |
| Social proof strip | "1,200+ five-star reviews. Join them today." |
| Urgency banner | "Offer ends midnight tonight." |

---

## Tech stack recommendation

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js or plain HTML/JS | Fast to build, easy to host |
| Hosting | Vercel | Free tier, instant deploy |
| Page scraping | Cheerio (Node) or BeautifulSoup (Python) | Lightweight, no browser needed |
| Image upload | Browser FileReader API → base64 | No storage needed for demo |
| Claude API | Anthropic SDK (Node or Python) | Official SDK, handles retries |
| Demo ad image | Static file served from `/public` | No upload infra needed for demo |

---

## Edge cases and how to handle them

| Scenario | Handling |
|---|---|
| Page scrape fails (timeout, JS-rendered) | Show error: "This page requires JavaScript rendering. Try a different URL." Don't crash. |
| Claude returns invalid JSON | Retry once with temperature 0. If still invalid, show original page with error toast. |
| Hallucinated stat in patch | Validation (Prompt 3) catches it. Remove the field and fall back to original copy for that zone. |
| Headline too long | Truncate at 60 chars in post-processing. Never let overflow happen in the UI. |
| Ad image unreadable / blank | Show: "Couldn't read the ad creative. Try a clearer screenshot." Skip to text input mode. |
| User submits with no ad image | Require either image OR all 3 text fields (headline, offer, tone) to be filled. Block submission otherwise. |

---

## Google Doc structure (for the brief)

Paste this outline into the Google Doc. Expand each section with 2–3 sentences.

1. **What this tool does** (2 sentences max)
2. **System flow** (copy the flow diagram above)
3. **Agent design** — two Claude calls: Vision extraction → Sonnet patch generation → Haiku validation
4. **Key design decisions** — JSON patch (not HTML rewrite), 5-field schema, source-grounded claims only
5. **How we handle random changes** — fixed JSON schema, temperature 0–0.2, schema validation before render
6. **How we handle broken UI** — character limits enforced post-processing, fallback to original per-field
7. **How we handle hallucinations** — Prompt 2 hard rule: no invented numbers. Prompt 3 Haiku validates. Field-level fallback.
8. **How we handle inconsistent outputs** — few-shot examples in Prompt 2, fixed output schema, Haiku re-check
9. **Assumptions made** — ad creative is an image; landing page is publicly accessible; patch is 5 fields only; all claims must be grounded in source content

---

## Assumptions declared (as required by the brief)

- "Ad creative" is interpreted as an image (screenshot or upload of a Facebook/Instagram/Google ad). This is the real-world format — ad creatives are always visual in production.
- The personalized page is the **existing page with surgical copy edits** — not a new page, not a full redesign. Only 5 text zones are touched.
- All generated copy must be grounded in either the ad image content or the existing landing page. The system explicitly prohibits inventing statistics or claims.
- For the demo, the Lumé landing page and ad creative are pre-built to guarantee a clean, dramatic before/after story.
- Claude Haiku is used for validation (not generation) to keep API costs minimal.

---

*End of handoff document. Questions → [your contact].*
