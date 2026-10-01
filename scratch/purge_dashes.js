const fs = require('fs');

let doc = fs.readFileSync('docs/Tesis/TIG Julio Flores [vol. 1].md', 'utf-8');

// Replace specific prose instances
doc = doc.replace('—tales como el Internet de las Cosas (IoT), la analítica de datos, los algoritmos de inferencia y la automatización agrícola—', '(tales como el Internet de las Cosas [IoT], la analítica de datos, los algoritmos de inferencia y la automatización agrícola)');
doc = doc.replace('—por su mayor capacidad de cómputo y memoria frente al ESP8266—', '(por su mayor capacidad de cómputo y memoria frente al ESP8266)');
doc = doc.replace('—tablero de potencia, nodos de control y estaciones meteorológicas—', '(tablero de potencia, nodos de control y estaciones meteorológicas)');
doc = doc.replace('—artículos científicos, tesis de grado y fichas técnicas de componentes electrónicos—', '(artículos científicos, tesis de grado y fichas técnicas de componentes electrónicos)');
doc = doc.replace('—lo que resultaría contraproducente bajo radiación cenital—', '(lo que resultaría contraproducente bajo radiación cenital)');
doc = doc.replace('—temperatura ($T$), humedad relativa ($HR$) e iluminancia solar ($Lux$)—', '(temperatura, humedad relativa e iluminancia solar)');
doc = doc.replace('—el cual actúa como plataforma de aterrizaje para polinizadores específicos—', '(el cual actúa como plataforma de aterrizaje para polinizadores específicos)');
doc = doc.replace('engineering — Life cycle processes — Requirements', 'engineering: Life cycle processes: Requirements');

// Replace table occurrences `| — |` with `| - |`
doc = doc.replace(/\| — \|/g, '| - |');

// Check if any remaining
const remaining = [...doc.matchAll(/—/g)];
console.log('Remaining em-dashes:', remaining.length);
if (remaining.length > 0) {
  remaining.forEach(m => {
    const lineNum = doc.substring(0, m.index).split('\n').length;
    console.log(`Line ${lineNum}`);
  });
} else {
  fs.writeFileSync('docs/Tesis/TIG Julio Flores [vol. 1].md', doc, 'utf-8');
  console.log('Successfully purged all em-dashes!');
}
