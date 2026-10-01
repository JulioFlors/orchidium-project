const fs = require('fs');
const lines = fs.readFileSync('docs/Tesis/TIG Julio Flores [vol. 1].md', 'utf-8').split('\n');
lines.forEach((l, idx) => {
  if (l.includes('—')) {
    console.log(`L${idx+1}: ${l}`);
  }
});
