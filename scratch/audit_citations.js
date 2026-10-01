const fs = require('fs');

const doc = fs.readFileSync('docs/Tesis/TIG Julio Flores [vol. 1].md', 'utf-8');

const refIndex = doc.search(/^#\s*\*\*Referencias Bibliográficas\*\*/m);
if (refIndex === -1) {
  console.log('❌ No se encontró la sección de Referencias');
  process.exit(1);
}

// References end when Apéndice A starts
const apIndex = doc.search(/^#\s*\*\*Apéndice/m);
const refText = apIndex !== -1 ? doc.substring(refIndex, apIndex) : doc.substring(refIndex);
const bodyText = doc.substring(0, refIndex);

// Citations in body
const citationRegex = /\(([A-ZÁÉÍÓÚÑa-záéíóúñ\s&,]+(?:et al\.)?,\s*\d{4}[a-z]?(?:,\s*p\.\s*\d+)?)\)/g;
const narrativeCitationRegex = /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s*(?:y|&)\s*[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+|\s*et al\.)?)\s*\((\d{4}[a-z]?)(?:,\s*p\.\s*\d+)?\)/g;

const citations = new Map();

function addCit(author, year) {
  // clean author
  author = author.trim().replace(/\s+et al\./, '').replace(/,\s*$/, '');
  const key = `${author} (${year})`;
  citations.set(key, (citations.get(key) || 0) + 1);
}

let match;
while ((match = citationRegex.exec(bodyText)) !== null) {
  const parts = match[1].split(',');
  const author = parts[0].trim();
  const yearMatch = match[1].match(/\d{4}[a-z]?/);
  if (yearMatch && !author.includes('Figura') && !author.includes('Tabla') && !author.includes('Apéndice')) {
    addCit(author, yearMatch[0]);
  }
}

while ((match = narrativeCitationRegex.exec(bodyText)) !== null) {
  const author = match[1].trim();
  const year = match[2];
  if (!author.includes('Figura') && !author.includes('Tabla') && !author.includes('Apéndice')) {
    addCit(author, year);
  }
}

console.log(`--- CITAS DETECTADAS EN EL CUERPO (${citations.size}) ---`);
for (const [c, count] of citations.entries()) {
  console.log(`   ${c}: ${count} vez/veces`);
}

// References list
const refParas = refText.split('\n\n')
  .map(p => p.trim())
  .filter(p => p.length > 0 && !p.startsWith('#'));

console.log(`\n--- REFERENCIAS EN LISTA FINAL (${refParas.length}) ---`);
refParas.forEach((p, i) => {
  const firstLine = p.split('\n')[0];
  console.log(`   [${i+1}] ${firstLine.substring(0, 70)}...`);
});
