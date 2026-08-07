# Calculadora de Elementos de Máquinas

Aplicación web 100% del lado del cliente (sin backend) para resolver ejercicios de:

1. **Ajustes y Tolerancias** — dimensiones máx/mín, desviaciones, juego/aprieto, tipo de ajuste (SAU/SEU).
2. **Correas** — despeje con n₁·d₁ = n₂·d₂, relación i, E = 5·d, longitudes lazo abierto y cruzado.
3. **Rodamientos** — vida media en horas y meses de 30 días, con ciclos de trabajo múltiples.

## Uso

Abrir `index.html` con doble clic en cualquier navegador (PC, tablet o celular).
Las fórmulas se renderizan con KaTeX (CDN); sin internet se muestran en texto plano.

Cada módulo tiene un switch **Solo resultados / Paso a paso** (resolución estilo pizarrón:
fórmula → reemplazo → resultado con unidad).

## Estructura

```
index.html          Interfaz (pestañas, formularios, switch de modo)
css/styles.css      Estilos responsive mobile-first
js/utils.js         Formato numérico, render KaTeX/fallback, tablas y errores
js/app.js           Navegación y configuración de decimales
js/ajustes.js       Lógica Módulo 1
js/correas.js       Lógica Módulo 2
js/rodamientos.js   Lógica Módulo 3 (cálculo pendiente de tablas)
js/data/            ★ Tablas del docente (editar aquí, sin tocar la lógica)
  tolerancias.js       Rangos de Ø, posiciones fundamentales, IT (µm)  [PLACEHOLDER]
  correas-tabla.js     Selección de cantidad y tipo de correa          [PLACEHOLDER]
  rodamientos-tabla.js Rodamientos (C, C₀), X/Y, anillo, tipo de carga [PLACEHOLDER]
```

## Estado de las tablas

- **Módulo 1 (COMPLETO)**: tablas ISO transcritas de `Tablas_Tolerancia_y_Ajuste.pdf`
  (calidades IT01–IT16, agujeros A…ZC, ejes a…zc, hasta Ø500 mm).
- **Módulo 2 (COMPLETO)**: método Dunlop para cantidad y tipo de correa.
  Transcritas: Tabla 3 (Fcp), Tabla 4 (Fcl), Tabla 5 (Fc), dimensiones de secciones
  y diámetros mínimos (Tabla 1). El Gráfico Nº 1 (sección) se muestra como imagen.
  La Tabla 2 (Pb + adicional) y la Tabla 6 (Nº de correa) NO están transcritas:
  el usuario ingresa esos 3 valores y la app guía exactamente dónde mirarlos.
- **Módulo 3 (COMPLETO)**: método del parcial Nº2 del docente. Transcritas de
  `TABLAS ROD.pdf`: tabla de 39 rodamientos (d int/ext, D bola, Z, D·cosα/dm),
  tabla fc, tabla X-Y (con interpolación lineal), V₁ por anillo rotante y
  coeficientes de choque C₁. Incluye selector **truncar / redondear** con
  cantidad de decimales, aplicable también a los valores intermedios.

## Módulo 3 — fórmulas implementadas

```
dm = (de + di)/2                                  [mm]
D·cos(α)/dm → tabla → fc
C  = 0,0856 · fc · (i·cosα)^0,7 · Z^(2/3) · D^1,8 [kg, D en cm]
Fa/(i·Z·D²) → tabla (interpolación) → Y ; X = 0,56
P  = C₁ · (X · V₁ · Fr + Y · Fa)                  [kg]

Carga única:      L = 10⁶·C³ / (60·n·P³)          [horas]
Ciclo de trabajo: N'ᵢ = %ᵢ·nᵢ ; n' = ΣN'ᵢ ; αᵢ = N'ᵢ/n'
                  Nᵢ = 10⁶·C³/Pᵢ³ ; 1/N = Σ αᵢ/Nᵢ
                  L = N / (60·n')                 [horas]
LM = L · 5   ;   días = L / (hs por día)   ;   meses = días / 30
```
