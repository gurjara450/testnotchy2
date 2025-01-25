import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="150 90 200 270" width="512" height="512">
  <path d="M250 100 C 180 100, 150 150, 150 200 C 150 250, 180 300, 250 300 C 320 300, 350 250, 350 200 C 350 150, 320 100, 250 100 Z" fill="black"/>
  <path d="M200 150 C 180 170, 170 200, 170 250 C 170 300, 180 330, 200 350" fill="none" stroke="white" stroke-width="10"/>
  <path d="M250 100 C 220 120, 200 150, 190 200 C 180 250, 200 300, 250 320 C 300 340, 350 300, 360 250 C 370 200, 350 150, 320 120 C 290 90, 260 90, 250 100" fill="black"/>
  <path d="M280 150 C 260 170, 250 200, 250 250 C 250 300, 260 330, 280 350" fill="none" stroke="white" stroke-width="5"/>
</svg>
`;

// Ensure the public directory exists
const publicDir = join(__dirname, '..', 'public');
if (!existsSync(publicDir)) {
  mkdirSync(publicDir);
}

// Write the SVG file
const svgPath = join(publicDir, 'favicon.svg');
writeFileSync(svgPath, svgContent);

// Generate PNG versions
const sizes = [16, 32, 64, 128, 256, 512];

async function generatePNGs() {
  for (const size of sizes) {
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(join(publicDir, `favicon-${size}x${size}.png`));
  }
  console.log('PNG files generated successfully!');
}

generatePNGs().catch(console.error);
console.log('SVG file generated successfully!'); 