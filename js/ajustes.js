/* ============================================================
   MÓDULO 1 — Ajustes y Tolerancias
   Procedimiento del docente:
     1) Ubicar el rango de diámetro nominal en la tabla
     2) Posición fundamental (desviación de referencia) de agujero y eje
     3) IT (amplitud de tolerancia) según calidad
     4) Desviaciones di y ds de agujero y eje
     5) Dmáx = nominal + ds ; Dmín = nominal + di
     6) Juego máx = Dmáx ag − Dmín eje ; Juego mín = Dmín ag − Dmáx eje
     7) Tipo de ajuste según los signos
   Los valores salen de TOLERANCIAS_DATA (js/data/tolerancias.js).
   ============================================================ */

(function () {
  let ultimoResultado = null;

  const form = document.getElementById("form-ajustes");
  const salida = document.getElementById("salida-ajustes");
  const switchModo = document.getElementById("switch-ajustes");

  const inDiametro = document.getElementById("aj-diametro");
  const selPosAg = document.getElementById("aj-pos-agujero");
  const selItAg = document.getElementById("aj-it-agujero");
  const selPosEje = document.getElementById("aj-pos-eje");
  const selItEje = document.getElementById("aj-it-eje");

  const CALIDADES = Object.keys(TOLERANCIAS_DATA.it); // "01","0","1"…"16"

  /* ---------- Poblar selectores desde la tabla de datos ---------- */
  function poblarSelectores() {
    llenar(selPosAg, Object.keys(TOLERANCIAS_DATA.posiciones.agujero), "H");
    llenar(selPosEje, Object.keys(TOLERANCIAS_DATA.posiciones.eje), "g");
    llenar(selItAg, CALIDADES.map(function (c) { return "IT" + c; }), "IT7");
    llenar(selItEje, CALIDADES.map(function (c) { return "IT" + c; }), "IT6");
  }

  function llenar(select, opciones, porDefecto) {
    select.innerHTML = "";
    opciones.forEach(function (op) {
      const o = document.createElement("option");
      o.value = op;
      o.textContent = op;
      if (op === porDefecto) o.selected = true;
      select.appendChild(o);
    });
  }

  /* ---------- Cálculo ---------- */
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    calcular();
  });

  switchModo.addEventListener("change", function () {
    if (ultimoResultado) render();
  });

  function etiquetaRango(r) {
    return r.min === 0 ? "hasta " + r.max : ">" + r.min + " a " + r.max;
  }

  function buscarRango(lista, d) {
    return lista.findIndex(function (r) { return d > r.min && d <= r.max; });
  }

  /**
   * Obtiene la desviación fundamental de una posición para el
   * diámetro dado. Devuelve {js:true} | {valor, idx, etiqueta} | {error}.
   */
  function fundamental(defPos, calidad, idxFino, idxGrueso, nombrePos) {
    if (defPos.tipo === "js") return { js: true };
    const usaGruesos = defPos.rangos === "gruesos";
    const idx = usaGruesos ? idxGrueso : idxFino;
    const rango = (usaGruesos ? TOLERANCIAS_DATA.rangosGruesos : TOLERANCIAS_DATA.rangosFinos)[idx];

    let valores = defPos.valores;
    if (defPos.porCalidad) {
      const q = Number(calidad);
      const regla = defPos.porCalidad.find(function (r) {
        return q >= (r.min !== undefined ? r.min : 0) && q <= (r.max !== undefined ? r.max : 18);
      });
      if (!regla) {
        return { error: "La posición «" + nombrePos + "» no tiene valor de tabla para la calidad IT" + calidad + "." };
      }
      valores = regla.valores;
    }

    const v = valores[idx];
    if (v === null || v === undefined) {
      return { error: "La tabla no trae valor (guion) para la posición «" + nombrePos + "» en el rango " + etiquetaRango(rango) + " mm." };
    }
    return { valor: v, etiqueta: etiquetaRango(rango) };
  }

  /** A partir de la desviación fundamental y la IT, obtiene di y ds (µm). */
  function desviaciones(defPos, fund, it) {
    if (defPos.tipo === "js") {
      return { di: -it / 2, ds: it / 2, tipo: "js" };
    }
    if (defPos.tipo === "inferior") {
      return { di: fund, ds: fund + it, tipo: "inferior" };
    }
    return { ds: fund, di: fund - it, tipo: "superior" };
  }

  /** Formatea µm respetando decimales de tabla (IT01 = 0,3 µm). */
  function fmtUm(v) {
    return (v % 1 === 0) ? fmtNum(v, 0) : fmtNum(v, 1);
  }

  function calcular() {
    const errores = [];

    const lectD = leerNumero(inDiametro);
    marcarInvalido(inDiametro, false);
    if (lectD.vacio || lectD.invalido || lectD.valor <= 0) {
      errores.push("El diámetro nominal es obligatorio y debe ser un número positivo.");
      marcarInvalido(inDiametro, true);
    }

    const desig = {
      posAgujero: selPosAg.value,
      itAgujero: selItAg.value.replace("IT", ""),
      posEje: selPosEje.value,
      itEje: selItEje.value.replace("IT", "")
    };

    if (errores.length) { renderError(salida, errores); ultimoResultado = null; return; }

    const nominal = lectD.valor;

    // 1) Rangos de diámetro (criterio ISO: min < d ≤ max)
    const idxFino = buscarRango(TOLERANCIAS_DATA.rangosFinos, nominal);
    const idxGrueso = buscarRango(TOLERANCIAS_DATA.rangosGruesos, nominal);
    if (idxFino === -1 || idxGrueso === -1) {
      renderError(salida, "El diámetro " + fmtNum(nominal) + " mm está fuera de las tablas (hasta 500 mm).");
      ultimoResultado = null;
      return;
    }

    // 2) Posiciones fundamentales
    const defAg = TOLERANCIAS_DATA.posiciones.agujero[desig.posAgujero];
    const defEje = TOLERANCIAS_DATA.posiciones.eje[desig.posEje];
    if (!defAg) {
      renderError(salida, "La posición de agujero «" + desig.posAgujero + "» no está en la tabla.");
      ultimoResultado = null; return;
    }
    if (!defEje) {
      renderError(salida, "La posición de eje «" + desig.posEje + "» no está en la tabla.");
      ultimoResultado = null; return;
    }

    // 3) IT según calidad
    const itAgLista = TOLERANCIAS_DATA.it[desig.itAgujero];
    const itEjeLista = TOLERANCIAS_DATA.it[desig.itEje];
    if (!itAgLista) {
      renderError(salida, "No existe la calidad IT" + desig.itAgujero + " en la tabla.");
      ultimoResultado = null; return;
    }
    if (!itEjeLista) {
      renderError(salida, "No existe la calidad IT" + desig.itEje + " en la tabla.");
      ultimoResultado = null; return;
    }
    const itAg = itAgLista[idxGrueso];
    const itEje = itEjeLista[idxGrueso];

    // Desviaciones fundamentales
    const fundAg = fundamental(defAg, desig.itAgujero, idxFino, idxGrueso, desig.posAgujero);
    if (fundAg.error) { renderError(salida, fundAg.error); ultimoResultado = null; return; }
    const fundEje = fundamental(defEje, desig.itEje, idxFino, idxGrueso, desig.posEje);
    if (fundEje.error) { renderError(salida, fundEje.error); ultimoResultado = null; return; }

    // 4) Desviaciones di y ds (µm)
    const agujero = desviaciones(defAg, fundAg.js ? null : fundAg.valor, itAg);
    const eje = desviaciones(defEje, fundEje.js ? null : fundEje.valor, itEje);

    // 5) Dimensiones máximas y mínimas (mm; desviaciones en µm → /1000).
    // Truncadas a 3 decimales antes de seguir (así resuelve el docente a
    // mano, en cada paso, no solo en el resultado final).
    const ag = {
      dmax: truncar(nominal + agujero.ds / 1000, 3),
      dmin: truncar(nominal + agujero.di / 1000, 3)
    };
    const ej = {
      dmax: truncar(nominal + eje.ds / 1000, 3),
      dmin: truncar(nominal + eje.di / 1000, 3)
    };

    // 6) Juegos (mm), también truncados
    const juegoMax = truncar(ag.dmax - ej.dmin, 3);
    const juegoMin = truncar(ag.dmin - ej.dmax, 3);

    // 7) Tipo de ajuste
    let tipo;
    if (juegoMin > 0) tipo = "Ajuste con juego (móvil)";
    else if (juegoMax < 0) tipo = "Ajuste con aprieto (fijo)";
    else tipo = "Ajuste indeterminado";

    ultimoResultado = {
      nominal: nominal, desig: desig,
      idxFino: idxFino, idxGrueso: idxGrueso,
      etiquetaGrueso: etiquetaRango(TOLERANCIAS_DATA.rangosGruesos[idxGrueso]),
      itAg: itAg, itEje: itEje,
      defAg: defAg, defEje: defEje,
      fundAg: fundAg, fundEje: fundEje,
      agujero: agujero, eje: eje, dimsAg: ag, dimsEje: ej,
      juegoMax: juegoMax, juegoMin: juegoMin, tipo: tipo
    };
    render();
  }

  /* ---------- Render ---------- */
  function render() {
    if (switchModo.checked) renderPasoAPasoAjustes();
    else renderSoloResultadosAjustes();
  }

  function nombreAjuste(r) {
    return "Ø" + fmtNum(r.nominal) + " " + r.desig.posAgujero + r.desig.itAgujero + "/" + r.desig.posEje + r.desig.itEje;
  }

  /** Caja de resultados de una parte (agujero o eje): IT, di, ds, Dmáx, Dmín.
   * Las etiquetas de la jerga ISO (IT/di/ds) llevan una aclaración corta
   * al lado para quien no las tenga frescas. */
  function cajaParte(tipoParte, letraCalidad, it, desv, dims) {
    const c = caja((tipoParte === "agujero" ? "Agujero — " : "Eje — ") + letraCalidad,
      tipoParte === "agujero" ? "caja-agujero" : "caja-eje");

    const badge = document.createElement("span");
    badge.className = "caja-sistema";
    badge.textContent = tipoParte === "agujero" ? "SAU" : "SEU";
    c.querySelector(".caja-encabezado").appendChild(badge);

    c.cuerpo.appendChild(filaDato("IT (tolerancia)", fmtUm(it) + " µm", fmtNum(it / 1000, 3) + " mm"));
    c.cuerpo.appendChild(filaDato("di (desviación inferior)", fmtUm(desv.di) + " µm", fmtNum(desv.di / 1000, 3) + " mm"));
    c.cuerpo.appendChild(filaDato("ds (desviación superior)", fmtUm(desv.ds) + " µm", fmtNum(desv.ds / 1000, 3) + " mm"));
    c.cuerpo.appendChild(filaDato(
      (tipoParte === "agujero" ? "Dmáx" : "dmáx") + " (dimensión máxima)",
      fmtNum(dims.dmax, 3) + " mm", null, true
    ));
    c.cuerpo.appendChild(filaDato(
      (tipoParte === "agujero" ? "Dmín" : "dmín") + " (dimensión mínima)",
      fmtNum(dims.dmin, 3) + " mm", null, true
    ));
    return c;
  }

  function renderSoloResultadosAjustes() {
    const r = ultimoResultado;
    const esJuego = r.juegoMin > 0 || r.juegoMax > 0;

    salida.innerHTML = "";
    const cont = document.createElement("div");
    cont.className = "ajuste-resultado";

    const titulo = document.createElement("p");
    titulo.className = "ajuste-titulo";
    titulo.textContent = nombreAjuste(r);
    cont.appendChild(titulo);

    // Resultado destacado arriba de todo: el veredicto (juego/aprieto/
    // indeterminado) y los valores límite, antes de entrar al detalle.
    const etMax = esJuego ? "Jmáx" : "Amáx";
    const etMin = esJuego ? "Jmín" : "Amín";
    const valMax = esJuego ? r.juegoMax * 1000 : -r.juegoMin * 1000;
    const valMin = esJuego ? r.juegoMin * 1000 : -r.juegoMax * 1000;
    cont.appendChild(resumenHero(
      r.tipo,
      r.tipo.indexOf("juego") !== -1 ? "resumen-juego" : r.tipo.indexOf("aprieto") !== -1 ? "resumen-aprieto" : "resumen-indeterminado",
      [
        [etMax, fmtUm(valMax) + " µm", fmtNum(valMax / 1000, 3) + " mm"],
        [etMin, fmtUm(valMin) + " µm", fmtNum(valMin / 1000, 3) + " mm"]
      ]
    ));

    const comparacion = document.createElement("div");
    comparacion.className = "comparacion-ajuste";
    comparacion.appendChild(cajaParte("agujero", r.desig.posAgujero + r.desig.itAgujero, r.itAg, r.agujero, r.dimsAg));
    comparacion.appendChild(cajaParte("eje", r.desig.posEje + r.desig.itEje, r.itEje, r.eje, r.dimsEje));
    cont.appendChild(comparacion);

    salida.appendChild(cont);
    salida.appendChild(esquemaZonas(r));
  }

  /** Líneas del paso 2 (posición fundamental) para agujero o eje. */
  function lineaFundamental(nombre, letra, def, fund, calidad) {
    if (def.tipo === "js") {
      return {
        latex: "\\text{" + nombre + " } " + letra + ": d_i = -IT/2;\\ d_s = +IT/2 \\quad (\\text{posición } js)",
        texto: nombre + " " + letra + ": di = −IT/2 ; ds = +IT/2 (posición js)"
      };
    }
    const tipoTxt = def.tipo === "inferior" ? "inferior (di)" : "superior (ds)";
    return {
      latex: "\\text{" + nombre + " } " + letra + ": \\text{desv. " + tipoTxt + "} = " + fmtLatex(fund.valor, 1).replace("{,}0", "") + "\\ \\mu\\text{m}",
      texto: nombre + " " + letra + ": desviación " + tipoTxt + " = " + fmtUm(fund.valor) + " µm (rango " + fund.etiqueta + " mm)"
    };
  }

  /** Líneas del paso 4 (di y ds) para agujero o eje. */
  function lineaDesviaciones(nombre, desv, it) {
    if (desv.tipo === "js") {
      return {
        latex: "\\text{" + nombre + ": } d_i = -\\tfrac{IT}{2} = " + fmtLatex(desv.di, 1) + "\\ \\mu\\text{m};\\quad d_s = +\\tfrac{IT}{2} = " + fmtLatex(desv.ds, 1) + "\\ \\mu\\text{m}",
        texto: nombre + ": di = −IT/2 = " + fmtUm(desv.di) + " µm ; ds = +IT/2 = " + fmtUm(desv.ds) + " µm"
      };
    }
    if (desv.tipo === "inferior") {
      return {
        latex: "\\text{" + nombre + ": } d_i = " + fmtLatex(desv.di, 1).replace("{,}0", "") + "\\ \\mu\\text{m};\\quad d_s = d_i + IT = " + fmtLatex(desv.di, 1).replace("{,}0", "") + " + " + fmtLatex(it, 1).replace("{,}0", "") + " = " + fmtLatex(desv.ds, 1).replace("{,}0", "") + "\\ \\mu\\text{m}",
        texto: nombre + ": di = " + fmtUm(desv.di) + " µm ; ds = di + IT = " + fmtUm(desv.ds) + " µm"
      };
    }
    return {
      latex: "\\text{" + nombre + ": } d_s = " + fmtLatex(desv.ds, 1).replace("{,}0", "") + "\\ \\mu\\text{m};\\quad d_i = d_s - IT = " + fmtLatex(desv.ds, 1).replace("{,}0", "") + " - " + fmtLatex(it, 1).replace("{,}0", "") + " = " + fmtLatex(desv.di, 1).replace("{,}0", "") + "\\ \\mu\\text{m}",
      texto: nombre + ": ds = " + fmtUm(desv.ds) + " µm ; di = ds − IT = " + fmtUm(desv.di) + " µm"
    };
  }

  function renderPasoAPasoAjustes() {
    const r = ultimoResultado;
    const pasos = [];
    const etiquetaFino = etiquetaRango(TOLERANCIAS_DATA.rangosFinos[r.idxFino]);

    pasos.push({
      titulo: "Rango de diámetro nominal",
      lineas: [{
        latex: "\\varnothing " + fmtLatex(r.nominal) + "\\ \\text{mm} \\in \\text{rango } " + etiquetaFino.replace(">", "{>}").replace(" a ", "\\text{ a }") + "\\ \\text{mm}",
        texto: "Ø" + fmtNum(r.nominal) + " mm pertenece al rango " + etiquetaFino + " mm"
      }],
      nota: "Tablas de desviaciones: rango " + etiquetaFino + " mm. Tabla de calidades IT: rango " + r.etiquetaGrueso + " mm."
    });

    pasos.push({
      titulo: "Posición fundamental (desviación de referencia)",
      lineas: [
        lineaFundamental("Agujero", r.desig.posAgujero, r.defAg, r.fundAg, r.desig.itAgujero),
        lineaFundamental("Eje", r.desig.posEje, r.defEje, r.fundEje, r.desig.itEje)
      ],
      nota: "Tablas de diferencias fundamentales (agujeros y ejes), columnas «" + r.desig.posAgujero + "» y «" + r.desig.posEje + "»."
    });

    pasos.push({
      titulo: "Amplitud de tolerancia IT",
      lineas: [
        {
          latex: "IT" + r.desig.itAgujero + " = " + fmtLatex(r.itAg, 1).replace("{,}0", "") + "\\ \\mu\\text{m} \\quad (\\text{agujero})",
          texto: "IT" + r.desig.itAgujero + " = " + fmtUm(r.itAg) + " µm (agujero)"
        },
        {
          latex: "IT" + r.desig.itEje + " = " + fmtLatex(r.itEje, 1).replace("{,}0", "") + "\\ \\mu\\text{m} \\quad (\\text{eje})",
          texto: "IT" + r.desig.itEje + " = " + fmtUm(r.itEje) + " µm (eje)"
        }
      ],
      nota: "Tabla 1 (calidades), rango " + r.etiquetaGrueso + " mm."
    });

    pasos.push({
      titulo: "Desviaciones di y ds",
      lineas: [
        lineaDesviaciones("Agujero", r.agujero, r.itAg),
        lineaDesviaciones("Eje", r.eje, r.itEje)
      ]
    });

    function sumando(v) {
      // Envuelve en paréntesis los valores negativos: 45 + (−0,009)
      return v < 0 ? "(" + fmtLatex(v, 3) + ")" : fmtLatex(v, 3);
    }

    pasos.push({
      titulo: "Dimensiones máximas y mínimas",
      lineas: [
        {
          latex: "\\text{Agujero: } D_{max} = " + fmtLatex(r.nominal) + " + " + sumando(r.agujero.ds / 1000) + " = " + fmtLatex(r.dimsAg.dmax, 3) + "\\ \\text{mm};\\quad D_{min} = " + fmtLatex(r.nominal) + " + " + sumando(r.agujero.di / 1000) + " = " + fmtLatex(r.dimsAg.dmin, 3) + "\\ \\text{mm}",
          texto: "Agujero: Dmáx = " + fmtNum(r.dimsAg.dmax, 3) + " mm ; Dmín = " + fmtNum(r.dimsAg.dmin, 3) + " mm"
        },
        {
          latex: "\\text{Eje: } d_{max} = " + fmtLatex(r.nominal) + " + " + sumando(r.eje.ds / 1000) + " = " + fmtLatex(r.dimsEje.dmax, 3) + "\\ \\text{mm};\\quad d_{min} = " + fmtLatex(r.nominal) + " + " + sumando(r.eje.di / 1000) + " = " + fmtLatex(r.dimsEje.dmin, 3) + "\\ \\text{mm}",
          texto: "Eje: dmáx = " + fmtNum(r.dimsEje.dmax, 3) + " mm ; dmín = " + fmtNum(r.dimsEje.dmin, 3) + " mm"
        }
      ],
      nota: "Dmáx = nominal + ds ; Dmín = nominal + di (desviaciones pasadas a mm)."
    });

    pasos.push({
      titulo: "Juego máximo y mínimo",
      lineas: [
        {
          latex: "J_{max} = D_{max\\,ag} - d_{min\\,eje} = " + fmtLatex(r.dimsAg.dmax, 3) + " - " + fmtLatex(r.dimsEje.dmin, 3) + " = " + fmtLatex(r.juegoMax, 3) + "\\ \\text{mm} = " + fmtLatex(r.juegoMax * 1000, 1).replace("{,}0", "") + "\\ \\mu\\text{m}",
          texto: "Jmáx = Dmáx ag − dmín eje = " + fmtNum(r.juegoMax, 3) + " mm = " + fmtUm(r.juegoMax * 1000) + " µm"
        },
        {
          latex: "J_{min} = D_{min\\,ag} - d_{max\\,eje} = " + fmtLatex(r.dimsAg.dmin, 3) + " - " + fmtLatex(r.dimsEje.dmax, 3) + " = " + fmtLatex(r.juegoMin, 3) + "\\ \\text{mm} = " + fmtLatex(r.juegoMin * 1000, 1).replace("{,}0", "") + "\\ \\mu\\text{m}",
          texto: "Jmín = Dmín ag − dmáx eje = " + fmtNum(r.juegoMin, 3) + " mm = " + fmtUm(r.juegoMin * 1000) + " µm"
        }
      ]
    });

    pasos.push({
      titulo: "Tipo de ajuste",
      lineas: [{
        latex: "\\textbf{" + r.tipo.replace(/ /g, "\\ ") + "}",
        texto: r.tipo
      }],
      nota: "Jmín > 0 → juego (móvil); Jmáx < 0 → aprieto (fijo); signos mixtos → indeterminado."
    });

    renderPasos(salida, pasos);
    salida.appendChild(esquemaZonas(r));
  }

  /* ---------- Esquema de zonas de tolerancia (SVG) ---------- */
  function esquemaZonas(r) {
    const cont = document.createElement("div");
    cont.className = "esquema";

    const ancho = 360, alto = 200, cy = 100; // línea cero en y = cy
    const desvs = [r.agujero.di, r.agujero.ds, r.eje.di, r.eje.ds];
    const maxAbs = Math.max.apply(null, desvs.map(Math.abs)) || 1;
    const escala = 70 / maxAbs; // px por µm

    function y(uM) { return cy - uM * escala; }
    function zona(x, di, ds, color, borde, etiqueta) {
      const yTop = y(ds), yBot = y(di);
      const h = Math.max(2, yBot - yTop);
      return '<rect x="' + x + '" y="' + yTop + '" width="80" height="' + h + '" fill="' + color + '" stroke="' + borde + '" stroke-width="1.5"/>' +
        '<text x="' + (x + 40) + '" y="' + (alto - 8) + '" text-anchor="middle" font-size="12" fill="#1f2a37">' + etiqueta + "</text>";
    }

    const svg =
      '<svg viewBox="0 0 ' + ancho + " " + alto + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zonas de tolerancia">' +
      '<line x1="20" y1="' + cy + '" x2="' + (ancho - 20) + '" y2="' + cy + '" stroke="#5b6b7c" stroke-width="1.5" stroke-dasharray="6 4"/>' +
      '<text x="' + (ancho - 22) + '" y="' + (cy - 6) + '" text-anchor="end" font-size="11" fill="#5b6b7c">línea cero (Ø nominal)</text>' +
      zona(70, r.agujero.di, r.agujero.ds, "#e8f0fa", "#1d5fa8", "Agujero " + r.desig.posAgujero + r.desig.itAgujero) +
      zona(210, r.eje.di, r.eje.ds, "#fdeeee", "#b3261e", "Eje " + r.desig.posEje + r.desig.itEje) +
      "</svg>";

    cont.innerHTML = svg + '<p class="nota">Zonas de tolerancia respecto de la línea cero (escala en µm).</p>';
    return cont;
  }

  // Inicialización
  poblarSelectores();
  renderVacio(salida, "Carga los datos y presiona «Calcular ajuste».", "ajustes");
})();
