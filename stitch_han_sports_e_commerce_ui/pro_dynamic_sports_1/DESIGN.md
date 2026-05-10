---
name: Pro Dynamic Sports
colors:
  surface: '#fff8f8'
  surface-dim: '#e1d8d9'
  surface-bright: '#fff8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf1f2'
  surface-container: '#f5eced'
  surface-container-high: '#efe6e7'
  surface-container-highest: '#e9e0e1'
  on-surface: '#1e1b1c'
  on-surface-variant: '#414751'
  inverse-surface: '#342f30'
  inverse-on-surface: '#f8efef'
  outline: '#727783'
  outline-variant: '#c1c6d3'
  surface-tint: '#0c5fae'
  primary: '#004481'
  on-primary: '#ffffff'
  primary-container: '#005baa'
  on-primary-container: '#bbd4ff'
  inverse-primary: '#a6c8ff'
  secondary: '#006d30'
  on-secondary: '#ffffff'
  secondary-container: '#88f79e'
  on-secondary-container: '#007233'
  tertiary: '#7d2500'
  on-tertiary: '#ffffff'
  tertiary-container: '#a53400'
  on-tertiary-container: '#ffc7b4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a6c8ff'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#004787'
  secondary-fixed: '#8bfaa1'
  secondary-fixed-dim: '#6fdd87'
  on-secondary-fixed: '#00210a'
  on-secondary-fixed-variant: '#005323'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59c'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#822700'
  background: '#fff8f8'
  on-background: '#1e1b1c'
  surface-variant: '#e9e0e1'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  section-gap: 64px
  element-gap: 16px
---

## Brand & Style

The design system is engineered for high-performance retail, balancing professional athleticism with an energetic shopping experience. It targets athletes in the racket sports community (Badminton, Tennis, Pickleball) who value authenticity and quality.

The visual style is **Corporate / Modern** with **High-Contrast** accents. It utilizes full-width layouts to create an immersive "stadium" feel, prioritizing large-scale product photography and bold messaging. The interface emphasizes speed and efficiency, mirroring the fast-paced nature of the sports it represents. The overall mood is "Chuyên nghiệp" (Professional), "Năng động" (Dynamic), and "Tin cậy" (Trustworthy).

## Colors

The palette is derived directly from the brand's visual identity and the heritage of sports retail.
- **Primary Blue & Secondary Green:** These represent the core brand and should be used primarily in gradients for headers, hero sections, and high-level branding elements to evoke a sense of movement and vitality.
- **Highlight Orange (#E95211):** This is the "Action Color." It is reserved strictly for CTAs (Call to Actions), "Sale" badges, and conversion-critical buttons to ensure maximum visibility.
- **Neutrals:** A deep Charcoal (#231F20) is used for typography to maintain high readability against White backgrounds, while a light surface gray is used to distinguish product sections.

## Typography

This design system uses **Inter** for its sturdy, neutral architecture that handles technical product specifications and Vietnamese diacritics with clarity.
- **Headlines:** Set with tight tracking and heavy weights (700-800) to create a sense of impact and authority.
- **Body Text:** Focuses on legibility for long product descriptions and technical specs.
- **Labels:** Used for navigation and categories, often employing uppercase styling for a more structured, retail-catalog appearance.
- **Vietnamese Support:** Ensure all font weights are loaded to prevent "faux-bolding" on accented characters (e.g., ớ, ờ, ặ).

## Layout & Spacing

The layout utilizes a **Fixed Grid** approach within a full-width container to ensure high-end product presentation.
- **Grid:** A 12-column system is used for desktop (1440px max-width), transitioning to 4 columns for mobile.
- **Gutter & Margins:** A consistent 24px gutter ensures product cards in a grid don't feel cluttered.
- **Sectioning:** Large vertical gaps (64px+) are used between major home page sections (e.g., "Sản phẩm mới" vs "Thương hiệu nổi bật") to allow the user's eyes to rest.
- **Mobile:** Margins shrink to 16px to maximize screen real estate for product imagery.

## Elevation & Depth

To maintain a "Professional Retail" look, the design system avoids heavy shadows, opting instead for **Low-contrast outlines** and **Tonal layers**.
- **Cards:** Product cards use a thin 1px border (#E5E7EB) that darkens or adds a very subtle ambient shadow on hover to indicate interactivity.
- **Floating Elements:** Only high-priority items like the "Giỏ hàng" (Cart) drawer or "Chat" widgets use diffused ambient shadows to separate them from the main content plane.
- **Depth via Color:** Use the light surface gray (#F4F6F8) for background sections to create depth without relying on drop shadows.

## Shapes

The shape language is **Soft (0.25rem)**. This slight rounding provides a modern touch while maintaining the "sturdy" and "technical" feel required for sports equipment. 
- **Buttons and Inputs:** Use the standard 0.25rem (4px) radius.
- **Product Images:** Should keep sharp or very slightly rounded corners to maintain the professional aesthetic.
- **Badges:** Small "Hot" or "New" badges may use a slightly higher roundedness (rounded-lg) to distinguish them from structural UI elements.

## Components

- **Buttons:** 
    - *Primary:* Solid Orange (#E95211) with White text. Bold and high-contrast.
    - *Secondary:* Ghost style with Primary Blue border and text.
- **Product Cards:** Must include a high-quality image, product title (Body-md Bold), price in Red (#E8002D), and a "Thêm vào giỏ" (Add to Cart) icon button.
- **Chips/Badges:** Small, high-contrast labels for "Giảm giá" (Discount) or "Chính hãng" (Authentic).
- **Input Fields:** Clean white backgrounds with 1px gray borders. Active states should use the Primary Blue for the border highlight.
- **Navigation:** Full-width mega-menu for racket categories (Cầu lông, Tennis, Pickleball) with iconography for each sport type.
- **Filter Sidebar:** Clear, collapsible accordion sections for Brand, Price Range, and Material.