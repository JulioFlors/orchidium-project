const p1 = `**Diseño algorítmico de los motores de inferencia.** La deliberación autónoma reside en dos motores que procesan la telemetría en tiempo real. El *motor de inferencia meteorológica* sustituye a los sensores resistivos analizando derivadas térmicas e higrométricas en ventanas de 10, 20 y 30 minutos. El algoritmo evalúa caídas de temperatura y alzas de humedad bajo cielo soleado, nublado o nocturno, infiriendo el inicio y cese de lluvias (su formulación matemática y validación empírica se detallan en el **Apéndice C**, visualizándose en la Figura Ap-F17 del **Apéndice F**).`;

const p2 = `Por su parte, el *motor de inferencia hídrica* gobierna el riego articulando ambas estaciones (EMA Exterior e Interior). Inhibe la irrigación ante lluvia activa o reciente (ventanas de cuatro horas en suelo y ocho en nebulización), respetando la alternancia interdiaria. A su vez, clasifica el día según el DLI acumulado y cruza temperatura con humedad interna para autorizar la nebulización o accionar humectación en piso para enfriamiento pasivo (la matriz de vetos y auditoría de 369 tareas se detallan en el **Apéndice D**, ilustrándose en la Figura Ap-F5 del **Apéndice F**).`;

console.log("=== P1 ===");
console.log(p1);
console.log("Chars:", p1.length, "Lines:", (p1.length / 78).toFixed(1));

console.log("\n=== P2 ===");
console.log(p2);
console.log("Chars:", p2.length, "Lines:", (p2.length / 78).toFixed(1));
