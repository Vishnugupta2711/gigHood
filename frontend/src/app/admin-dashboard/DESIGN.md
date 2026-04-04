# Design System Document

## 1. Overview & Creative North Star: "The Kinetic Ledger"

This design system is built to transform the chaotic nature of gig-economy income into a stable, high-fidelity operational experience. The Creative North Star is **The Kinetic Ledger**: a visual philosophy that treats data not as static text, but as a living, breathing financial control room. 

To move beyond the "standard dashboard" look, we employ **Editorial Density**. We utilize intentional asymmetry—placing high-contrast dark navy modules against a light cream canvas—to create an authoritative, premium environment. We avoid the "template" look by eschewing traditional borders in favor of tonal layering and sophisticated typographic scaling, ensuring the platform feels like a high-end financial instrument rather than a basic web app.

---

## 2. Colors

The palette is rooted in high-contrast professionalism, balancing the depth of the Indian night with the warmth of traditional paper.

### Core Palette
- **Background (`#FAFAF7`)**: Our "Main Background." It is a warm, light cream that reduces eye strain compared to pure white and provides a sophisticated, tactile feel.
- **Primary / Sidebar (`#0F172A`)**: A deep "Dark Navy" used for global navigation and high-priority "Hero" KPI cards. It signals authority and stability.
- **Status Tones**:
    - **Success (`#22C55E`)**: For "Active" or "Paid" states.
    - **Warning (`#F59E0B`)**: For "Pending" or "At Risk" thresholds.
    - **Error (`#EF4444`)**: For "Missed Income" or "System Alerts."
    - **Verifying (`#AC59FB`)**: A regal purple used exclusively for parametric data validation processes.

### The "No-Line" Rule
Traditional 1px borders are strictly prohibited for sectioning. Definition must be achieved through:
1.  **Tonal Shifts**: Use `surface-container-low` for a section background to separate it from the `surface` background.
2.  **Negative Space**: Use the spacing scale (e.g., `spacing-8`) to create rhythmic breathing room that acts as a natural boundary.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of financial documents:
- **Level 0 (Base)**: `surface` (#FAFAF7) - The desk.
- **Level 1 (Sections)**: `surface-container-low` (#F4F4F1) - The folder.
- **Level 2 (Data Cards)**: `surface-container-lowest` (#FFFFFF) - The individual report.

---

## 3. Typography: Inter

We use a high-contrast typographic scale to differentiate between "Command" (Headers) and "Utility" (Data).

- **Display & Headlines (Bold 700)**: Used for KPIs and Page titles. The heavy weight against the cream background provides an editorial, authoritative voice. 
    - *Example: `headline-lg` (2rem) for total earnings.*
- **Data & Body (Regular 400)**: Used for all tabular data and descriptive text. The Inter typeface's high x-height ensures legibility at high densities.
- **Labels (Medium 500/600)**: Used for table headers and micro-copy. These should often be in `on_surface_variant` (#45464D) to create a clear hierarchy between the "Label" and the "Value."

---

## 4. Elevation & Depth

In a "control room" environment, shadows must be purposeful, not decorative.

- **The Layering Principle**: Instead of shadows, use `surface-container-highest` (#E2E3E0) for recessed elements (like input fields or search bars) and `surface-container-lowest` (#FFFFFF) for elevated elements (like cards).
- **Ambient Shadows**: For floating modals or dropdowns, use an ultra-diffused shadow: `0 10px 30px rgba(15, 23, 42, 0.04)`. This uses a tint of our Dark Navy to mimic natural light.
- **The "Ghost Border"**: When high-density tables require separation, use the `outline-variant` token at 10% opacity. It should be felt, not seen.
- **Operational Glass**: For the sidebar or map overlays, use a `backdrop-blur` of 12px combined with a semi-transparent `primary_container` (#131B2E at 85% opacity). This creates a "Control Room" HUD effect.

---

## 5. Components

### High-Density Tables
- **Rule**: No vertical or horizontal divider lines.
- **Styling**: Use a subtle background hover state (`surface-container-high`) to highlight rows. Use `label-sm` for headers in all-caps with 0.05em letter spacing.
- **Density**: 8px padding (spacing-2.5) on table cells to maximize information per screen.

### KPI Cards
- **Primary Variant**: Dark Navy (`#0F172A`) background with `on_primary` (#FFFFFF) text. Use for the "North Star" metric.
- **Secondary Variant**: White (`#FFFFFF`) background with a 12px radius and the subtle `0 1px 3px rgba(0,0,0,0.08)` shadow.
- **Layout**: Value (700 Bold) on top, Label (400 Regular) on bottom.

### Inputs & Action Chips
- **Inputs**: Use `surface-container-lowest` with a "Ghost Border." Focus state is a 2px solid `primary_fixed_dim`.
- **Chips**: 12px radius. Use `secondary_container` (#6BFF8F) for positive status chips, with text in `on_secondary_container`. 

### Map Visualizations
- **Styling**: Custom map style using the `surface_dim` (#DADAD7) for landmass and `surface_container_lowest` for roads. 
- **Markers**: Use 8px circles with status colors. "Verifying" purple should pulsed gently to indicate real-time parametric activity.

---

## 6. Do's and Don'ts

### Do
- **Do** use `surface-container` tiers to create hierarchy.
- **Do** use the Spacing Scale strictly (e.g., 2.25rem for section gaps).
- **Do** treat "Income" numbers with the `headline-md` weight to make them the focal point.
- **Do** keep the 12px (`DEFAULT` 0.5rem) border radius consistent across all cards and buttons.

### Don't
- **Don't** use 100% black text. Always use `on_background` (#1A1C1B).
- **Don't** use gradients. The professionalism comes from flat, confident color blocks.
- **Don't** use icons as decoration. Every icon must be an "Action" or a "Status" indicator.
- **Don't** use standard shadows for cards. Stick to the 0.08 opacity subtle shadow or no shadow at all (layering only).

---

## Token Reference

### Layout Metadata
- **Color Mode**: LIGHT
- **Primary Font**: INTER 
- **Corner Roundness**: `ROUND_EIGHT` (12px / 0.75rem depending on mapping)
- **Spacing Scale Factor**: 1

### Derived Tailwind Variables

\`\`\`css
@layer base {
  :root {
    --bg-main: 250 25% 97%; /* #FAFAF7 approximated in HSL */
    --primary: 222 47% 11%; /* #0F172A */
    --success: 142 71% 45%; /* #22C55E */
    --warning: 38 92% 50%; /* #F59E0B */
    --danger: 348 83% 60%; /* #EF4444 */
    --verifying: 271 96% 67%; /* #AC59FB */
    --surface-base: 60 14% 97%; /* #FAFAF7 */
    --surface-low: 60 12% 95%; /* #F4F4F1 */
    --surface-lowest: 0 0% 100%; /* #FFFFFF */
  }
}
\`\`\`
