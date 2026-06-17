// Datos de demostración basados en la imagen de referencia para la Penka Mundial 2026
const DEMO_DATA = {
  headers: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"],
  players: [
    { name: "Andres García", points: [0, 0, 0, 0, 0, 0, 2, 4, 7, 7, 12, 14, 14, 19, 19, 19, 19, 21, 26, 28], participatesInAsado: true },
    { name: "Augusto Menestrey", points: [2, 2, 2, 4, 4, 4, 6, 8, 10, 15, 15, 17, 17, 17, 17, 20, 22, 25, 30, 32], participatesInAsado: false },
    { name: "Carlos Papagayo", points: [2, 2, 2, 4, 4, 4, 6, 6, 8, 8, 8, 10, 10, 10, 10, 10, 10, 13, 15, 18], participatesInAsado: true },
    { name: "Daniela Papagayo", points: [3, 3, 3, 5, 5, 8, 13, 13, 15, 20, 20, 22, 22, 22, 22, 22, 24, 26, 31, 33], participatesInAsado: true },
    { name: "David Medina", points: [2, 2, 7, 9, 9, 9, 11, 13, 15, 15, 15, 17, 17, 17, 22, 22, 27, 30, 32, 35], participatesInAsado: true },
    { name: "Diego Neira", points: [0, 0, 0, 2, 2, 2, 4, 4, 6, 6, 6, 8, 8, 8, 8, 8, 13, 16, 18, 21], participatesInAsado: false },
    { name: "Esteban Papagayo", points: [2, 7, 12, 12, 12, 12, 15, 15, 17, 22, 22, 24, 24, 24, 24, 24, 29, 32, 32, 37], participatesInAsado: true },
    { name: "Hernando García", points: [3, 3, 3, 3, 3, 3, 5, 10, 12, 17, 17, 19, 19, 19, 19, 22, 24, 24, 26, 29], participatesInAsado: true },
    { name: "Hugo Hurtado", points: [0, 0, 0, 0, 0, 5, 7, 7, 9, 9, 9, 11, 11, 11, 11, 14, 19, 21, 23, 23], participatesInAsado: false },
    { name: "Itay Benrey", points: [2, 7, 7, 9, 9, 9, 12, 12, 14, 14, 14, 16, 16, 16, 16, 16, 21, 23, 25, 25], participatesInAsado: false },
    { name: "Juanfe Muñoz", points: [0, 0, 5, 7, 7, 7, 9, 9, 11, 11, 11, 13, 13, 13, 13, 13, 13, 15, 17, 20], participatesInAsado: true },
    { name: "Luis E Papagayo", points: [5, 5, 10, 12, 12, 12, 14, 14, 16, 16, 16, 18, 18, 18, 18, 21, 24, 26, 28, 30], participatesInAsado: true },
    { name: "Marce Papagayo", points: [2, 2, 2, 2, 2, 2, 2, 2, 4, 4, 4, 6, 6, 6, 11, 14, 14, 16, 18, 20], participatesInAsado: true },
    { name: "Monita + Fabio", points: [5, 8, 8, 10, 10, 13, 13, 13, 15, 15, 15, 17, 17, 17, 17, 17, 22, 24, 26, 29], participatesInAsado: true },
    { name: "Nicolas Marin", points: [5, 10, 10, 10, 10, 13, 15, 15, 17, 17, 17, 19, 19, 19, 19, 19, 24, 27, 32, 35], participatesInAsado: true },
    { name: "Oswaldo Medina", points: [0, 5, 5, 5, 5, 8, 10, 10, 12, 15, 15, 17, 17, 17, 17, 17, 19, 21, 26, 28], participatesInAsado: true },
    { name: "Pablo Benrey", points: [5, 5, 5, 7, 7, 7, 9, 9, 11, 11, 14, 14, 14, 14, 14, 17, 22, 24, 26, 29], participatesInAsado: false },
    { name: "Rony (Israel)", points: [2, 2, 7, 7, 7, 12, 14, 14, 16, 21, 21, 23, 23, 28, 28, 31, 36, 38, 43, 45], participatesInAsado: false },
    { name: "Ruben Gallego", points: [2, 5, 10, 12, 12, 17, 19, 19, 21, 24, 24, 26, 26, 26, 26, 26, 29, 31, 33, 36], participatesInAsado: true },
    { name: "Sergio + Ryan", points: [5, 5, 5, 7, 7, 7, 9, 9, 11, 11, 11, 13, 13, 13, 13, 16, 18, 20, 22, 25], participatesInAsado: true },
    { name: "Vilma Papagayo", points: [5, 5, 5, 5, 5, 5, 7, 7, 9, 9, 12, 14, 14, 19, 19, 19, 21, 23, 26, 29], participatesInAsado: true },
    { name: "Yoav Bukstein", points: [0, 0, 0, 0, 0, 0, 5, 5, 7, 12, 15, 17, 17, 17, 17, 17, 22, 24, 29, 31], participatesInAsado: false }
  ],
  rules: {
    prizes: [
      { rank: "1º Lugar", value: "1'680.000 COP", icon: "🥇" },
      { rank: "2º Lugar", value: "420.000 COP", icon: "🥈" },
      { rank: "3º Lugar", value: "100.000 COP", icon: "🥉" }
    ]
  }
};
