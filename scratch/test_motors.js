const pMeteorologico = `*Motor de inferencia meteorológica:* Sustituye a los sensores resistivos analizando derivadas térmicas e higrométricas en ventanas deslizantes de 10, 20 y 30 minutos. El algoritmo evalúa caídas térmicas y alzas de humedad relativa bajo cielo soleado, nublado o nocturno, infiriendo el inicio, duración y cese pluvial mediante criterios de recuperación térmica (su formulación matemática, matrices de umbrales y validación empírica se detallan en el **Apéndice C**, visualizándose en la interfaz de la Figura Ap-F17 del **Apéndice F**).`;

console.log("Chars:", pMeteorologico.length);
console.log("Lines (~78 char):", (pMeteorologico.length / 78).toFixed(1));
