/* ============================================================
   MÓDULO 1 — Tablas de Ajustes y Tolerancias
   ------------------------------------------------------------
   Transcritas de "Tablas_Tolerancia_y_Ajuste.pdf" del docente:
     Tabla 1: Calidades IT (µm) por grupos de diámetros
     Tablas 2 y 3: Diferencias fundamentales AGUJEROS A…P (µm)
     Tablas 3 y 4: Diferencias fundamentales AGUJEROS R…ZC (µm)
     Tabla 5: Diferencias fundamentales EJES a…zc (µm)

   Convenciones:
   - Rango i cubre  min < d ≤ max  (criterio ISO ">30 a 50").
   - "finos": 25 rangos (tablas de desviaciones).
     "gruesos": 13 rangos (tabla IT y posiciones J,K,M,N,P / j,k).
     Donde la tabla impresa fusiona filas (p. ej. D = +80 para
     30–40 y 40–50), el valor se repite en cada rango fino.
   - tipo "inferior": el valor de tabla es la desviación inferior
     (di); la superior se obtiene ds = di + IT.
     tipo "superior": el valor es ds; di = ds − IT.
     tipo "js": di = −IT/2 ; ds = +IT/2 (nota de la Tabla 5).
   - null = la tabla trae guion (sin valor para ese rango).
   - porCalidad: lista de reglas { min, max, valores } sobre la
     calidad IT (primera regla que coincide gana).

   NOTAS DE TRANSCRIPCIÓN (verificar con el docente):
   1) En la tabla de agujeros A–H el escaneo dice "315<d≤335" y
      "335<d≤400"; las tablas de agujeros R–ZC y de ejes usan
      "315<d≤355" y "355<d≤400" (límites ISO). Se adoptó 355.
   2) Eje b, rango 250–280: el escaneo dice −460, pero el agujero
      B en el mismo rango dice +480. Se transcribió −460 tal cual.
   ============================================================ */

