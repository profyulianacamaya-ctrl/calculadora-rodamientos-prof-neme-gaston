/* ============================================================
   MÓDULO 3 — Tablas de Rodamientos (material del docente)
   ------------------------------------------------------------
   Transcritas de "TABLAS ROD.pdf" (Ing. Mecatrónica — Neme
   Roque Jorge Gastón) y del método de los parciales resueltos:

     C  = 0,0856 · fc · (i·cosα)^0,7 · Z^(2/3) · D^1,8   [kg, D en cm]
     Pe = C1 · (X · V1 · Fr + Y · Fa)                     [kg]
     L  = 10⁶·C³ / (60·n·P³)                              [horas]
     Nn = 10⁶·C³ / Pn³ ; 1/N = Σ αi/Ni ; αi = N'i/n'
     LM = L · 5  (vida media probable)

   Rodamientos: bolas, una hilera (i = 1), α = 0°.
   D = diámetro de bola en mm (en las fórmulas se usa D/10 = cm).
   ratio = D·cos(α)/dm precalculado por el docente.
   ============================================================ */

const RODAMIENTOS_DATA = {
  placeholder: false,

  // Tabla de rodamientos: designación, d interior, d exterior,
  // D bola (mm), Z bolas, ratio = D·cos(α)/dm
  // Ordenados por designación ascendente (102…114, 202…214, 302…314)
  // para que sean fáciles de encontrar en el desplegable.
  rodamientos: [
    { designacion: "102", dInt: 15, dExt: 32, D: 4.76, Z: 9, ratio: 0.2026 },
    { designacion: "103", dInt: 17, dExt: 35, D: 4.76, Z: 10, ratio: 0.1831 },
    { designacion: "104", dInt: 20, dExt: 42, D: 6.35, Z: 8, ratio: 0.2048 },
    { designacion: "105", dInt: 25, dExt: 47, D: 6.35, Z: 10, ratio: 0.1764 },
    { designacion: "106", dInt: 30, dExt: 55, D: 7.14, Z: 11, ratio: 0.1680 },
    { designacion: "107", dInt: 35, dExt: 62, D: 7.94, Z: 11, ratio: 0.1637 },
    { designacion: "108", dInt: 40, dExt: 68, D: 7.94, Z: 13, ratio: 0.1470 },
    { designacion: "109", dInt: 45, dExt: 75, D: 8.73, Z: 13, ratio: 0.1455 },
    { designacion: "110", dInt: 50, dExt: 80, D: 8.73, Z: 14, ratio: 0.1343 },
    { designacion: "111", dInt: 55, dExt: 90, D: 10.32, Z: 13, ratio: 0.1423 },
    { designacion: "112", dInt: 60, dExt: 95, D: 10.32, Z: 14, ratio: 0.1332 },
    { designacion: "113", dInt: 65, dExt: 100, D: 10.32, Z: 15, ratio: 0.1251 },
    { designacion: "114", dInt: 70, dExt: 110, D: 11.91, Z: 14, ratio: 0.1323 },
    { designacion: "202", dInt: 15, dExt: 35, D: 6.35, Z: 7, ratio: 0.2540 },
    { designacion: "203", dInt: 17, dExt: 40, D: 7.14, Z: 8, ratio: 0.2505 },
    { designacion: "204", dInt: 20, dExt: 47, D: 7.94, Z: 8, ratio: 0.2370 },
    { designacion: "205", dInt: 25, dExt: 52, D: 7.94, Z: 9, ratio: 0.2062 },
    { designacion: "206", dInt: 30, dExt: 62, D: 9.53, Z: 9, ratio: 0.2072 },
    { designacion: "207", dInt: 35, dExt: 72, D: 11.11, Z: 9, ratio: 0.2077 },
    { designacion: "208", dInt: 40, dExt: 80, D: 11.91, Z: 9, ratio: 0.1985 },
    { designacion: "209", dInt: 45, dExt: 85, D: 12.7, Z: 9, ratio: 0.1954 },
    { designacion: "210", dInt: 50, dExt: 90, D: 12.7, Z: 10, ratio: 0.1814 },
    { designacion: "211", dInt: 55, dExt: 100, D: 14.29, Z: 10, ratio: 0.1844 },
    { designacion: "212", dInt: 60, dExt: 110, D: 15.88, Z: 10, ratio: 0.1868 },
    { designacion: "213", dInt: 65, dExt: 120, D: 16.67, Z: 10, ratio: 0.1802 },
    { designacion: "214", dInt: 70, dExt: 125, D: 17.46, Z: 10, ratio: 0.1791 },
    { designacion: "302", dInt: 15, dExt: 42, D: 8.73, Z: 6, ratio: 0.3063 },
    { designacion: "303", dInt: 17, dExt: 47, D: 8.75, Z: 7, ratio: 0.2734 },
    { designacion: "304", dInt: 20, dExt: 52, D: 9.53, Z: 7, ratio: 0.2647 },
    { designacion: "305", dInt: 25, dExt: 62, D: 11.11, Z: 7, ratio: 0.2554 },
    { designacion: "306", dInt: 30, dExt: 72, D: 12.7, Z: 8, ratio: 0.2490 },
    { designacion: "307", dInt: 35, dExt: 80, D: 13.49, Z: 8, ratio: 0.2346 },
    { designacion: "308", dInt: 40, dExt: 90, D: 15.08, Z: 8, ratio: 0.2320 },
    { designacion: "309", dInt: 45, dExt: 100, D: 17.46, Z: 8, ratio: 0.2408 },
    { designacion: "310", dInt: 50, dExt: 110, D: 19.05, Z: 8, ratio: 0.2381 },
    { designacion: "311", dInt: 55, dExt: 120, D: 20.64, Z: 8, ratio: 0.2359 },
    { designacion: "312", dInt: 60, dExt: 130, D: 22.23, Z: 8, ratio: 0.2340 },
    { designacion: "313", dInt: 65, dExt: 140, D: 23.81, Z: 8, ratio: 0.2323 },
    { designacion: "314", dInt: 70, dExt: 150, D: 25.4, Z: 8, ratio: 0.2309 }
  ],

  // Todos los rodamientos de la tabla: bolas, una hilera, α = 0°
  hileras: 1,
  alfaGrados: 0,

  // Tabla fc: D·cos(α)/dm → fc (se toma la fila más próxima)
  fcTabla: [
    { ratio: 0.05, fc: 3550 },
    { ratio: 0.06, fc: 3730 },
    { ratio: 0.07, fc: 3880 },
    { ratio: 0.08, fc: 4020 },
    { ratio: 0.09, fc: 4130 },
    { ratio: 0.10, fc: 4220 },
    { ratio: 0.12, fc: 4370 },
    { ratio: 0.14, fc: 4470 },
    { ratio: 0.16, fc: 4530 },
    { ratio: 0.18, fc: 4550 },
    { ratio: 0.20, fc: 4550 },
    { ratio: 0.22, fc: 4530 },
    { ratio: 0.24, fc: 4480 },
    { ratio: 0.26, fc: 4420 },
    { ratio: 0.28, fc: 4340 },
    { ratio: 0.30, fc: 4250 },
    { ratio: 0.32, fc: 4160 },
    { ratio: 0.34, fc: 4050 },
    { ratio: 0.36, fc: 3930 },
    { ratio: 0.38, fc: 3800 },
    { ratio: 0.40, fc: 3660 }
  ],

  // Tabla X e Y: Fa/(i·Z·D²) → Y (X = 0,56 constante).
  // Entre filas se interpola linealmente (método del docente).
  X: 0.56,
  xyTabla: [
    { x: 1.75, y: 2.3 },
    { x: 3.52, y: 1.99 },
    { x: 7.03, y: 1.71 },
    { x: 10.54, y: 1.55 },
    { x: 14.06, y: 1.45 },
    { x: 21.09, y: 1.31 },
    { x: 35.15, y: 1.15 },
    { x: 52.73, y: 1.04 },
    { x: 70.31, y: 1 }
  ],

  // Factor V1 según anillo rotante
  factorAnillo: { interior: 1, exterior: 1.2 },

  // Coeficientes de choque e impacto C1
  tiposCarga: [
    { clave: "constante", nombre: "Carga constante", c1: 1.0 },
    { clave: "choque-ligero", nombre: "Choques ligeros", c1: 1.5 },
    { clave: "choque-moderado", nombre: "Choques moderados", c1: 2.0 },
    { clave: "choque-fuerte", nombre: "Choques fuertes", c1: 3 }
  ],

  // Vida media probable = vida probable × 5 (parciales del docente)
  factorVidaMedia: 5
};
