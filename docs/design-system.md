# E-commerce Design System

## Current Frontend Baseline

The frontend already exists and uses React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, and a single global CSS file at `frontend/src/styles.css`.

No separate UI framework, Tailwind setup, CSS-in-JS library, or component library is currently in use. Preserve this CSS-first approach unless a later task explicitly changes the architecture.

Reusable patterns already present:

- Layout shell: `.app-shell`, `.app-header`, `.app-main`, `.nav-links`
- Framed content: `.panel`
- Actions: `.primary-link`, `.primary-action`, `.secondary-action`, `.text-link`
- Catalog: `.catalog-page`, `.catalog-header`, `.catalog-filters`, `.product-grid`, `.product-card`
- Commerce flows: `.cart-item`, `.cart-summary`, `.checkout-grid`, `.checkout-form`, `.order-summary`
- States: `.status-error`, `.stock-status`, `.stock-status-empty`, `.product-card-skeleton`

## Brand

Brand name: ZenLiving

Product category: Nội thất thông minh, sofa và giường tủ, đồ trang trí (decor), nội thất chung cư

Target customer: Chủ căn hộ chung cư 25-45 tuổi, gia đình trẻ, người yêu phong cách tối giản (Minimalism/Scandinavian)

Storefront personality:

- Tinh tế
- Tối giản
- Sang trọng
- Tiện dụng
- Không gian mở

ZenLiving should feel like a calm apartment interior studio: edited, warm, functional, and premium without looking ornate. Product photos, material texture, proportions, price, dimensions, and purchasing actions should carry the experience.

## Design Direction

Build a clean production e-commerce storefront with restrained color, clear information hierarchy, and familiar buying patterns. The interface should feel closer to a curated apartment furniture catalog than a SaaS dashboard.

Signature design choice: use a "room plan label" language for compact metadata such as room type, material, dimensions, storage function, inventory, order status, and fulfillment hints. Keep it subtle: small uppercase labels, quiet borders, and precise spacing. Do not turn this into decorative badges everywhere.

Avoid:

- Generic AI-generated layouts
- Random purple gradients
- Glassmorphism
- Bento grids
- Excessive rounded cards
- Excessive shadows
- Oversized headings in transactional flows
- Decorative animations
- Emoji icons
- Fake reviews, fake discounts, or unsupported marketing claims

Prefer:

- Strong product imagery
- Readable typography
- Clear product names, prices, stock status, and actions
- Restrained use of color
- Consistent spacing
- Familiar e-commerce interaction patterns
- Subtle feedback for loading, errors, disabled actions, and mutations
- Mobile-first behavior
- Clear navigation and purchasing actions

## Colors

Use a neutral, premium apartment-living palette:

- Matte black: `#171717` for primary text, primary actions, active navigation, and high-emphasis commerce moments
- Matte black hover: `#2A2A2A` for hover or pressed states
- Wood accent: `#D4A373` for light decorative wood accents only
- Accessible accent: `#8A5A2B` for accent text, selected states, focus borders, and links when matte black is not appropriate
- Deep beige: `#E5E0D8` for selected large sections, brand-story bands, and warm separators
- Warm surface: `#FAF8F5` for the main page background, product cards, forms, summaries, and panels
- Product image well: `#F1EDE7`
- Secondary text: `#57534E`
- Muted label text: `#78716C`
- Border: `#D8D2C8`
- Strong border: `#B8AFA3`
- Error: `#B42318`
- Error border: `#F0B8B2`

Use matte black for decisive actions, text clarity, and default product prices. Use `#D4A373` only as a light decorative wood accent, not for small text on warm or white surfaces. Use `#8A5A2B` when accent text, selected states, focus borders, or links need better contrast. Avoid purple, blue-heavy, and high-saturation accents unless the brand is redefined.

## Implementation Clarifications

### Accent contrast

- Use `#D4A373` only as a light decorative wood accent.
- Do not use it for small text on warm or white surfaces.
- Use `#8A5A2B` for accessible accent text, selected states, focus borders, and links when matte black is not appropriate.
- Product prices should default to matte black.

