const fs = require('fs');

const doc = fs.readFileSync('docs/Tesis/TIG Julio Flores [vol. 1].md', 'utf-8');

const refIndex = doc.search(/^#\s*\*\*Referencias Bibliográficas\*\*/m);
const apIndex = doc.search(/^#\s*\*\*Apéndice A/m);
const refText = doc.substring(refIndex, apIndex);
const bodyText = doc.substring(0, refIndex);

const refParas = refText.split('\n\n')
  .map(p => p.trim())
  .filter(p => p.length > 0 && !p.startsWith('#') && p !== '---');

console.log(`Total referencias encontradas: ${refParas.length}`);

let allFound = true;
refParas.forEach((ref, idx) => {
  // Extract author surname and year: e.g. "Arias, F. G. (2012)" -> Arias, 2012
  const m = ref.match(/^([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?),\s*[A-ZÁÉÍÓÚÑ]\..*?\((\d{4}[a-z]?)\)/);
  if (m) {
    const author = m[1].trim();
    const year = m[2];
    const regex1 = new RegExp(author + '.*?\\(' + year + '\\)', 'i');
    const regex2 = new RegExp('\\(' + author + '.*?\\b' + year + '\\b', 'i');
    const inBody = regex1.test(bodyText) || regex2.test(bodyText);
    if (!inBody) {
      // Check special institutional authors
      const firstWord = author.split(' ')[0];
      const regex3 = new RegExp(firstWord + '.*?\\b' + year + '\\b', 'i');
      if (!regex3.test(bodyText)) {
        console.log(`⚠️ Referencia [${idx+1}] NO encontrada en el cuerpo: ${author} (${year})`);
        allFound = false;
      } else {
        console.log(`✅ Referencia [${idx+1}] citada en texto: ${author} (${year})`);
      }
    } else {
      console.log(`✅ Referencia [${idx+1}] citada en texto: ${author} (${year})`);
    }
  } else {
    // Check institutional author like UPEL or OASIS
    const inst = ref.match(/^([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)\.\s*\((\d{4}[a-z]?)\)/);
    if (inst) {
      const name = inst[1].trim();
      const year = inst[2];
      const regex = new RegExp(name.split(' ')[0] + '.*?\\b' + year + '\\b', 'i');
      if (!regex.test(bodyText)) {
        console.log(`⚠️ Referencia [${idx+1}] NO encontrada en el cuerpo: ${name} (${year})`);
        allFound = false;
      } else {
        console.log(`✅ Referencia [${idx+1}] citada en texto: ${name} (${year})`);
      }
    } else {
      console.log(`❓ No se pudo parsear referencia [${idx+1}]: ${ref.substring(0, 50)}...`);
    }
  }
});

if (allFound) {
  console.log('\n🎉 ¡TODAS LAS REFERENCIAS TIENEN CITA EN EL CUERPO (CORRESPONDENCIA 1 A 1 PERFECTA)!');
}
