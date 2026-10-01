const p1 = `**Diseño algorítmico de los motores de inferencia.** La deliberación autónoma del sistema reside en dos motores formulados para procesar la telemetría microclimática en tiempo real y gobernar el riego desatendido. El *motor de inferencia meteorológica* sustituye a los sensores resistivos analizando derivadas térmicas e higrométricas en ventanas deslizantes de 10, 20 y 30 minutos. El algoritmo evalúa caídas térmicas y alzas de humedad bajo cielo soleado, nublado o nocturno, infiriendo el inicio, duración y cese pluvial mediante criterios de recuperación térmica (su formulación matemática, matrices de umbrales y validación empírica se detallan en el **Apéndice C**, visualizándose en la interfaz de la Figura Ap-F17 del **Apéndice F**).`;

console.log("P1 (Intro + Meteorologico):");
console.log("Chars:", p1.length);
console.log("Lines (~78 char):", (p1.length / 78).toFixed(1));