const TOLERANCIAS_DATA = {
  placeholder: false,

  // 25 rangos finos (mm) — tablas de desviaciones fundamentales
  rangosFinos: [
    { min: 0, max: 3 }, { min: 3, max: 6 }, { min: 6, max: 10 },
    { min: 10, max: 14 }, { min: 14, max: 18 }, { min: 18, max: 24 },
    { min: 24, max: 30 }, { min: 30, max: 40 }, { min: 40, max: 50 },
    { min: 50, max: 65 }, { min: 65, max: 80 }, { min: 80, max: 100 },
    { min: 100, max: 120 }, { min: 120, max: 140 }, { min: 140, max: 160 },
    { min: 160, max: 180 }, { min: 180, max: 200 }, { min: 200, max: 225 },
    { min: 225, max: 250 }, { min: 250, max: 280 }, { min: 280, max: 315 },
    { min: 315, max: 355 }, { min: 355, max: 400 }, { min: 400, max: 450 },
    { min: 450, max: 500 }
  ],

  // 13 rangos gruesos (mm) — tabla IT y posiciones J,K,M,N,P / j,k
  rangosGruesos: [
    { min: 0, max: 3 }, { min: 3, max: 6 }, { min: 6, max: 10 },
    { min: 10, max: 18 }, { min: 18, max: 30 }, { min: 30, max: 50 },
    { min: 50, max: 80 }, { min: 80, max: 120 }, { min: 120, max: 180 },
    { min: 180, max: 250 }, { min: 250, max: 315 }, { min: 315, max: 400 },
    { min: 400, max: 500 }
  ],

  // Tabla 1 — Calidades IT en µm (un valor por rango grueso)
  it: {
    "01": [0.3, 0.4, 0.4, 0.5, 0.6, 0.6, 0.8, 1, 1.2, 2, 2.5, 3, 4],
    "0":  [0.5, 0.6, 0.6, 0.8, 1, 1, 1.2, 1.5, 2, 3, 4, 5, 6],
    "1":  [0.8, 1, 1, 1.2, 1.5, 1.5, 2, 2.5, 3.5, 4.5, 6, 7, 8],
    "2":  [1.2, 1.5, 1.5, 2, 2.5, 2.5, 3, 4, 5, 7, 8, 9, 10],
    "3":  [2, 2.5, 2.5, 3, 4, 4, 5, 6, 8, 10, 12, 13, 15],
    "4":  [3, 4, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20],
    "5":  [4, 5, 6, 8, 9, 11, 13, 15, 18, 20, 23, 25, 27],
    "6":  [6, 8, 9, 11, 13, 16, 19, 22, 25, 29, 32, 36, 40],
    "7":  [10, 12, 15, 18, 21, 25, 30, 35, 40, 46, 52, 57, 63],
    "8":  [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 89, 97],
    "9":  [25, 30, 36, 43, 52, 62, 74, 87, 100, 115, 130, 140, 155],
    "10": [40, 48, 58, 70, 84, 100, 120, 140, 160, 185, 210, 230, 250],
    "11": [60, 75, 90, 110, 130, 160, 190, 220, 250, 290, 320, 360, 400],
    "12": [100, 120, 150, 180, 210, 250, 300, 350, 400, 460, 520, 570, 630],
    "13": [140, 180, 220, 270, 330, 390, 460, 540, 630, 720, 810, 890, 970],
    "14": [250, 300, 360, 430, 520, 620, 740, 870, 1000, 1150, 1300, 1400, 1550],
    "15": [400, 480, 580, 700, 840, 1000, 1200, 1400, 1600, 1850, 2100, 2300, 2500],
    "16": [600, 750, 900, 1100, 1300, 1600, 1900, 2200, 2500, 2900, 3200, 3600, 4000]
  },

  posiciones: {

    /* ---------------- AGUJEROS (Tablas 2, 3 y 4) ---------------- */
    agujero: {
      // A…H: diferencia inferior Di, todas las calidades (rangos finos)
      A:  { tipo: "inferior", rangos: "finos", valores: [270, 270, 280, 290, 290, 300, 300, 310, 320, 340, 360, 380, 410, 460, 520, 580, 660, 740, 820, 920, 1050, 1200, 1350, 1500, 1650] },
      B:  { tipo: "inferior", rangos: "finos", valores: [140, 140, 150, 150, 150, 160, 160, 170, 180, 190, 200, 220, 240, 260, 280, 310, 340, 380, 420, 480, 540, 600, 680, 760, 840] },
      C:  { tipo: "inferior", rangos: "finos", valores: [60, 70, 80, 95, 95, 110, 110, 120, 130, 140, 150, 170, 180, 200, 210, 230, 240, 260, 280, 300, 330, 360, 400, 440, 480] },
      CD: { tipo: "inferior", rangos: "finos", valores: [34, 46, 56, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
      D:  { tipo: "inferior", rangos: "finos", valores: [20, 30, 40, 50, 50, 65, 65, 80, 80, 100, 100, 120, 120, 145, 145, 145, 170, 170, 170, 190, 190, 210, 210, 230, 230] },
      E:  { tipo: "inferior", rangos: "finos", valores: [14, 20, 25, 32, 32, 40, 40, 50, 50, 60, 60, 72, 72, 85, 85, 85, 100, 100, 100, 110, 110, 125, 125, 135, 135] },
      EF: { tipo: "inferior", rangos: "finos", valores: [10, 14, 18, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
      F:  { tipo: "inferior", rangos: "finos", valores: [6, 10, 13, 16, 16, 20, 20, 25, 25, 30, 30, 36, 36, 43, 43, 43, 50, 50, 50, 56, 56, 62, 62, 68, 68] },
      FG: { tipo: "inferior", rangos: "finos", valores: [4, 6, 8, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
      G:  { tipo: "inferior", rangos: "finos", valores: [2, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 12, 12, 14, 14, 14, 15, 15, 15, 17, 17, 18, 18, 20, 20] },
      H:  { tipo: "inferior", rangos: "finos", valores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      JS: { tipo: "js" },

      // J…P: diferencia superior Ds, según calidad (rangos gruesos)
      J: { tipo: "superior", rangos: "gruesos", porCalidad: [
        { min: 6, max: 6, valores: [2, 5, 5, 6, 8, 10, 13, 16, 18, 22, 25, 29, 33] },
        { min: 7, max: 7, valores: [4, 6, 8, 10, 12, 14, 18, 22, 26, 30, 36, 39, 43] },
        { min: 8, max: 8, valores: [6, 10, 12, 15, 20, 24, 28, 34, 41, 47, 55, 60, 66] }
      ] },
      K: { tipo: "superior", rangos: "gruesos", porCalidad: [
        { min: 5, max: 5, valores: [0, 0, 1, 2, 1, 2, 3, 2, 3, 2, 3, 3, 2] },
        { min: 6, max: 6, valores: [0, 2, 2, 2, 2, 3, 4, 4, 4, 5, 5, 7, 8] },
        { min: 7, max: 7, valores: [0, 3, 5, 6, 6, 7, 9, 10, 12, 13, 16, 17, 18] },
        { min: 8, max: 8, valores: [0, 5, 6, 8, 10, 12, 14, 16, 20, 22, 25, 28, 29] }
      ] },
      M: { tipo: "superior", rangos: "gruesos", porCalidad: [
        { min: 5, max: 5, valores: [-2, -3, -4, -4, -5, -5, -6, -8, -9, -11, -13, -14, -16] },
        { min: 6, max: 6, valores: [-2, -1, -3, -4, -4, -4, -5, -6, -8, -8, -9, -10, -10] },
        { min: 7, max: 7, valores: [-2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { min: 8, max: 8, valores: [-2, 2, 1, 2, 4, 5, 5, 6, 8, 9, 9, 11, 11] },
        { min: 9, max: 18, valores: [-2, -4, -6, -7, -8, -9, -11, -13, -15, -17, -20, -21, -23] }
      ] },
      N: { tipo: "superior", rangos: "gruesos", porCalidad: [
        { min: 5, max: 5, valores: [-4, -7, -8, -9, -12, -13, -15, -18, -21, -25, -27, -30, -33] },
        { min: 6, max: 6, valores: [-4, -5, -7, -9, -11, -12, -14, -16, -20, -22, -25, -26, -27] },
        { min: 7, max: 7, valores: [-4, -4, -4, -5, -7, -8, -9, -10, -12, -14, -14, -16, -17] },
        { min: 8, max: 8, valores: [-4, -2, -3, -3, -3, -3, -4, -4, -4, -5, -5, -5, -6] },
        { min: 9, max: 18, valores: [-4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
      ] },
      P: { tipo: "superior", rangos: "gruesos", porCalidad: [
        { min: 5, max: 5, valores: [-6, -11, -13, -15, -19, -22, -27, -32, -37, -44, -49, -55, -61] },
        { min: 6, max: 6, valores: [-6, -9, -12, -15, -18, -21, -26, -30, -36, -41, -47, -51, -55] },
        { min: 7, max: 7, valores: [-6, -8, -9, -11, -14, -17, -21, -24, -28, -33, -36, -41, -45] },
        { min: 8, max: 18, valores: [-6, -12, -15, -18, -22, -26, -32, -37, -43, -50, -56, -62, -68] }
      ] },

      // R…ZC: diferencia superior Ds, según calidad (rangos finos)
      R: { tipo: "superior", rangos: "finos", porCalidad: [
        { min: 5, max: 5, valores: [-10, -14, -17, -20, -20, -25, -25, -30, -30, -36, -38, -46, -49, -57, -59, -62, -71, -74, -78, -87, -91, -101, -107, -119, -125] },
        { min: 6, max: 6, valores: [-10, -12, -16, -20, -20, -24, -24, -29, -29, -35, -37, -44, -47, -56, -58, -61, -68, -71, -75, -85, -89, -97, -103, -113, -119] },
        { min: 7, max: 7, valores: [-10, -11, -13, -16, -16, -20, -20, -25, -25, -30, -32, -38, -41, -48, -50, -53, -60, -63, -67, -74, -78, -87, -93, -103, -109] },
        { min: 8, max: 18, valores: [-10, -15, -19, -23, -23, -28, -28, -34, -34, -41, -43, -51, -54, -63, -65, -68, -77, -80, -84, -94, -98, -108, -114, -126, -132] }
      ] },
      S: { tipo: "superior", rangos: "finos", porCalidad: [
        { min: 5, max: 5, valores: [-14, -18, -21, -25, -25, -32, -32, -39, -39, -48, -54, -66, -74, -86, -94, -102, -116, -124, -134, -151, -163, -183, -201, -225, -245] },
        { min: 6, max: 6, valores: [-14, -16, -20, -25, -25, -31, -31, -38, -38, -47, -53, -64, -72, -85, -93, -101, -113, -121, -131, -149, -161, -179, -197, -219, -239] },
        { min: 7, max: 7, valores: [-14, -15, -17, -21, -21, -27, -27, -34, -34, -42, -48, -58, -66, -77, -85, -93, -105, -113, -123, -138, -150, -169, -187, -209, -229] },
        { min: 8, max: 18, valores: [-14, -19, -23, -28, -28, -35, -35, -43, -43, -53, -59, -71, -79, -92, -100, -108, -122, -130, -140, -158, -170, -190, -208, -232, -252] }
      ] },
      T: { tipo: "superior", rangos: "finos", porCalidad: [
        { min: 5, max: 5, valores: [null, null, null, null, null, null, -38, -44, -50, -61, -70, -86, -99, -116, -128, -140, -160, -174, -190, -211, -233, -261, -287, -323, -353] },
        { min: 6, max: 6, valores: [null, null, null, null, null, null, -37, -43, -49, -60, -69, -84, -97, -115, -127, -139, -157, -171, -187, -209, -231, -257, -283, -317, -347] },
        { min: 7, max: 7, valores: [null, null, null, null, null, null, -33, -39, -45, -55, -64, -78, -91, -107, -119, -131, -149, -163, -179, -198, -220, -247, -273, -307, -337] },
        { min: 8, max: 18, valores: [null, null, null, null, null, null, -41, -48, -54, -66, -75, -91, -104, -122, -134, -146, -166, -180, -196, -218, -240, -268, -294, -330, -360] }
      ] },
      U: { tipo: "superior", rangos: "finos", porCalidad: [
        { min: 5, max: 5, valores: [-18, -22, -26, -30, -30, -38, -45, -56, -66, -82, -97, -119, -139, -164, -184, -204, -230, -252, -278, -308, -343, -383, -428, -483, -533] },
        { min: 6, max: 6, valores: [-18, -20, -25, -30, -30, -37, -44, -55, -65, -81, -96, -117, -137, -163, -183, -203, -227, -249, -275, -306, -341, -379, -424, -477, -527] },
        { min: 7, max: 7, valores: [-18, -19, -22, -26, -26, -33, -40, -51, -61, -76, -91, -111, -131, -155, -175, -195, -219, -241, -267, -295, -330, -369, -414, -467, -517] },
        { min: 8, max: 18, valores: [-18, -23, -28, -33, -33, -41, -48, -60, -70, -87, -102, -124, -144, -170, -190, -210, -236, -258, -284, -315, -350, -390, -435, -490, -540] }
      ] },
      V: { tipo: "superior", rangos: "finos", porCalidad: [
        { min: 5, max: 5, valores: [null, null, null, null, -36, -44, -52, -64, -77, -97, -115, -141, -167, -196, -222, -246, -278, -304, -334, -378, -418, -468, -523, -588, -653] },
        { min: 6, max: 6, valores: [null, null, null, null, -36, -43, -51, -63, -76, -96, -114, -139, -165, -195, -221, -245, -275, -301, -331, -376, -416, -464, -519, -582, -647] },
        { min: 7, max: 7, valores: [null, null, null, null, -32, -39, -47, -59, -72, -91, -109, -133, -159, -187, -213, -237, -267, -293, -323, -365, -405, -454, -509, -572, -637] },
        { min: 8, max: 18, valores: [null, null, null, null, -39, -47, -55, -68, -81, -102, -120, -146, -172, -202, -228, -252, -284, -310, -340, -385, -425, -475, -530, -595, -660] }
      ] },
      X: { tipo: "superior", rangos: "finos", porCalidad: [
        { min: 5, max: 5, valores: [-20, -27, -32, -37, -42, -51, -61, -76, -93, -117, -141, -173, -205, -242, -274, -304, -344, -379, -419, -468, -518, -583, -653, -733, -813] },
        { min: 6, max: 6, valores: [-20, -25, -31, -37, -42, -50, -60, -75, -92, -116, -140, -171, -203, -241, -273, -303, -341, -376, -416, -466, -516, -579, -649, -727, -807] },
        { min: 7, max: 7, valores: [-20, -24, -28, -33, -38, -46, -56, -71, -88, -111, -135, -165, -197, -233, -265, -295, -333, -368, -408, -455, -505, -569, -639, -717, -797] },
        { min: 8, max: 18, valores: [-20, -28, -34, -40, -45, -54, -64, -80, -97, -122, -146, -178, -210, -248, -280, -310, -350, -385, -425, -475, -525, -590, -660, -740, -820] }
      ] },
      Y: { tipo: "superior", rangos: "finos", porCalidad: [
        { min: 6, max: 6, valores: [null, null, null, null, null, -59, -71, -89, -109, -138, -168, -207, -247, -293, -333, -373, -416, -461, -511, -571, -641, -719, -809, -907, -987] },
        { min: 7, max: 7, valores: [null, null, null, null, null, -55, -67, -85, -105, -133, -163, -201, -241, -285, -325, -365, -408, -453, -503, -560, -630, -709, -799, -897, -977] },
        { min: 8, max: 18, valores: [null, null, null, null, null, -63, -75, -94, -114, -144, -174, -214, -254, -300, -340, -380, -425, -470, -520, -580, -650, -730, -820, -920, -1000] }
      ] },
      Z: { tipo: "superior", rangos: "finos", porCalidad: [
        { min: 6, max: 6, valores: [-26, -32, -39, -47, -57, -69, -84, -107, -131, -166, -204, -251, -303, -358, -408, -458, -511, -566, -631, -701, -781, -889, -989, -1087, -1237] },
        { min: 7, max: 7, valores: [-26, -31, -36, -43, -53, -65, -80, -103, -127, -161, -199, -245, -297, -350, -400, -450, -503, -558, -623, -690, -770, -879, -979, -1077, -1227] },
        { min: 8, max: 18, valores: [-26, -35, -42, -50, -60, -73, -88, -112, -136, -172, -210, -258, -310, -365, -415, -465, -520, -575, -640, -710, -790, -900, -1000, -1100, -1250] }
      ] },
      ZA: { tipo: "superior", rangos: "finos", porCalidad: [
        { min: 7, max: 7, valores: [-32, -38, -46, -57, -70, -90, -110, -139, -171, -215, -263, -322, -387, -455, -520, -585, -653, -723, -803, -900, -980, -1129, -1279, -1427, -1577] },
        { min: 8, max: 18, valores: [-32, -42, -52, -64, -77, -98, -118, -148, -180, -226, -274, -335, -400, -470, -535, -600, -670, -740, -820, -920, -1000, -1150, -1300, -1450, -1600] }
      ] },
      ZB: { tipo: "superior", rangos: "finos", porCalidad: [
        { min: 8, max: 18, valores: [-40, -50, -67, -90, -108, -136, -160, -200, -242, -300, -360, -445, -525, -620, -700, -780, -880, -960, -1050, -1200, -1300, -1500, -1650, -1850, -2100] }
      ] },
      ZC: { tipo: "superior", rangos: "finos", porCalidad: [
        { min: 8, max: 18, valores: [-60, -80, -97, -130, -150, -188, -218, -274, -325, -405, -480, -585, -690, -800, -900, -1000, -1150, -1250, -1350, -1550, -1700, -1900, -2100, -2400, -2600] }
      ] }
    },

    /* ---------------- EJES (Tabla 5) ---------------- */
    eje: {
      // a…h: diferencia superior ds, todas las calidades (rangos finos)
      a:  { tipo: "superior", rangos: "finos", valores: [-270, -270, -280, -290, -290, -300, -300, -310, -320, -340, -360, -380, -410, -460, -520, -580, -660, -740, -820, -920, -1050, -1200, -1350, -1500, -1650] },
      // NOTA: en 250–280 el escaneo dice −460 (el agujero B dice +480 en ese rango) — verificar con el docente
      b:  { tipo: "superior", rangos: "finos", valores: [-140, -140, -150, -150, -150, -160, -160, -170, -180, -190, -200, -220, -240, -260, -280, -310, -340, -380, -420, -460, -540, -600, -680, -760, -840] },
      c:  { tipo: "superior", rangos: "finos", valores: [-60, -70, -80, -95, -95, -110, -110, -120, -130, -140, -150, -170, -180, -200, -210, -230, -240, -260, -280, -300, -330, -360, -400, -440, -480] },
      cd: { tipo: "superior", rangos: "finos", valores: [-34, -46, -56, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
      d:  { tipo: "superior", rangos: "finos", valores: [-20, -30, -40, -50, -50, -65, -65, -80, -80, -100, -100, -120, -120, -145, -145, -145, -170, -170, -170, -190, -190, -210, -210, -230, -230] },
      e:  { tipo: "superior", rangos: "finos", valores: [-14, -20, -25, -32, -32, -40, -40, -50, -50, -60, -60, -72, -72, -85, -85, -85, -100, -100, -100, -110, -110, -125, -125, -135, -135] },
      ef: { tipo: "superior", rangos: "finos", valores: [-10, -14, -18, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
      f:  { tipo: "superior", rangos: "finos", valores: [-6, -10, -13, -16, -16, -20, -20, -25, -25, -30, -30, -36, -36, -43, -43, -43, -50, -50, -50, -56, -56, -62, -62, -68, -68] },
      fg: { tipo: "superior", rangos: "finos", valores: [-4, -6, -8, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
      g:  { tipo: "superior", rangos: "finos", valores: [-2, -4, -5, -6, -6, -7, -7, -9, -9, -10, -10, -12, -12, -14, -14, -14, -15, -15, -15, -17, -17, -18, -18, -20, -20] },
      h:  { tipo: "superior", rangos: "finos", valores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      js: { tipo: "js" },

      // j, k: diferencia inferior di, según calidad (rangos gruesos)
      j: { tipo: "inferior", rangos: "gruesos", porCalidad: [
        { min: 5, max: 6, valores: [-2, -2, -2, -3, -4, -5, -7, -9, -11, -13, -16, -18, -20] },
        { min: 7, max: 7, valores: [-4, -4, -5, -6, -8, -10, -12, -15, -18, -21, -26, -28, -32] },
        { min: 8, max: 8, valores: [-6, null, null, null, null, null, null, null, null, null, null, null, null] }
      ] },
      k: { tipo: "inferior", rangos: "gruesos", porCalidad: [
        { min: 4, max: 7, valores: [0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5] },
        { min: 0, max: 18, valores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
      ] },

      // m…zc: diferencia inferior di, todas las calidades (rangos finos)
      m:  { tipo: "inferior", rangos: "finos", valores: [2, 4, 6, 7, 7, 8, 8, 9, 9, 11, 11, 13, 13, 15, 15, 15, 17, 17, 17, 20, 20, 21, 21, 23, 23] },
      n:  { tipo: "inferior", rangos: "finos", valores: [4, 8, 10, 12, 12, 15, 15, 17, 17, 20, 20, 23, 23, 27, 27, 27, 31, 31, 31, 34, 34, 37, 37, 40, 40] },
      p:  { tipo: "inferior", rangos: "finos", valores: [6, 12, 15, 18, 18, 22, 22, 26, 26, 32, 32, 37, 37, 43, 43, 43, 50, 50, 50, 56, 56, 62, 62, 68, 68] },
      r:  { tipo: "inferior", rangos: "finos", valores: [10, 15, 19, 23, 23, 28, 28, 34, 34, 41, 43, 51, 54, 63, 65, 68, 77, 80, 84, 94, 98, 108, 114, 126, 132] },
      s:  { tipo: "inferior", rangos: "finos", valores: [14, 19, 23, 28, 28, 35, 35, 43, 43, 53, 59, 71, 79, 92, 100, 108, 122, 130, 140, 158, 170, 190, 208, 232, 252] },
      t:  { tipo: "inferior", rangos: "finos", valores: [null, null, null, null, null, null, 41, 48, 54, 66, 75, 91, 104, 122, 134, 146, 166, 180, 196, 218, 240, 268, 294, 330, 360] },
      u:  { tipo: "inferior", rangos: "finos", valores: [18, 23, 28, 33, 33, 41, 48, 60, 70, 87, 102, 124, 144, 170, 190, 210, 236, 258, 284, 315, 350, 390, 435, 490, 540] },
      v:  { tipo: "inferior", rangos: "finos", valores: [null, null, null, null, 39, 47, 55, 68, 81, 102, 120, 146, 172, 202, 228, 252, 284, 310, 340, 385, 425, 475, 530, 595, 660] },
      x:  { tipo: "inferior", rangos: "finos", valores: [20, 28, 34, 40, 45, 54, 64, 80, 97, 122, 146, 178, 210, 248, 280, 310, 350, 385, 425, 475, 525, 590, 660, 740, 820] },
      y:  { tipo: "inferior", rangos: "finos", valores: [null, null, null, null, null, 63, 75, 94, 114, 144, 174, 214, 254, 300, 340, 380, 425, 470, 520, 580, 650, 730, 820, 920, 1000] },
      z:  { tipo: "inferior", rangos: "finos", valores: [26, 35, 42, 50, 60, 73, 88, 112, 136, 172, 210, 258, 310, 365, 415, 465, 520, 575, 640, 710, 790, 900, 1000, 1100, 1250] },
      za: { tipo: "inferior", rangos: "finos", valores: [32, 42, 52, 64, 77, 98, 118, 148, 180, 226, 274, 335, 400, 470, 535, 600, 670, 740, 820, 920, 1000, 1150, 1300, 1450, 1600] },
      zb: { tipo: "inferior", rangos: "finos", valores: [40, 50, 67, 90, 108, 136, 160, 200, 242, 300, 360, 445, 525, 620, 700, 780, 880, 960, 1050, 1200, 1300, 1500, 1650, 1850, 2100] },
      zc: { tipo: "inferior", rangos: "finos", valores: [60, 80, 97, 130, 150, 188, 218, 274, 325, 405, 480, 585, 690, 800, 900, 1000, 1150, 1250, 1350, 1550, 1700, 1900, 2100, 2400, 2600] }
    }
  }
};
