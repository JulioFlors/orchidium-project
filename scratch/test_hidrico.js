const pHidrico = `*Motor de inferencia hídrica:* Gobierna la autorización, el espaciamiento o el veto de los riegos articulando umbrales de ambas estaciones meteorológicas (EMA Exterior e Interior). El sistema inhibe la activación ante lluvia activa, preserva la alternancia interdiaria y aplica ventanas retrospectivas de seguridad (cuatro horas para suelo y ocho horas para nebulización). A su vez, evalúa de forma cruzada la temperatura, la humedad relativa y el DLI acumulado para clasificar la jornada, resolviendo si habilita la nebulización o acciona pulsos de humectación en piso para enfriamiento pasivo (las reglas de control, la matriz de veto y la auditoría de 369 tareas se detallan en el **Apéndice D**, visualizándose en la Figura Ap-F5 del **Apéndice F**).`;

console.log("HIDRICO:");
console.log("Chars:", pHidrico.length);
console.log("Lines (~78 char):", (pHidrico.length / 78).toFixed(1));
