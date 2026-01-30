import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { getAllCategories } from '../src/config/categories';
import { getDemoProfile } from './demo-templates/profiles';

const OUTPUT_ROOT = path.resolve(process.cwd(), 'public', 'demo-images');

const HERO_SIZE = { width: 1600, height: 900 };
const CARD_SIZE = { width: 800, height: 800 };

const args = process.argv.slice(2);
const targetCategory = args.includes('--category') ? args[args.indexOf('--category') + 1] : null;

const createSvg = (width: number, height: number, title: string, subtitle: string, bg: string, textColor: string) => {
  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bg}"/>
      <rect x="48" y="48" width="${width - 96}" height="${height - 96}" rx="32" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)" stroke-width="4"/>
      <text x="50%" y="52%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.08}" font-weight="700" fill="${textColor}">${title}</text>
      <text x="50%" y="62%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.04}" font-weight="500" fill="${textColor}" opacity="0.9">${subtitle}</text>
    </svg>
  `);
};

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function generateCategoryImages(categoryId: string, options: { title: string; subtitle: string; primary: string; textColor: string; items: string[] }) {
  const { title, subtitle, primary, textColor, items } = options;
  const categoryDir = path.join(OUTPUT_ROOT, categoryId);
  await ensureDir(categoryDir);

  // Hero
  const heroSvg = createSvg(HERO_SIZE.width, HERO_SIZE.height, title, subtitle, primary, textColor);
  await sharp(heroSvg).webp({ quality: 92 }).toFile(path.join(categoryDir, 'hero.webp'));

  // Cards
  const paddedItems = [...items];
  while (paddedItems.length < 7) {
    paddedItems.push(`Demo ${paddedItems.length + 1}`);
  }

  for (let i = 0; i < 7; i++) {
    const cardSvg = createSvg(
      CARD_SIZE.width,
      CARD_SIZE.height,
      paddedItems[i] || `Demo ${i + 1}`,
      title,
      primary,
      textColor
    );
    await sharp(cardSvg).webp({ quality: 90 }).toFile(path.join(categoryDir, `item-${i + 1}.webp`));
  }
}

async function main() {
  const categories = getAllCategories().filter((cat) => !targetCategory || cat.id === targetCategory);
  if (categories.length === 0) {
    console.error('No se encontró la categoría solicitada');
    process.exit(1);
  }

  console.log(`🖼️ Generando imágenes demo para ${categories.length} categorías...`);

  for (const cat of categories) {
    const profile = getDemoProfile(cat.id);
    const items = (profile.productExamples || profile.serviceExamples || []).slice(0, 7);
    const primary = cat.defaultTheme?.primaryColor || '#2563eb';
    const textColor = cat.defaultTheme?.textColor || '#ffffff';

    await generateCategoryImages(cat.id, {
      title: profile.companyName,
      subtitle: profile.tagline,
      primary,
      textColor,
      items,
    });

    console.log(`✅ ${cat.id}: hero + 7 cards en /public/demo-images/${cat.id}`);
  }

  console.log('\nListo. Usa las rutas /demo-images/<category_id>/hero.webp y item-*.webp en el seed.');
}

main().catch((error) => {
  console.error('Error generando imágenes demo:', error);
  process.exit(1);
});
