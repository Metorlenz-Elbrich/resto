import PDFDocument from 'pdfkit';
import path from 'node:path';
import fs from 'node:fs';
import { UPLOADS_DIR, Recipe } from './db';

const MARGIN = 56;
const PAGE_WIDTH = 595.28; // A4 portrait, points
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const EMBEDDABLE_EXT = new Set(['.jpg', '.jpeg', '.png']);

const INK = '#2c2620';
const INK_SOFT = '#6b6255';
const TERRACOTTA = '#c1512f';
const OLIVE_DARK = '#55613f';
const LINE = '#e4dbc9';

function parseList(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function drawFooter(doc: PDFKit.PDFDocument, pageIndex: number, total: number) {
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(INK_SOFT)
    .text(`${pageIndex + 1} / ${total}`, MARGIN, 812, { width: CONTENT_WIDTH, align: 'center' });
}

export async function generateCookbookPdf(recipes: Recipe[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true, autoFirstPage: false });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ---------- Page de titre ----------
    doc.addPage();
    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor(OLIVE_DARK)
      .text('RECUEIL DE FAMILLE', { align: 'center' });
    doc.moveDown(2);
    doc
      .font('Helvetica-Bold')
      .fontSize(40)
      .fillColor(INK)
      .text('Le Livre de Recettes', { align: 'center' });
    doc.moveDown(1);
    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor(INK_SOFT)
      .text(`${recipes.length} recette${recipes.length > 1 ? 's' : ''} compilée${recipes.length > 1 ? 's' : ''} avec amour`, {
        align: 'center',
      });
    doc.moveDown(0.5);
    doc.text(
      new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      { align: 'center' },
    );

    // ---------- Table des matières (remplie après coup) ----------
    const tocPageIndex = doc.bufferedPageRange().count;
    doc.addPage();

    // ---------- Groupement par catégorie ----------
    const categories = Array.from(new Set(recipes.map((r) => r.category))).sort();
    const tocEntries: { category: string; title: string; page: number }[] = [];

    for (const category of categories) {
      const categoryRecipes = recipes.filter((r) => r.category === category);
      for (const recipe of categoryRecipes) {
        doc.addPage();
        const pageIndex = doc.bufferedPageRange().count - 1;
        tocEntries.push({ category, title: recipe.title, page: pageIndex + 1 });

        // Eyebrow catégorie
        doc.font('Helvetica-Bold').fontSize(10).fillColor(OLIVE_DARK).text(category.toUpperCase());
        doc.moveDown(0.3);

        // Titre
        doc.font('Helvetica-Bold').fontSize(24).fillColor(INK).text(recipe.title);
        doc.moveDown(0.3);

        // Meta line
        const metaParts: string[] = [];
        if (recipe.prep_time) metaParts.push(`Temps : ${recipe.prep_time}`);
        if (recipe.difficulty) metaParts.push(`Difficulté : ${recipe.difficulty}`);
        if (recipe.submitter_name) metaParts.push(`Par ${recipe.submitter_name}`);
        if (metaParts.length) {
          doc.font('Helvetica').fontSize(10.5).fillColor(INK_SOFT).text(metaParts.join('   ·   '));
          doc.moveDown(0.2);
        }
        if (recipe.tags) {
          doc.font('Helvetica-Oblique').fontSize(10).fillColor(INK_SOFT).text(recipe.tags);
        }
        doc.moveDown(0.6);

        // Photo (si présente et dans un format embarquable)
        let photoBottom = doc.y;
        if (recipe.photo_filename) {
          const ext = path.extname(recipe.photo_filename).toLowerCase();
          const filePath = path.join(UPLOADS_DIR, recipe.photo_filename);
          if (EMBEDDABLE_EXT.has(ext) && fs.existsSync(filePath)) {
            try {
              const imgWidth = 180;
              const imgX = MARGIN + CONTENT_WIDTH - imgWidth;
              const imgY = doc.y;
              doc.image(filePath, imgX, imgY, { fit: [imgWidth, 180] });
              photoBottom = imgY + 180 + 10;
            } catch {
              // image illisible : on continue sans planter l'export
            }
          }
        }

        const textColumnWidth = recipe.photo_filename ? CONTENT_WIDTH - 200 : CONTENT_WIDTH;

        // Ingrédients
        const ingredients = parseList(recipe.ingredients);
        doc.font('Helvetica-Bold').fontSize(13).fillColor(TERRACOTTA).text('Ingrédients', MARGIN, doc.y, {
          width: textColumnWidth,
        });
        doc.moveDown(0.25);
        doc.font('Helvetica').fontSize(11).fillColor(INK);
        for (const ingredient of ingredients) {
          doc.text(`•  ${ingredient}`, MARGIN, doc.y, { width: textColumnWidth });
        }

        doc.y = Math.max(doc.y, photoBottom) + 14;

        // Étapes
        const steps = parseList(recipe.steps);
        doc.font('Helvetica-Bold').fontSize(13).fillColor(TERRACOTTA).text('Préparation', MARGIN, doc.y, {
          width: CONTENT_WIDTH,
        });
        doc.moveDown(0.25);
        doc.font('Helvetica').fontSize(11).fillColor(INK);
        steps.forEach((step, i) => {
          doc.text(`${i + 1}.  ${step}`, MARGIN, doc.y, { width: CONTENT_WIDTH });
          doc.moveDown(0.15);
        });
      }
    }

    // ---------- Remplissage de la table des matières ----------
    doc.switchToPage(tocPageIndex);
    doc.font('Helvetica-Bold').fontSize(22).fillColor(INK).text('Table des matières', MARGIN, MARGIN);
    doc.moveDown(1.2);

    let currentCategory = '';
    for (const entry of tocEntries) {
      if (entry.category !== currentCategory) {
        currentCategory = entry.category;
        doc.moveDown(0.4);
        doc.font('Helvetica-Bold').fontSize(12).fillColor(OLIVE_DARK).text(currentCategory.toUpperCase(), MARGIN, doc.y, {
          width: CONTENT_WIDTH,
        });
        doc.moveDown(0.2);
      }
      doc.font('Helvetica').fontSize(11).fillColor(INK);
      const y = doc.y;
      doc.text(entry.title, MARGIN, y, { width: CONTENT_WIDTH - 40, continued: false });
      doc.text(String(entry.page), MARGIN, y, { width: CONTENT_WIDTH, align: 'right' });
    }

    // ---------- Pieds de page ----------
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      drawFooter(doc, i, range.count);
    }

    doc.end();
  });
}
