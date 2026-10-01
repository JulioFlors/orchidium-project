const fs = require('fs');
const content = fs.readFileSync('docs/Tesis/TIG Julio Flores [vol. 1].md', 'utf-8');
const lines = content.split('\n');

let inTarget = false;
let currentPara = [];
let startLine = 0;
let violations = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('## Construcción e Implementación Incremental')) {
    inTarget = true;
  }
  if (line.includes('Capítulo V') || line.includes('CAPÍTULO V')) {
    inTarget = false;
  }
  
  if (inTarget) {
    if (line.trim() === '' || line.startsWith('#') || line.startsWith('|') || line.startsWith('![') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('*') || line.trim() === '---') {
      if (currentPara.length > 0) {
        const text = currentPara.join(' ').trim();
        const estLines = (text.length / 78).toFixed(1);
        if ((parseFloat(estLines) > 8.0 || parseFloat(estLines) < 4.0) && !text.startsWith('*Nota.*') && !text.startsWith('**_Figura')) {
          console.log(`Line ${startLine + 1} (${estLines} lines, ${text.length} chars): ${text.substring(0, 60)}...`);
          violations++;
        }
        currentPara = [];
      }
    } else {
      if (currentPara.length === 0) startLine = i;
      currentPara.push(line);
    }
  }
}
console.log(`Total paragraph violations in chapter: ${violations}`);
