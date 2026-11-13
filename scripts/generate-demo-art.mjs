/**
 * Generates the DEMO artwork used by the demonstration dataset.
 *
 * These are abstract, brand-palette compositions — not depictions of real
 * client work (master_design.md §15 forbids fabricating real projects).
 * Output is committed to public/images/demo/ and is regenerable with:
 *   node scripts/generate-demo-art.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "images",
  "demo",
);

const PALETTE = {
  primary: "#4263EB",
  secondary: "#FFE66D",
  coral: "#FF6B6B",
  mint: "#8CE6C0",
  background: "#FFFDF7",
  text: "#20243A",
  surface: "#FFFFFF",
};

/** Deterministic hash so each name always yields the same composition. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function mulberry(seed) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const ACCENTS = [
  PALETTE.primary,
  PALETTE.secondary,
  PALETTE.coral,
  PALETTE.mint,
  PALETTE.primary,
  PALETTE.coral,
];

/** A wide editorial composition — used for covers and gallery frames. */
function wide(name, w, h) {
  const rnd = mulberry(hash(name));
  const accent = ACCENTS[Math.floor(rnd() * ACCENTS.length)];
  const accent2 = ACCENTS[Math.floor(rnd() * ACCENTS.length)];
  const bg = rnd() > 0.6 ? PALETTE.surface : PALETTE.background;

  const shapes = [];
  const count = 4 + Math.floor(rnd() * 4);

  for (let i = 0; i < count; i += 1) {
    const kind = rnd();
    const cx = rnd() * w;
    const cy = rnd() * h;
    const size = (0.12 + rnd() * 0.32) * Math.min(w, h);
    const fill = i % 2 === 0 ? accent : accent2;
    const op = (0.28 + rnd() * 0.55).toFixed(2);

    if (kind < 0.38) {
      shapes.push(
        `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${(size / 2).toFixed(0)}" fill="${fill}" opacity="${op}"/>`,
      );
    } else if (kind < 0.7) {
      const rot = Math.floor(rnd() * 90);
      const rx = (size * (0.6 + rnd() * 0.8)).toFixed(0);
      shapes.push(
        `<rect x="${(cx - size / 2).toFixed(0)}" y="${(cy - size / 2).toFixed(0)}" width="${rx}" height="${(size * 0.7).toFixed(0)}" rx="${(size * 0.16).toFixed(0)}" fill="${fill}" opacity="${op}" transform="rotate(${rot} ${cx.toFixed(0)} ${cy.toFixed(0)})"/>`,
      );
    } else {
      const points = [];
      const sides = 3 + Math.floor(rnd() * 3);
      for (let s = 0; s < sides; s += 1) {
        const angle = (Math.PI * 2 * s) / sides - Math.PI / 2;
        const r = size * (0.4 + rnd() * 0.4);
        points.push(
          `${(cx + Math.cos(angle) * r).toFixed(0)},${(cy + Math.sin(angle) * r).toFixed(0)}`,
        );
      }
      shapes.push(
        `<polygon points="${points.join(" ")}" fill="${fill}" opacity="${op}"/>`,
      );
    }
  }

  // Editorial baseline rule + oversized initial letter
  const barY = h * 0.78;
  const letter = name.replace(/[^a-z]/gi, "").charAt(0).toUpperCase() || "N";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${name}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  ${shapes.join("\n  ")}
  <rect x="${w * 0.08}" y="${barY}" width="${w * 0.22}" height="${Math.max(4, h * 0.012)}" rx="${h * 0.006}" fill="${PALETTE.text}" opacity="0.85"/>
  <text x="${w * 0.08}" y="${barY + h * 0.19}" font-family="Fredoka, Georgia, serif" font-size="${h * 0.2}" font-weight="600" fill="${PALETTE.text}" opacity="0.14">${letter}</text>
</svg>
`;
}

/** A square composition — used for product covers and avatars. */
function square(name, size) {
  const rnd = mulberry(hash(name + "sq"));
  const accent = ACCENTS[Math.floor(rnd() * ACCENTS.length)];
  const accent2 = ACCENTS[Math.floor(rnd() * ACCENTS.length)];
  const shapes = [];

  for (let i = 0; i < 5; i += 1) {
    const cx = rnd() * size;
    const cy = rnd() * size;
    const r = (0.1 + rnd() * 0.26) * size;
    const fill = i % 2 === 0 ? accent : accent2;
    if (rnd() > 0.5) {
      shapes.push(
        `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${fill}" opacity="${(0.35 + rnd() * 0.5).toFixed(2)}"/>`,
      );
    } else {
      shapes.push(
        `<rect x="${(cx - r / 2).toFixed(0)}" y="${(cy - r / 2).toFixed(0)}" width="${r.toFixed(0)}" height="${(r * 0.75).toFixed(0)}" rx="${(r * 0.2).toFixed(0)}" fill="${fill}" opacity="${(0.35 + rnd() * 0.5).toFixed(2)}" transform="rotate(${Math.floor(rnd() * 90)} ${cx.toFixed(0)} ${cy.toFixed(0)})"/>`,
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${name}">
  <rect width="${size}" height="${size}" fill="${PALETTE.surface}"/>
  ${shapes.join("\n  ")}
  <rect x="${size * 0.08}" y="${size * 0.86}" width="${size * 0.18}" height="${Math.max(3, size * 0.012)}" rx="${size * 0.006}" fill="${PALETTE.text}" opacity="0.8"/>
</svg>
`;
}

const files = [];

const wideNames = [
  "aurora-cover",
  "aurora-01",
  "aurora-02",
  "aurora-03",
  "kiln-cover",
  "kiln-01",
  "kiln-02",
  "northwind-cover",
  "northwind-01",
  "northwind-02",
  "verde-cover",
  "verde-01",
  "lumen-cover",
  "lumen-01",
  "lumen-02",
  "halcyon-cover",
  "halcyon-01",
  "service-social",
  "service-banner",
  "service-branding",
  "service-presentation",
  "service-uiux",
  "product-story-01",
  "product-story-02",
  "product-deck-01",
  "product-poster-01",
  "product-canva-01",
  "product-icons-01",
  "product-brandkit-01",
];

const squareNames = [
  "product-story",
  "product-deck",
  "product-poster",
  "product-canva",
  "product-icons",
  "product-brandkit",
];

mkdirSync(OUT_DIR, { recursive: true });

for (const name of wideNames) {
  files.push([`${name}.svg`, wide(name, 1200, 750)]);
}
for (const name of squareNames) {
  files.push([`${name}.svg`, square(name, 900)]);
}

for (const [file, content] of files) {
  writeFileSync(join(OUT_DIR, file), content, "utf8");
}

console.log(`Generated ${files.length} demo artwork files in public/images/demo/`);
