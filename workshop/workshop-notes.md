# WCAG Accessibility Workshop — Consolidated Notes

> **Source:** 5 VTT transcripts from an in-person accessibility workshop delivered to Bajaj Finserv design & development teams by **Samarthyam** (NGO) and **APNA** (Asia Pacific Network for Accessibility). Sessions span foundations, audit methodology, WCAG success criteria, assistive technology demos, and a live audit of the Bajaj Finserv website.

---

## Table of Contents

1. [Speakers & organizations](#speakers--organizations)
2. [Why this matters — legal & business stakes](#why-this-matters)
3. [Who you're designing for](#who-youre-designing-for)
4. [The POUR principles](#the-pour-principles)
5. [Standards landscape — WCAG, GIGW, IS 17802](#standards-landscape)
6. [Audit methodology — the 3-layer model](#audit-methodology)
7. [WCAG success criteria — detailed reference](#wcag-success-criteria)
8. [Assistive technology](#assistive-technology)
9. [Designer workflow — when to handle what](#designer-workflow)
10. [Live audit findings — the Bajaj Finserv critique](#live-audit-findings)
11. [APNA — the counter-example](#apna-counter-example)
12. [Common failures across audits](#common-failures)
13. [Memorable quotes](#memorable-quotes)
14. [Q&A across all sessions](#qa-across-all-sessions)
15. [Action items — designer checklist](#action-items)

---

## Speakers & Organizations

| Speaker | Role | Notes |
|---|---|---|
| **Dr. Anjlee Agarwal** | Founder & Executive Director, Samarthyam | Wheelchair user (muscular dystrophy). Advisor to PMO on Accessible India Campaign. Claims 35,000+ training workshops. |
| **Radhika Gopinath** | Architect, Technical Head, Samarthyam | Leads audits (45+ ongoing); manages automated + manual + user testing teams. |
| **Mr. Chakravarty ("DC")** | Universal design expert, Samarthyam | Person with low vision. Joined live audit as real user. |
| **Guru** | Designer/developer trainer | Delivered the WCAG success-criteria deep dive and built the Samarthyam site in 4 days. |
| **Dr. Abha Khetarpal** | Co-founder, APNA. Disability rights advocate | Locomotive disability. Appeared via video testimonial. |
| **Namrata Mehta** | Visually impaired user, 18 yrs social-development experience | Demonstrated screen-reader usage on Amazon & Bajaj sites. |

**Organizations:**
- **Samarthyam** — founded 1991. UN ECOSOC Special Consultative Status (2015). Both physical AND digital accessibility (claimed first in India).
- **APNA** — Asia Pacific Network for Accessibility. 55 countries, 2400+ members. Women-led.

---

## Why This Matters

### The legal stakes (India)

| Instrument | Status |
|---|---|
| **UNCRPD** (UN Convention) | India has signed AND ratified — legally binding. Article 9 covers ICT accessibility. |
| **RPwD Act 2016** | Replaces weak 1995 version. Harmonized with UNCRPD. Robust, enforceable. |
| **WCAG 2.1 Level AA** | Mandatory standard. |
| **GIGW 3.0 / 3.2** | Indian government guidelines — now converted from guidelines into **standards** (mandatory). |
| **IS 17802** | BIS Indian Standard. Aligned with WCAG 2.1 but Indian-specific. Covers web, Android, iOS, digital documents. |

> **Penalty:** ₹5 lakh fine + 2 years imprisonment **per individual** designing a non-accessible website or app. If 7 people work on an app, all 7 are individually liable.

**Reporting:** Anyone can photograph an inaccessible site/app and file via the **Sugamya Bharat App**, escalated through the **Chief Commissioner for Persons with Disabilities (CCPD)**.

**Sector deadlines:**
- **SEBI**: deadline pushed from 31 Mar 2025 → Jan 2026 → **30 April 2026** (current).
- **RBI**: issued requirement, no specific timeline yet — triggered this workshop.
- **Media/OTT** deadline was **June 2017** — largely ignored. Netflix the only consistent example.

**Scope:** Applies to every entity operating in India, public or private. Indian arms of global brands (Amazon India) are covered; global parents are not.

### Supreme Court ruling (~2024)
All "guidelines" must be converted to "standards" because guidelines are recommendatory, not enforceable. This is why GIGW 3.0 was elevated to standard status and published in the Gazette of India.

### The business case

- **Indian disability population:** 1 in 7 Indians (~7% per 2011 census). Including aging + situational + temporary impairments → **~48 crore people** (Government of India figure).
- Only **5–7% of Indians use digital interfaces quickly** without difficulty.
- **Cost of retrofit:** ₹85,000 to ₹5 lakh per complex site. Born-accessible is dramatically cheaper.
- **Word of mouth:** Dr. Anjlee — "If I can't use your website, I tell Radhika, she tells ten, they tell hundreds. It's not one customer, it's a thousand."

---

## Who You're Designing For

### The 21 disability types (RPwD Act 2016) grouped into 6 categories

| Category | Includes |
|---|---|
| **Physical** | Amputation, cerebral palsy, mobility challenges. Aids: wheelchair, crutches, walking stick. |
| **Visual** | Color blindness, low vision (correct term — not "partial blindness"), night blindness, total blindness, deafblindness. |
| **Hearing** | Hard of hearing, deafness. |
| **Mental & intellectual** | Mental illness (schizophrenia), dyslexia, autism, ADHD. |
| **Chronic neurological & blood disorders** | Multiple sclerosis, Parkinson's, muscular dystrophy, thalassemia, sickle cell, hemophilia. |
| **Multiple disabilities** | E.g., deafblindness, ID + MD. |

### Design-relevant impairment lens

| Category | Affected functions |
|---|---|
| **Visual** | Blindness, low vision, color blindness, night blindness |
| **Auditory** | Deafness, hard of hearing |
| **Motor** | Limited fine motor control, slow response time. Some users prefer mouse (lifting hands to keyboard is hard); others prefer keyboard only. No universal assumption. |
| **Cognitive** | Learning disabilities, distractibility, inability to focus on large info loads |

### Models of disability — evolution

| Model | Behaviour |
|---|---|
| **Medical** | "Find a cure." Fix the person. |
| **Charity** | Do *for* the person (pity-based). |
| **Social** | Society creates barriers — add ramps to fix discrete issues. PWDs dislike this: positions them as "special, not equal." |
| **Human rights / Rights-based** (current) | Empowerment through equal design. Design so the person doesn't depend on anyone else. |

### The four testing personas Samarthyam uses

| Profile | Primary AT | POUR principle most likely to fail |
|---|---|---|
| **Visual impairment** | Screen reader (NVDA, JAWS) | Perceivable |
| **Mobility impairment** | Keyboard-only, voice control, switches | Operable |
| **Hearing impairment** | Captions, sign-language interpreter | Perceivable |
| **Cognitive disability** | Plain language, icons | Understandable |

### Don't forget situational & aging users

Temporary injury, noisy environments, dementia, memory loss, parent holding a child, aging users. Same accessibility design serves all of them.

### Terminology

- **Person with disability** — correct.
- **"Handicapped"** — derogatory, do not use.
- **"Special"** — rejected. PWDs want equality, not special treatment.

---

## The POUR Principles

The foundation of WCAG. For every design decision, ask which POUR principle it serves.

| Letter | Principle | The question |
|---|---|---|
| **P** | **Perceivable** | Can the user *sense* it? (Not "see" — sense.) |
| **O** | **Operable** | Can the user *interact* with it? |
| **U** | **Understandable** | Can the user *comprehend* it? |
| **R** | **Robust** | Does it work across technologies — iOS, Android, screen readers, refreshable braille displays? |

### Examples of how POUR maps to SCs

| SC | POUR |
|---|---|
| 1.1.1 Non-text content | Perceivable |
| 1.3.1 Info and relationships | Operable (semantic structure is the spine for AT navigation) |
| 1.4.3, 1.4.11 Contrast | Perceivable |
| 2.4.3 / 2.4.7 Focus order / visible | Operable |
| 3.3.1 / 3.3.2 Errors / labels | Understandable |

---

## Standards Landscape

### What India mandates (and how to test)

A complete VPAT (Voluntary Product Accessibility Template) must demonstrate compliance with **all three**:

1. **WCAG 2.1 / 2.2 Level A + AA** — international (W3C). Targeting AA covers most.
2. **GIGW 3.0** — Indian government guidelines, now mandatory. Accessibility section starts page 18.
3. **IS 17802** — BIS Indian standard. Covers web + Android + iOS + digital documents.

> **Critical:** Many empaneled auditors test WCAG only and skip GIGW + IS 17802 — leaving clients legally exposed despite a "compliant" report.

### GIGW evolution

- **GIGW 2.0** → **GIGW 3.0** — adds criteria for intellectual disability (previously absent).
- Always reference the latest document.

### IAAP vs BIS certification

- Currently empaneled auditors are **IAAP-certified** (international, WCAG-focused).
- Samarthyam pushing for **Indian/BIS certification** — would create "lakhs of in-house auditors."
- BIS not yet operational.

### Certification mechanics

- Threshold: **≥90% compliance** for VPAT certificate.
- **Validity: 1 year** — must be renewed.
- Lists URLs tested with date and version.
- Re-audit needed because content updates continuously.

---

## Audit Methodology

### The 3-layer model

| Layer | Coverage | Methods |
|---|---|---|
| **Automated testing** | ~30% (one session says 30–40%) | Licensed scanning tools, 21 rules. Catches alt-text presence, ARIA, contrast failures. |
| **Manual testing** | ~40% (one session says 60–70%) | Human tester + NVDA + checklist. Catches semantic & visual issues. |
| **User testing** | Remaining 30% | Persons with disabilities using their own AT. **Mandatory** — without this you cannot certify any site 100%. |

> "Unless the users certify it as passed, it is not accessible." — Dr. Anjlee

### Why automation alone isn't enough — the "Apple/Mango" problem

An image of a mango with `alt="apple"` passes every automated check. Only a human catches that the text is wrong. **"AI is nothing. Human beings are always superior."** — Dr. Anjlee

### Iteration cycle

Iteration 1 → developer mitigates → re-audit → mitigate → continue. Max **3 iterations** typical because mitigation rate is low ("throw 75 test cases, 15 come back fixed").

### Typical timelines

- Mild/medium site: **4–6 weeks**
- Complex site: **8–10 weeks**

### The Three Pillars — full lifecycle

**Assessment → Design → Monitoring.** India typically stops at Assessment. Monitoring (every new upload, every PDF, every image) is what's missing. One unaltered image breaks the chain — the whole site becomes non-compliant.

### Audit reporting

Issues categorized: **critical / serious / moderate / minor + probable issues + best practice**. Each violation shown with screenshot, WCAG reference, and mitigation guidance in an Excel report.

> **Radhika's framing:** "I don't say you are 95% compliant. I say you are *not* 5% compliant."

### 5-phase audit workflow

1. **Scope confirmation** — gather URLs, agree on guidelines.
2. **3-level testing** — automated → manual → user, cyclical with mitigation.
3. **Reporting & recommendation** — severity-tagged, Excel, screenshots.
4. **Mitigation** — by developer.
5. **Re-audit / certification** — issued for 1 year.

---

## WCAG Success Criteria

The session's deep-dive criteria. Format: number, title, level, what it means, fail/pass examples.

### SC 1.1.1 — Non-Text Content (Level A)

**Rule:** All non-text content needs a text alternative serving the equivalent purpose.

> "Don't describe the image. Convey its purpose." — Guru

| Image type | Alt-text behaviour |
|---|---|
| **Logo** | Alt = brand name (e.g., "Bajaj Finserv"). NOT "logo." |
| **Decoration / separator / background** | No alt text. Skip it. |
| **Infographic** | Describe in detail — preserve the information. |

**Loan eligibility infographic case study:**
- ❌ Fail: `alt="loan infographic"` — purpose lost.
- ✅ Pass: `alt="loan eligibility, income above three lakh per year, age twenty one to sixty, credit score seven hundred plus"`.

**Designer responsibility:** alt text spec'd at handoff. Never delegate to engineering.

---

### SC 1.3.1 — Info and Relationships (Level A)

**Rule:** Information, structure, and relationships can be programmatically determined.

**Litmus test:** *If we turned off all CSS, is the structure still clear?*

**KYC form case study:**
- ❌ Fail: "Personal Details" as `<div class="big-bold">`. PAN input as plain `<div>` with no `<label>`. Address as `<div>` with no `<fieldset>`. Just an asterisk for required state.
- ✅ Pass: Heading tag for section. `<label>` on every input. `<fieldset>` grouping address fields. `aria-required="true"` for required fields.

**Why:** Screen readers use the semantic hierarchy as the spine to navigate. Without it, AT users are lost.

---

### SC 1.4.3 — Contrast (Minimum) — Text (Level AA)

| Text size | Minimum ratio |
|---|---|
| Normal text | **4.5 : 1** |
| Large text | **3 : 1** |

**Critical:** Always check with a tool. Never trust your eyes.

**Exceptions:** Pure decoration, logos, disabled/non-functional elements.

**Anti-pattern:** Light grey row on white = **2.8:1** → fails. Looks fine to a sighted designer, fails for low-vision users.

**Designer action:** Bake correct contrast into design tokens. The brand color doesn't need to change — only the relationship between text and background.

---

### SC 1.4.11 — Non-Text Contrast (Level AA)

**Rule:** UI components and graphical objects need contrast ratio **at least 3:1** against adjacent colors.

**Covers:** Input borders, icons, focus rings, state indicators.

**Watch out for:** Shadows, ghost states, overlays.

**Examples shown:** 1.4:1 (fail) vs 3.6:1 / 9.7:1 (pass).

---

### SC 2.4.3 + 2.4.7 — Focus Order & Focus Visible

| SC | Level | Requirement |
|---|---|---|
| **2.4.3 Focus Order** | A | Focus moves through the page in an order that preserves meaning. |
| **2.4.7 Focus Visible** | AA | When a component has focus, it's visually indicated. |

**Expected tab order — Sign-in form:** Customer ID → Password → Remember Me → Sign In.

**OTP flow case study:**
- ❌ Fail: Focus jumps back to first OTP digit after auto-advance. User confused.
- ✅ Pass: Focus auto-advances through all 6 digits, then to "Verify" button.

**Designer responsibility:** Tab order is spec'd by designers, not assumed by engineers.

---

### SC 3.3.1 + 3.3.2 — Error Identification & Labels

**Rules:**
- Every input has a real, visible label (NOT placeholder-as-label).
- Every error states which field and what is wrong.

**Payment form case study:**
- ❌ Fail: Single red toast "Transaction failed." Screen reader users hear nothing useful.
- ✅ Pass:
  - Inline error on offending field: `"CVV must be 3 digits"`.
  - Toast summarises overall failure.
  - **Focus moves to first error field.**
  - `role="alert"` so AT announces it.

**Every form error must:** identify the field + describe the issue + suggest a corrective measure.

---

### Other SCs mentioned

- **1.4.13** Content on Hover or Focus — designer-specific tagline exists.
- **Level A baseline** also requires: alt text on all images, keyboard navigation for all functions, no content flashing >3 times per second, page title on every page, language of page identified in code.
- **Level AA also requires:** text resizable up to 200%, consistent navigation, clear error identification, focus visible, forms with labels.

---

## Assistive Technology

### Two fundamental rules

1. **What we see is not every user's experience.**
2. **Always keep things simple.**

### AT is not 1:1 with disability

| User type | Typical AT stack |
|---|---|
| **Blind** | Screen reader + refreshable Braille display |
| **Low-vision** | Magnifier, high-contrast theme, larger text (OS-baked) |
| **Motor-impaired** | Voice control, switch, head tracker, keyboard-only |
| **Cognitively impaired** | Often *no* AT — requires high clarity in design itself |

### How a screen reader works

> "A screen reader uses a combination of the DOM — your H1-H6, label, fieldset and built-in hierarchies — plus ARIA labels. That becomes the spine of the accessibility tree. Any AT tool reads from this and converts it into understandable units." — Guru

**This is why SC 1.3.1 is load-bearing for AT.**

### Common screen readers

- **NVDA** — free, Windows. Recommended baseline. Designers should download it and test their own designs.
- **JAWS** — commercial. Most common in enterprise.
- **VoiceOver** — built into iOS. Used on mobile.
- **TalkBack** — Android equivalent.

### Magnification

- OS-level zoom, browser zoom (Ctrl +/−), assistive software, dedicated tools like **ZoomText**.
- **Design implications:** relative units only, no fixed positions, focus indicators visible at all zoom levels, touch targets scale.

### Keyboard & voice support — non-negotiables

- Every interactive element keyboard-reachable.
- **"Skip to main"** as the first focusable element on every page.
- No keyboard traps.
- Visible labels that double as accessible name (so voice control can target them).
- Focus indicator with proper contrast.

### The Pac-Mate (for deafblind users)

Small folding device. Braille keys on one side, standard keypad on the other. Real-time bidirectional — when the partner types "Y", the corresponding braille pin pops up for the deafblind user. Example of why "Robust" matters in POUR.

### Live demos in the workshop

1. **Namrata on Amazon mobile (VoiceOver)** — shopped for "Pampers", navigated by headings, selected size, reached payment. Every label she touched was spoken aloud.
2. **Manual tester with NVDA on a website** — Tab/Shift+Tab navigation, verified each button announces "Search button" not just "button."
3. **Namrata on Bajaj Finserv site** — flagged that "Sign in" wasn't tagged as a link. *"I clicked, it worked, but if tagged as a link it would be more useful."*
4. **Namrata on APNA (with JAWS)** — praised the font-size toggle and proper logo alt text.

### Namrata's core message

> "People with visual impairment do not use a mouse. We use keys like tab, arrows, spacebars, enters to navigate. Labeling every button, tagging links properly — if we are not hearing it, we can't use it."

### Maintenance warning

> "Sometimes a website, when it gets a new update, stops being accessible with a screen reader." — Namrata

---

## Designer Workflow

### When to handle what — design stage mapping

| Stage | SCs handled |
|---|---|
| **Wireframe** | Operable concerns — focus order, tab flows, semantic structure |
| **Visual design** | Perceivable concerns — color, contrast, typography |
| **Handoff spec** | Both — alt text content, ARIA labels, tab order, focus behaviour |
| **Compile-time / post-dev** | One more round of testing |

> "If designers aren't putting accessibility into your design components, for a developer it will be very difficult to fix that. You are the **Vishwakarmas**. You put accessibility into your design, and developers will be governed to build it." — Samarthyam host

### What every design must give a screen reader

- Heading hierarchy
- Link text
- Text alternatives (alt text)
- Form labels
- ARIA names
- Landmark regions

### Image annotation spec — required at handoff

For every image, include:
- **Image type** (logo / decoration / infographic / informational)
- **Alt text copy** (exact words)
- **Whether long description is needed**

### Forms — accessible form best practices

- Persistent visible label *above* every field (not just placeholder).
- Instructions appear *before* the form, not after.
- Required fields: label + asterisk + legend.
- On error: focus moves to a summary, errors listed with links to each field.
- Error messages say what went wrong AND how to fix it.

### Media — captions and transcripts

| Media | Required |
|---|---|
| Pre-recorded video | Closed captions + audio descriptions |
| Audio only | Full text transcript |
| Live video | Real-time captions |
| Auto-playing media | User must be able to pause/stop |

### SVG icons

Must have a `role` attribute. Informational SVGs need accessible names.

---

## Live Audit Findings

This is the live critique of the Bajaj Finserv website conducted with **Mr. Chakravarty (low-vision user)** as the real-user voice. These are the concrete anti-patterns to fix.

### 1. Inconsistent fonts
Multiple fonts in use (Rubik, Mukta, Palu Thambi for different scripts) plus inconsistent weights (Rubik Gold appearing in hero). **Use one family across the site.**

### 2. Contrast on promo tiles
"Personal Loan" tile passes. Adjacent white-on-light tile: *"I still can't read it."*

### 3. Carousel speed — the 20-second rule

> **"Pause karu, sojne do, comprehend karne do, samajhne do, action mein do — 20 seconds."**
> (Pause it, let me think, let me comprehend, let me understand, let me take action — give 20 seconds.)

Mr. Chakravarty: *"By the time I read it, it finishes. I won't be able to comprehend what it is."*

### 4. Text baked into images (MAJOR)
Promo loan tiles (Personal Loan, Two-Wheeler Loan, Home Loan) are images with text inside. Screen readers can't read them. **Text must always be real text, never rasterized into an image.**

### 5. Animated logo + excessive motion
Animated logo, rotating hero, multiple banners flashing simultaneously. Overwhelming for low vision, cognitive disabilities, vestibular sensitivities.

### 6. Generic link text — "Read more"
Repeated "Read more, read more, read more" across articles. Screen reader users hear identical links with no context. Each link must self-describe (e.g., "Read more about home loans"). Same critique on "Quick Links."

### 7. Code-mixing in taglines — "Sabdhan Rahe, Safe Rahe"
Mixing Hindi + English in one phrase. Screen reader doesn't switch accent — pronounces words with wrong phonetics. Keep language consistent within a phrase.

### 8. Ambiguous labels — "Do Not Call"
Sounds like an instruction TO the user. Actually means DND opt-out for promotional calls. Relabel clearly ("Do Not Disturb registration" / "Manage promotional calls").

### 9. Plugin offload
A team member suggested users install a plugin to handle DND. **Rejected:** *"You cannot tell your user to do that."* Accessibility is built into the product, not offloaded.

### 10. AI-generated images
For neurodivergent users and persons with intellectual disability, AI imagery is not interpretable. *"He can't make it out."*

### 11. Image-only CTA — "Guide to Report Online Fraud"
Image with no accessible label. Screen reader announces "safe button image."

### 12. Too many CTAs / visual overload
Hero zone has video, watch-video icon, banners, "50% off", flashy promos. **One clear CTA per zone.** *"A person with intellectual disability will be completely lost."*

### 13. Mega-menu overload
"See all category" → enormous mega-menu. *"It is like cyclopedia. You are trying to find a needle in an ocean."* Amazon was cited as the counter-example — sells lakhs of products with better navigation.

### 14. ALL CAPS — "REACH US"
Always use sentence case. ALL CAPS is harder to read for users with learning disabilities (no word-shape cues).

### 15. Non-standard labels — "Reach Us"
Invented label. Use universally recognized standards: "Contact Us," "About Us."

### 16. Critical info buried in footer
Contact links only in footer. Users shouldn't have to dig.

### Mr. Chakravarty's framing
> "I am one little drop in the big ocean of 148 crore people in the country. How can you tell your user [to figure it out themselves]?"

---

## APNA Counter-Example

The facilitator's own website, presented as what good looks like.

**Done well:**
- Translation options prominent at top
- Built-in contrast toggle / accessibility widget
- Visible font-size and contrast controls
- Simple, deliberately not-flashy layout
- Scrolling impact numbers are programmatic (not images)
- Auto-scrolling testimonials at readable speed

**Recommended typography:**
- **Body size: 18–24 px**
- **Typefaces:** Poppins, Roboto, Arial, Helvetica

**Brand vs accessibility compromise — Samarthyam's yellow/blue logo dilemma:**
- 35-year-old brand using yellow + blue (disability rights colours)
- Yellow on white fails WCAG contrast
- Solution: kept logo yellowish (brand identity), used darker orange-leaning yellow everywhere else (passes contrast)
- Site built by Guru in 4 days with feedback from 7 team members with different disabilities iterating live

> "Aesthetics is not something to be compromised. We can build beautiful websites with accessibility at the forefront. There's no need to compromise — it's just another constraint." — Guru

### Accessibility overlay widget profiles

The Samarthyam site offers user-toggleable profiles:
- Seizure-safe
- Blind
- Visually-impaired
- ADHD-friendly
- Cognitive and learning
- Motor-impaired

Plus per-user controls: font size, font weight, line height, letter spacing, **dyslexia font**, highlight links/titles, super focus, screen reader toggle, reading guide, big cursor, monochrome, no saturation, high saturation.

**Why each matters:**
- **Letter spacing/line height:** Dyslexic users find spacing easier — *"the difference between D and E, 6 and 9, is like breaking a hill."*
- **Monochrome / desaturation:** Users with psychosocial disabilities and autism often can't comprehend bright/saturated colours.

---

## Common Failures

Recurring across audits:

- Low-contrast text (easily fixable)
- Missing alt text on images
- Vague alt text ("logo" instead of brand name)
- Untagged elements
- Forms with no labels
- Missing page language
- Keyboard traps in modals/menus
- No visible focus indicator
- Videos without captions
- PDFs not tagged
- Generic error messages
- Header and footer issues (the "main culprits" — fix once, often repeats site-wide)

### PDFs — the special problem area

- **Filenames as numeric IDs or dates** (e.g., `001223.pdf`, `2025-05-12.pdf`) — meaningless to screen readers.
- **Link text "PDF document 1, PDF document 2"** — equally meaningless.
- **Scanned documents saved as JPEG inside PDF** — unreadable. Must run **OCR**.
- Fix both the **filename** AND the **link text** to convey purpose (e.g., "Home Loan Brochure").

### Time-dependent functions — OTPs

**The OTP simulation technique (Dr. Anjlee):**
> "Get the cello tape, bind your fingers — two fingers together. Now try to punch keys and pick up the phone. See how much time you take."

| Service | OTP timing | Verdict |
|---|---|---|
| **American Express** | 25–30 seconds | ✅ Good |
| **Lift door close** | 25 seconds | ✅ Established benchmark from simulation testing |
| **Aadhaar** | 7–8 seconds | ❌ Too short — *"by the time it's open, it's gone"* |

---

## Memorable Quotes

> **"It's not about you, it's about *them*. And eventually it becomes *us*."** — Dr. Anjlee

> **"Design for the person who is last on the pyramid, not on the top."** — Dr. Anjlee

> **"A design can empower, or a design can fail in a way that it makes us 'handicapped'."** — Dr. Anjlee

> **"The date [for compliance] is now."** — Dr. Anjlee

> **"Unless the users certify it as passed, it is not accessible."** — Dr. Anjlee

> **"AI cannot replace human beings. It will empower them. Human beings are always superior."** — Dr. Anjlee

> **"It has to be born accessible rather than retrofitting and fixing it up later."** — Dr. Anjlee

> **"The internet is more than just a tool. It is my window to the world."** — Dr. Abha

> **"When a website is designed mouse-only, it's like a building with only stairs."** — Dr. Abha

> **"If your website doesn't have a clear focus indicator, we are essentially navigating in the dark."** — Dr. Abha

> **"Accessibility is not just a technical checklist, it is a matter of social justice."** — Dr. Abha

> **"Move from independence to interdependence."** — Dr. Abha

> **"What we see is not every user's experience."** — Guru

> **"If we turned off all CSS, is the structure still clear?"** — Guru (the 1.3.1 litmus test)

> **"People with visual impairment do not use a mouse. If we are not hearing it, we can't use it."** — Namrata

> **"I don't depend on automatic testing or manual testing. I depend upon the designer. You are the Vishwakarmas."** — Samarthyam host

> **"I'm not asking you to change the color at all. I'm just telling you to retain the color ratio."** — Radhika

> **"I don't say you are 95% compliant. I say you are NOT 5% compliant."** — Radhika

> **"Don't wait for the law. You have to do it. By hook or by crook."** — Dr. Anjlee

> **"At the end of the day, we are designing for ourselves. We are all getting old."** — Dr. Anjlee

---

## Q&A Across All Sessions

### On compliance scope

**Q:** Is there a deadline for websites/apps to be compliant?
**A:** "The date is now." SEBI extended three times — current 30 April 2026. RBI has issued but no specific timeline.

**Q:** What about apps not under RBI/SEBI (Zomato, Swiggy)?
**A:** Every entity, public or private, is covered under RPwD Act 2016 + CCPD notifications.

**Q:** Is GIGW only for government sites?
**A:** No — applies to all Indian entities.

**Q:** Is GIGW a subset of WCAG?
**A:** Mostly overlaps, but tested separately alongside IS 17802.

### On testing

**Q:** Can the audit be fully automated, with a human just validating?
**A:** No. Automation catches ~30%. Manual + user testing covers the rest. The Apple/Mango problem is the canonical reason.

**Q:** Are you using AI to audit large URL volumes (banks have tens of thousands)?
**A:** Yes — automated tools are step 1 of 3. Not sufficient alone.

**Q:** How do we find disabled testers in tier-2/3 cities?
**A:** Testing is location-independent — a screen reader user in Mumbai can test for a user in Sangli. But end-user awareness/orientation may need to be added separately.

### On design

**Q:** Should the OS handle accessibility settings, or the website?
**A:** The site must meet contrast standards by default. Build accessibility plugins/toggles into the site so users don't depend on OS settings. Old devices may not have OS accessibility.

**Q:** On mobile, what's the alternative to Tab key?
**A:** Screen readers (VoiceOver, TalkBack) read aloud whatever the finger touches. Swipe right/left moves sequentially.

**Q:** What are ARIA labels?
**A:** Attributes used by screen readers — like alt text for buttons. Announces "dropdown," "input field," "optional," etc.

### On the "how far is too far" tension

**Q (devil's advocate):** If a lift waits 25 seconds for a disabled user, others get frustrated and spam the button. Where do we draw the line?
**A (Dr. Anjlee):** *"Me reducing the time could improve his experience, but reducing the time could leave me out of the whole business. The law says you have to make both of us 100% compatible. If he's impatient, let it only be. I don't care. **Non-discrimination is non-negotiable.**"*

### On compliance vs empathy

**Q:** Companies solve for compliance, not empathy. It's still about staying in business, not caring.
**A:** *"Somewhere it has to start. Journey of a thousand miles begins with a single step. Today's danda (stick) becomes tomorrow's basic need."*

### On contrast exceptions

**Q:** What if the math doesn't work but a user study justifies the choice (e.g., white on orange CTA)?
**A:** Logos are exceptions. Decorative/separator elements allow design freedom IF they remain AT-compatible. But for primary functional elements, the math wins.

### On the audit-vs-compliance gap

**Q:** Many empaneled auditors test WCAG only. What's the consequence?
**A:** Clients are in violation of Indian law despite having a "compliant" report — they're missing GIGW + IS 17802.

---

## Action Items

### For designers — the consolidated checklist

**Foundations:**
1. Treat accessibility as design-phase, not retrofit.
2. Target WCAG 2.1 Level AA + GIGW 3.0 + IS 17802.
3. Always reference the latest GIGW document.
4. Download NVDA and test your own designs with it.
5. Use the role-bifurcated WCAG document to filter to designer-only criteria.

**Visual design:**
6. Body font 18–24 px. Poppins / Roboto / Arial / Helvetica.
7. Sentence case only. Never ALL CAPS.
8. Bake 4.5:1 contrast into design tokens. Use tools, never eyeball.
9. Provide visible focus indicators with contrast.
10. Use one font family across the site.

**Content & semantics:**
11. Real text only — never rasterize text into images.
12. Spec alt text at handoff. Convey purpose, not description.
13. Spec image annotations (type / alt copy / long description need).
14. Avoid AI-generated imagery for informational content.
15. Use semantic structure — heading hierarchy, labels, fieldsets, ARIA.
16. Each link must self-describe (no generic "Read more").
17. Use internationally standard labels ("Contact Us," not "Reach Us").

**Forms:**
18. Persistent visible labels above fields (no placeholder-as-label).
19. Instructions before the form, not after.
20. Required fields: label + asterisk + legend.
21. Inline errors that name the field and how to fix it.
22. Focus moves to first error field on submission.
23. Use `role="alert"` for error announcements.

**Interaction:**
24. Spec tab order during design. Don't leave it to engineering.
25. No keyboard traps. Forward AND backward navigation always works.
26. First focusable element on every page = "Skip to main."
27. Touch targets large enough; scale with magnification.
28. Auto-advancing UI = 20-second comprehension window + pause control.
29. Never rely on audio-only feedback. Always include visual + haptic.
30. Don't put critical info only in the footer.

**Media:**
31. Captions on all pre-recorded video.
32. Real-time captions on live video.
33. Transcripts for audio-only.
34. Pause/stop control on auto-playing media.

**Process:**
35. Run all three testing layers — automated + manual + user.
36. Test as an outsider, not as an employee.
37. Test with grandparents and 4–5-year-old children for lifecycle coverage.
38. Simulate motor impairment with cello tape on fingers when testing OTP timings.
39. Re-validate after every update — sites regress.
40. Don't offload accessibility to user-installed plugins.

**PDFs & documents:**
41. Tag PDFs. Use meaningful filenames + link text.
42. OCR all scanned PDFs.

**Mindset:**
43. Design for the most vulnerable user, not the average user.
44. Born-accessible costs less than retrofit (₹85k–₹5L savings per complex site).
45. Designers are Vishwakarmas — what you ship, developers build.

---

## Final Framing

> **"At the end of the day, we are designing for ourselves. We are all getting old. With aging — hearing, walking, learning, remembering, vision — many losses will happen. Design for yourself."**
>
> — Dr. Anjlee Agarwal