### Page backgrounds

- Use `#FAF8F5` as the main page background.
- Use `#E5E0D8` for selected large sections, brand-story bands, or warm separators.
- Do not cover every page with deep beige.

### Image ratios

- Large furniture and room scenes: `4 / 3`
- Small decor products: `1 / 1`
- Cart thumbnails: `1 / 1`
- Product detail media: `4 / 3` or `3 / 2`

### Responsive tiers

- Mobile: below `640px`
- Tablet: `640px` to `1023px`
- Desktop: `1024px` and above

Keep the breakpoint system minimal.

### Interface language

Primary interface language: Vietnamese.

Use clear, concise Vietnamese commerce copy and avoid mixing Vietnamese and English unnecessarily.

## Typography

Current implementation uses Inter/system sans. The preferred ZenLiving type direction is geometric or elegant for headings, paired with a clean readable body face. Do not add font dependencies until visual implementation chooses the loading strategy.

Recommended roles:

- Display and headings: Montserrat, Raleway, or Playfair Display; use 600-800 weight for sans headings or 500-700 for Playfair Display
- Body: Inter, Lato, or Noto Sans; use 400-500 weight
- Utility labels: Inter, Lato, or Noto Sans; use 700 weight, uppercase only for compact metadata such as category, room type, material, stock, or admin labels

Recommended default pairing for first implementation:

- Heading font: Montserrat
- Body font: Inter
- Optional editorial accent: Playfair Display for rare, brand-led hero or collection headings only

Rules:

- Use one H1 per page shell or page-level view.
- Use page titles around `32-40px` on desktop and `28-34px` on mobile.
- Keep product names readable, not display-sized.
- Use price text as a strong commerce signal: bold, matte black by default, close to product title.
- Do not use oversized headings in cart, checkout, account, or admin flows.
- Keep letter spacing at `0`; uppercase labels should rely on weight and size, not wide tracking.

## Spacing

Use an 8px-based spacing system:

- `4px` for tight form/help relationships
- `8px` for label-to-control and compact item gaps
- `12px` for button groups and inline controls
- `16px` for card interiors and mobile flow gaps
- `24px` for page section gaps and grid gaps
- `32px` for product detail and checkout column gaps
- `48px` for page top/bottom padding
- `64px` only for calm storefront hero or wide desktop breathing room

Use `clamp()` for page gutters, matching the existing `clamp(20px, 5vw, 64px)` pattern.

## Border Radius

- Inputs and buttons: `6px`
- Product cards and panels: `8px`
- Product image wells: `6-8px`
- Avoid pill buttons unless the brand later requires them.
- Do not place every section inside a card; use cards for product items, forms, summaries, and focused state panels.

## Shadows

Current UI relies on borders rather than shadows. Keep that restraint.

- Default surfaces: no shadow
- Hoverable product cards: optional very subtle shadow, e.g. `0 8px 20px rgb(23 23 23 / 8%)`
- Checkout and cart summaries: border-first; use sticky positioning only if it improves purchase clarity
- Avoid large floating-card shadows and dashboard-like elevation stacks

## Product Imagery

Product images must be the primary visual element.

- Preserve aspect ratio.
- Use `4 / 3` for large furniture and room scenes.
- Use `1 / 1` for small decor products.
- Use `1 / 1` for cart thumbnails.
- Use `4 / 3` or `3 / 2` for product detail media.
- Use `object-fit: cover` for catalog cards and detail media.
- Prevent layout shifts by reserving image aspect ratio before images load.
- Lazy-load below-the-fold images when implementation reaches image-heavy pages.
- Use clear `alt` text from product image alt text or product name.
- Keep "No image" states quiet and visually aligned with `.product-card-image` / `.product-detail-media`.
- Prefer warm natural light, real room scale, wood texture, woven fabric, matte metal, and open-space apartment context.
- Avoid over-cropped atmospheric images that hide the product form or storage function.

## Button Hierarchy

Primary actions:

