const fs = require('fs');

const doc = fs.readFileSync('docs/Tesis/TIG Julio Flores [vol. 1].md', 'utf-8');

// 1. Forbidden terms check
const forbidden = [
  { term: 'ciberfísico', regex: /ciberf[íi]sico/gi },
  { term: 'motobomba', regex: /motobomba/gi },
  { term: 'triple fuente de verdad', regex: /triple fuente de verdad/gi },
  { term: '45 m²', regex: /45\s*m[²2]|45\\text\{\s*m/gi },
  { term: 'long dash (—)', regex: /—/g }
];

console.log('--- AUDITORÍA DE TÉRMINOS PROHIBIDOS ---');
let forbiddenCount = 0;
for (const item of forbidden) {
  const matches = [...doc.matchAll(item.regex)];
  if (matches.length > 0) {
    console.log(`❌ Encontrado "${item.term}": ${matches.length} ocurrencias`);
    matches.forEach(m => console.log(`   Línea aprox: ${doc.substring(0, m.index).split('\n').length}: ${m[0]}`));
    forbiddenCount += matches.length;
  } else {
    console.log(`✅ Cero ocurrencias de "${item.term}"`);
  }
}

console.log(`\nResultado términos prohibidos: ${forbiddenCount === 0 ? 'APROBADO' : 'FALLIDO'}`);
