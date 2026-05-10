---
name: Pro Dynamic Sports
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#3d4a3e'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#6d7b6d'
  outline-variant: '#bccabb'
  surface-tint: '#006d33'
  primary: '#006b32'
  on-primary: '#ffffff'
  primary-container: '#008740'
  on-primary-container: '#f7fff3'
  inverse-primary: '#5adf82'
  secondary: '#ad3300'
  on-secondary: '#ffffff'
  secondary-container: '#ff642d'
  on-secondary-container: '#5a1600'
  tertiary: '#a72e4a'
  on-tertiary: '#ffffff'
  tertiary-container: '#c84761'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#78fc9c'
  primary-fixed-dim: '#5adf82'
  on-primary-fixed: '#00210b'
  on-primary-fixed-variant: '#005225'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59e'
  on-secondary-fixed: '#3a0b00'
  on-secondary-fixed-variant: '#842500'
  tertiary-fixed: '#ffd9dd'
  tertiary-fixed-dim: '#ffb2bb'
  on-tertiary-fixed: '#400012'
  on-tertiary-fixed-variant: '#8a1636'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
typography:
  display-lg:
    fontFamily: Lexend
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Lexend
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Lexend
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

This design system embodies the energy of professional athletics tempered with a clean, elite corporate aesthetic. The personality is high-performance, fresh, and authoritative. By prioritizing a "White and Green" palette, the UI moves away from typical dark-mode "gamer" aesthetics toward a sophisticated, broadcast-ready editorial style.

The design movement is **Corporate Modern with Minimalist influences**. It leverages generous whitespace to create a "fresh air" feeling, ensuring that data-heavy sports statistics remain legible and professional. Visual interest is driven by sharp typography and high-performance color accents rather than heavy decorative elements.

## Colors

The palette is anchored by **Sports Green (#00a651)** and **Pure White**, creating a high-contrast, "fresh turf" aesthetic. 

- **Primary (Sports Green):** Used for primary actions, success states, and active navigation indicators.
- **Background (White):** The dominant surface color to ensure a clean, professional look.
- **Secondary/Accent (Orange #f15a24):** Reserved strictly for small, high-impact details such as live-game indicators, "hot" news badges, or notification dots.
- **Neutral:** A deep slate-black is used for typography to maintain elite readability, while light greys define subtle section boundaries.

## Typography

The typography strategy pairs **Lexend** for headings and UI labels with **Hanken Grotesk** for body copy. 

- **Lexend** provides an athletic, wide-stanced geometry that feels modern and readable, perfect for scoreboards and headlines.
- **Hanken Grotesk** offers a clean, technical precision for long-form news articles and data tables.
- **Scalability:** Display styles use tighter letter spacing and heavier weights to mimic sports broadcast graphics. Small labels often utilize uppercase styling to create a clear visual hierarchy in dense information environments.

## Layout & Spacing

The system uses a **12-column fixed grid** for desktop, transitioning to a **4-column fluid grid** for mobile. 

- **The 8px Rhythm:** All spacing and component heights are multiples of 8px (or 4px for tight internal padding).
- **Margins:** Desktop layouts use 40px external margins to breathe, while mobile scales down to 16px.
- **Data Density:** For stat-heavy tables or league standings, use a "Compact" vertical rhythm (4px/8px) to maximize information density without sacrificing the clean, white-space-first philosophy.

## Elevation & Depth

Depth in this design system is achieved through **low-contrast outlines** and **tonal layers** rather than heavy shadows.

- **Planes:** Surfaces are primarily flat white. Interactive cards use a subtle 1px border (#E9ECEF) to define boundaries.
- **Shadows:** When necessary (e.g., for elevated modals or floating action buttons), use a very soft, highly diffused "Ambient Shadow" with a slight Green tint in the shadow color to maintain brand harmony.
- **Tiers:** Use background color shifts (White to #F8F9FA) to differentiate between navigation sidebars and main content areas.

## Shapes

The shape language is **Rounded (0.5rem base)**, striking a balance between the aggressive sharpness of traditional sports media and the approachability of modern SaaS.

- **Standard Elements:** Buttons, input fields, and cards utilize the 0.5rem (8px) radius.
- **Special Elements:** Tags and "Live" indicators use a full **Pill-shape** to stand out against the more structured grid elements.
- **Media:** Photography and video thumbnails should follow the standard `rounded-lg` (1rem) rule to feel integrated into the interface.

## Components

- **Buttons:** Primary buttons are Solid Sports Green with White text. Secondary buttons use a Green outline on a White background. Avoid Orange for buttons unless it is a specific "Urgent" call to action.
- **Chips & Badges:** Use "Sports Green" for active filters. Use "Orange" only for high-priority status indicators like "LIVE" or "FINAL."
- **Cards:** White background with a subtle light-grey border. On hover, cards should transition to a very slight Sports Green outer glow or a 2px bottom-border in Green.
- **Inputs:** Clean, 1px bordered boxes that turn Sports Green on focus. Error states utilize a standard red, but success states must use the primary brand Green.
- **Progress Bars/Scores:** Use Sports Green for the leading team or completed stats. The contrast between Green and the White background is the primary tool for communicating data hierarchy.
- **Navigation:** Use a "White-out" top navigation bar with a Sports Green active-state underline for a premium, clean look.