- Use for decisive commerce actions: `Add to cart`, `Checkout`, `Place order`, `Retry` after a blocking error.
- Style with matte black background, warm surface text, 6px radius, 700 weight.

Secondary actions:

- Use for lower-risk actions: filter apply, quantity update, remove, clear cart, back/navigation support.
- Style with warm surface background, matte black border/text.

Text links:

- Use for low-emphasis navigation such as `Back to products`.
- Keep underlines for hover/focus or browser defaults where appropriate.

Disabled actions:

- Keep visible and legible.
- Use `cursor: not-allowed` and reduced opacity.
- Disabled copy should explain the condition when needed, e.g. out of stock or unavailable quantity.

## Forms

Forms should feel utilitarian and low-friction.

- Labels sit above controls.
- Inputs use `42px` minimum height for touch usability.
- Use 6px radius and strong neutral borders.
- Preserve browser autocomplete attributes for checkout/account fields.
- Error copy must be specific and action-oriented.
- Keep checkout validation inline and close to the relevant form area.
- Do not hide invalid states behind toast-only feedback.
- Use URL search parameters for catalog search, filters, sorting, and pagination.

## Responsive Rules

Design mobile-first and let desktop add density.

- Minimum supported width: `320px`.
- Mobile: below `640px`.
- Tablet: `640px` to `1023px`.
- Desktop: `1024px` and above.
- Primary mobile target for verification: `390 x 844`.
- Primary desktop target for verification: `1440 x 900`.
- Collapse navigation, filters, product detail, cart line items, checkout grids, and admin rows to one column below `640px`.
- Keep the breakpoint system minimal.
- Keep action buttons full-width only where it improves mobile purchasing speed.
- Ensure product names, prices, buttons, and form labels never overlap or overflow.
- Preserve visible next-step actions above excessive supporting content in cart and checkout.

## Motion

Use subtle motion only for:

- Add-to-cart feedback
- Drawer or menu opening if introduced later
- Variant selection if introduced later
- Product gallery transitions if introduced later
- Form state changes
- Skeleton loading pulse

Preferred duration: `120-220ms`.

Respect `prefers-reduced-motion`.

Avoid decorative animation and scattered scroll effects. One intentional interaction is better than many unrelated flourishes.

## Product Card Rules

Product cards should be scannable and image-led.

- Image first, then product name, price, stock status, and one clear action.
- Include useful furniture attributes when available: dimensions, material, room fit, storage function, or color.
- Keep one action visible per card.
- Do not include fake reviews, fake discount badges, fake urgency, or unsupported marketing claims.
- Use category only when the data exists and it helps browsing.
- Out-of-stock cards keep the product visible but disable purchase action.
- Loading cards should preserve the final card dimensions.
- Hover states may strengthen border color or add a subtle shadow, but must not shift layout.

## Cart And Checkout Rules

Cart:

- Show product image, name, unit price, quantity control, stock or unavailable state, and line total.
- Keep unavailable items visually distinct with error border/text.
- Keep checkout disabled until unavailable quantity problems are resolved.
- Preserve clear paths back to products.

Checkout:

- Prioritize clarity, trust, error prevention, completion speed, and mobile usability.
- Keep form and order summary visible as a two-column layout on desktop and one column on mobile.
- Do not use experimental checkout layouts.
- Do not distract from the primary action.
- Do not fabricate shipping fees, taxes, discounts, delivery estimates, or payment assurances unless backed by backend data.

## Missing Information Before Visual Implementation

The following decisions are still required before final visual implementation:

- `[LOGO_OR_WORDMARK]`
- `[PRODUCT_IMAGE_STYLE]` such as studio photos, lifestyle photos, technical packshots, or mixed
- `[PRICE_AND_PROMOTION_POLICY]`
- `[SHIPPING_AND_RETURNS_COPY]`
- `[TRUST_SIGNALS]` that are actually supported by the business

Recommended first visual implementation target: `ProductListPage`, because it already contains routing, data fetching, URL filters, loading/error/empty states, product cards, stock status, and add-to-cart behavior.
