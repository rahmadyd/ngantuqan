antislop active: during (session override).

Read `00-antislop.md` and `01-design-direction.md` thoroughly before proceeding. 

**Design Read (R-37):** Reading this as: E-commerce and Portfolio for a creative design studio (Ngantuqan), in a playful, retro-nature illustrative style (Perrier-inspired), dial ENERGY 3 / RHYTHM 1 / MOTION 2.

### PROJECT CONTEXT & GOAL
I am updating the UI of my Design Portfolio & Shop (selling Stickers, Posters, Tote Bags, and showing UI/Graphic design works). 
The current design is too generic. I want to inject a vibrant, illustrative, retro-nature aesthetic (referencing the provided image of the Perrier layout with a nature framing).

### STRICT LAYOUT RULES (01-design-direction.md)
1. **Hero Section Exception:** You are ONLY allowed to completely redesign the layout and composition of the Hero Section[cite: 8].
2. **Other Sections:** You MUST PRESERVE the existing section order, grid structures, component hierarchy, and layout relationships for all other sections[cite: 8]. Do NOT change the 4-card horizontal row layout or introduce/remove sections[cite: 8].
3. **Visual Styling Only:** For non-hero sections, you are only permitted to change colors, typography, backgrounds, borders, shadows, and subtle hover effects[cite: 8].

### VISUAL EXECUTION INSTRUCTIONS

**1. The Hero Section (Full Revamp):**
- Rebuild the hero layout to match the provided "Perrier" reference structure (image 5).
- Center the main studio headline using a chunky, retro, playful typeface (e.g., heavily stylized sans-serif or display font) that feels crafted, not default AI monospace.
- Add an illustrative background consisting of stylized vector hills, foliage, or floral elements at the bottom and sides, framing the hero text. Do not use generic 3D blobs (R-22)[cite: 7].
- Place a single, clear "JELAJAHI" (Discover) pill-shaped CTA button at the bottom center.
- **Purpose (R-31):** This sets a strong, memorable identity right at the entrance, separating the brand from sterile SaaS templates[cite: 7].

**2. Portfolio & Shop Grid (Layout Preserved, Style Updated):**
- Keep the existing grid layout for the products (Stickers, Posters, Tote Bags) and portfolio cards[cite: 8].
- Replace the generic, sterile borders with organic, slightly thicker borders or warm pastel background plates.
- Ensure the focus remains on the *design products being sold*, using subtle nature-themed vector accents (like a small leaf or flower graphic) only as decorative anchors, not as the main subject.
- Add purposeful hover states (Motion 2): slightly scaling up the product image and altering the border color.
- **Purpose (R-31):** Warm backgrounds and organic borders tie the strict grid into the natural/retro brand identity without breaking the functional layout[cite: 7].

**3. Typography & Color Palette:**
- Colors: Shift to a warm, earthy pastel palette (warm cream background, forest green/teal accents, soft terracotta or mustard for highlights). No pure black/white, and absolutely NO generic blue-purple gradients (R-01)[cite: 7].
- Typeface: Ensure the existing font sizing is respected, but update the font-family to fit the retro/crafted vibe. No Lucide generic icons (R-04)[cite: 7].

### REQUIRED OUTPUT & DELIVERY GATE
1. Update the `page.tsx`, `tailwind.config.ts`, and any global CSS files to reflect these changes. Use standard Tailwind utilities.
2. Before you finish your response, you MUST output the **Delivery Gate PASS/FAIL report** as required by `00-antislop.md`[cite: 7]. Specifically verify that C-1, C-2, and R-05 to R-31 have been respected, and explicitly confirm that NO layouts were changed outside the Hero section.
3. Write a one-line reason (R-31) for the background color choice and the card border styling you implemented[cite: 7].