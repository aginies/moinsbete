const fs = require('fs');
const path = require('path');

const NEXT_BUILD_DIR = path.join(__dirname, '..', '.next', 'static', 'chunks');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'chunks-manifest.json');

if (!fs.existsSync(NEXT_BUILD_DIR)) {
  console.error('Next.js build not found. Run `npm run build` first.');
  process.exit(1);
}

const chunks = {
  js: [],
  css: [],
};

fs.readdirSync(NEXT_BUILD_DIR).forEach(file => {
  const ext = path.extname(file);
  if (ext === '.js') {
    chunks.js.push(`/_next/static/chunks/${file}`);
  } else if (ext === '.css') {
    chunks.css.push(`/_next/static/chunks/${file}`);
  }
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(chunks, null, 2));
console.log(`Generated chunks manifest: ${chunks.js.length} JS + ${chunks.css.length} CSS files`);
