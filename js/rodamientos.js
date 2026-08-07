/* ============================================================
   MÓDULO 3 — Rodamientos
   Método del docente (parcial Nº2 de Elementos de Máquinas):

     dm = (de + di)/2                          [mm]
     D·cos(α)/dm  → por tabla → fc
     C = 0,0856 · fc · (i·cosα)^0,7 · Z^(2/3) · D^1,8   [kg, D en cm]

     Por cada etapa:
       Fa/(i·Z·D²)  → por tabla (interpolación) → Y ; X = 0,56
       V₁ = 1 (anillo interior gira) ó 1,2 (exterior gira)
       C₁ según tipo de carga (choques)
       P = C₁·(X·V₁·Fr + Y·Fa)                 [kg]

     Carga única:
       L = 10⁶·C³ / (60·n·P³)                  [horas]

     Ciclo de trabajo:
       N'ᵢ = %ᵢ · nᵢ  ;  n' = Σ N'ᵢ  ;  αᵢ = N'ᵢ / n'
       Nᵢ = 10⁶·C³ / Pᵢ³
       1/N = Σ αᵢ/Nᵢ   →   N
       L = N / (60·n')                         [horas]

     LM = L · 5   (vida media probable)
     días = L / (hs por día) ; meses = días / 30
   ============================================================ */

(function () {
  let ultimoResultado = null;

  const form = document.getElementById("form-rodamientos");
  const salida = document.getElementById("salida-rodamientos");
  const switchModo = document.getElementById("switch-rodamientos");
  const contCiclos = document.getElementById("ro-ciclos");
  const btnAgregar = document.getElementById("ro-agregar-ciclo");
  const sumaPctEl = document.getElementById("ro-suma-pct");
  const selRodamiento = document.getElementById("ro-rodamiento");
  const datosRodEl = document.getElementById("ro-datos-rod");
  const inHorasDia = document.getElementById("ro-horas-dia");
  const selUnidad = document.getElementById("ro-unidad-tiempo");
  const selModoFc = document.getElementById("ro-modo-fc");
  const seccionVida = document.getElementById("ro-seccion-vida");
  const btnCalcular = document.getElementById("ro-btn-calcular");

  function modoCalculo() {
    return form.querySelector('input[name="ro-modo-calculo"]:checked').value;
  }

  /** Muestra/oculta lo que solo aplica al cálculo de vida completa
   * (anillo rotante, horas por día, ciclo de trabajo) cuando el usuario
   * solo quiere la capacidad de carga dinámica (C). */
  function actualizarModoCalculo() {
    const esVida = modoCalculo() === "vida";
    seccionVida.hidden = !esVida;
    btnCalcular.textContent = esVida ? "Calcular vida del rodamiento" : "Calcular capacidad de carga (C)";
  }

  form.querySelectorAll('input[name="ro-modo-calculo"]').forEach(function (r) {
    r.addEventListener("change", function () {
      actualizarModoCalculo();
      if (ultimoResultado) calcular();
    });
  });

  /* ---------- Redondeo / truncado ----------
     Fijo: siempre trunca a 3 decimales, incluidos los valores
     intermedios — así es como el profesor resuelve a mano, sin
     opción de redondear (pedido explícito del usuario). */
  function cfgRedondeo() {
    return { modo: "truncar", dec: 3, intermedios: true };
  }

  /** Aplica truncar o redondear con la cantidad de decimales indicada. */
  function ajustar(v, cfg, forzar) {
    if (!isFinite(v)) return v;
    if (!forzar && !cfg.intermedios) return v;
    const f = Math.pow(10, cfg.dec);
    return cfg.modo === "truncar" ? Math.trunc(v * f) / f : Math.round(v * f) / f;
  }

  /** Formatea aplicando siempre el modo elegido (para mostrar). */
  function fmtR(v, cfg, grouping) {
    if (!isFinite(v)) return "—";
    const f = Math.pow(10, cfg.dec);
    const ajustado = cfg.modo === "truncar" ? Math.trunc(v * f) / f : Math.round(v * f) / f;
    return ajustado.toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: cfg.dec,
      useGrouping: !!grouping
    });
  }

  function latexR(v, cfg, grouping) {
    return fmtR(v, cfg, grouping).replace(/\./g, "{.}").replace(",", "{,}").replace("-", "\\text{−}");
  }

  /* ---------- Poblar selector de rodamientos ----------
     Solo el número de designación en el <option> (una lista larga con
     todos los datos encima es difícil de leer al desplegar). El detalle
     completo (d, D, Z, dm) se muestra debajo en #ro-datos-rod. */
  RODAMIENTOS_DATA.rodamientos.forEach(function (rod, i) {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = rod.designacion;
    selRodamiento.appendChild(o);
  });

  function mostrarDatosRod() {
    const rod = RODAMIENTOS_DATA.rodamientos[parseInt(selRodamiento.value, 10)];
    const dm = (rod.dExt + rod.dInt) / 2;
    datosRodEl.textContent = "d interior " + rod.dInt + " mm · d exterior " + rod.dExt +
      " mm · D bola " + rod.D + " mm · Z = " + rod.Z + " bolas · dm = " + fmtNum(dm, 1) + " mm";
  }
  selRodamiento.addEventListener("change", mostrarDatosRod);

  /* ---------- Filas de ciclo dinámicas ---------- */
  function agregarCiclo(valores) {
    const fila = document.createElement("div");
    fila.className = "ciclo-fila";
    fila.innerHTML =
      '<div class="ciclo-titulo">Etapa</div>' +
      '<button type="button" class="btn-quitar" title="Quitar etapa" aria-label="Quitar etapa">×</button>' +
      campo("tiempo", etiquetaTiempo(), "Ej.: 25") +
      campo("fr", "Fr — carga radial [kg]", "Ej.: 500") +
      campo("fa", "Fa — carga axial [kg]", "Ej.: 200") +
      campo("n", "n — velocidad [rpm]", "Ej.: 1000") +
      selectCarga() +
      selectOrientacion() +
      campo("angulo", "Ángulo inclinado [°]", "Opcional");

    fila.querySelector(".btn-quitar").addEventListener("click", function () {
      fila.remove();
      renumerar();
      actualizarSuma();
    });

    fila.querySelector('[data-campo="tiempo"]').addEventListener("input", actualizarSuma);

    if (valores) {
      Object.keys(valores).forEach(function (k) {
        const inp = fila.querySelector('[data-campo="' + k + '"]');
        if (inp) inp.value = valores[k];
      });
    }

    contCiclos.appendChild(fila);
    renumerar();
    actualizarSuma();
  }

  function etiquetaTiempo() {
    return selUnidad.value === "segundos" ? "Tiempo [s]" : "% del tiempo [%]";
  }

  function campo(nombre, etiqueta, placeholder) {
    return '<div class="campo"><label>' + etiqueta + '</label>' +
      '<input type="number" inputmode="decimal" step="any" min="0" data-campo="' + nombre + '" placeholder="' + placeholder + '"></div>';
  }

  function selectCarga() {
    let ops = "";
    RODAMIENTOS_DATA.tiposCarga.forEach(function (t) {
      ops += '<option value="' + t.clave + '">' + t.nombre + " (C₁ = " + t.c1.toFixed(1) + ")</option>";
    });
    return '<div class="campo"><label>Tipo de carga</label>' +
      '<select data-campo="tipoCarga">' + ops + "</select></div>";
  }

  function selectOrientacion() {
    return '<div class="campo"><label>Orientación del trabajo</label>' +
      '<select data-campo="orientacion">' +
      '<option value="horizontal" selected>Horizontal</option>' +
      '<option value="vertical">Vertical (Fr ↔ Fa)</option>' +
      "</select></div>";
  }

  function renumerar() {
    contCiclos.querySelectorAll(".ciclo-fila").forEach(function (f, i) {
      f.querySelector(".ciclo-titulo").textContent = "Etapa " + (i + 1);
    });
  }

  selUnidad.addEventListener("change", function () {
    contCiclos.querySelectorAll('[data-campo="tiempo"]').forEach(function (inp) {
      inp.previousElementSibling.textContent = etiquetaTiempo();
      inp.placeholder = selUnidad.value === "segundos" ? "Ej.: 25" : "Ej.: 45";
    });
    actualizarSuma();
  });

  function actualizarSuma() {
    const tiempos = contCiclos.querySelectorAll('[data-campo="tiempo"]');
    let suma = 0;
    tiempos.forEach(function (inp) {
      const v = Number(inp.value.replace(",", "."));
      if (isFinite(v)) suma += v;
    });
    if (tiempos.length === 0) { sumaPctEl.textContent = ""; return; }

    if (selUnidad.value === "segundos") {
      sumaPctEl.textContent = "Tiempo total del ciclo: " + fmtNum(suma, 2) + " s";
      sumaPctEl.classList.remove("mal");
      sumaPctEl.classList.toggle("ok", suma > 0);
    } else {
      sumaPctEl.textContent = "Suma de porcentajes: " + fmtNum(suma, 2) + "%";
      const ok = Math.abs(suma - 100) < 0.01;
      sumaPctEl.classList.toggle("ok", ok);
      sumaPctEl.classList.toggle("mal", !ok);
    }
  }

  btnAgregar.addEventListener("click", function () { agregarCiclo(); });

  /* ---------- Tablas: fc e interpolación de Y ---------- */
  /**
   * fc según la tabla D·cosα/dm.
   * modo "proxima": se toma la fila más próxima (parcial Nº2 del docente).
   * modo "interpolar": interpolación lineal entre las filas que encierran
   *   la razón, con la misma fórmula que usa el docente para X-Y.
   */
  function buscarFc(ratio, modo, cfg) {
    const t = RODAMIENTOS_DATA.fcTabla;

    let proxima = t[0];
    t.forEach(function (f) {
      if (Math.abs(f.ratio - ratio) < Math.abs(proxima.ratio - ratio)) proxima = f;
    });

    if (modo !== "interpolar") return { fc: proxima.fc, fila: proxima, interpolado: false };

    // Coincidencia exacta con una fila
    for (let k = 0; k < t.length; k++) {
      if (Math.abs(t[k].ratio - ratio) < 1e-9) {
        return { fc: t[k].fc, fila: t[k], interpolado: false };
      }
    }
    if (ratio < t[0].ratio) return { fc: t[0].fc, fila: t[0], interpolado: false, fuera: "menor" };
    if (ratio > t[t.length - 1].ratio) return { fc: t[t.length - 1].fc, fila: t[t.length - 1], interpolado: false, fuera: "mayor" };

    let inf = t[0], sup = t[t.length - 1];
    for (let k = 0; k < t.length - 1; k++) {
      if (ratio > t[k].ratio && ratio < t[k + 1].ratio) { inf = t[k]; sup = t[k + 1]; break; }
    }
    // Fórmula del docente: y = [(y1-y0)/(x1-x0)]·(x-x1) + y1
    const x0 = inf.ratio, y0 = inf.fc, x1 = sup.ratio, y1 = sup.fc;
    const bruto = ((y1 - y0) / (x1 - x0)) * (ratio - x1) + y1;
    return {
      fc: ajustar(bruto, cfg), fila: proxima, interpolado: true,
      x0: x0, y0: y0, x1: x1, y1: y1
    };
  }

  /** Y: interpolación lineal entre las dos filas que encierran la razón. */
  function interpolarY(x, cfg) {
    const t = RODAMIENTOS_DATA.xyTabla;

    // Coincidencia exacta con una fila
    for (let k = 0; k < t.length; k++) {
      if (Math.abs(t[k].x - x) < 1e-9) {
        return { y: t[k].y, exacta: t[k], fuera: false };
      }
    }
    if (x < t[0].x) return { y: t[0].y, fuera: "menor", limite: t[0] };
    if (x > t[t.length - 1].x) return { y: t[t.length - 1].y, fuera: "mayor", limite: t[t.length - 1] };

    // Filas que encierran x
    let inf = t[0], sup = t[t.length - 1];
    for (let k = 0; k < t.length - 1; k++) {
      if (x > t[k].x && x < t[k + 1].x) { inf = t[k]; sup = t[k + 1]; break; }
    }
    // Fórmula del docente: y = [(y1-y0)/(x1-x0)]·(x-x1) + y1
    const x1 = inf.x, y1 = inf.y, x0 = sup.x, y0 = sup.y;
    const yBruto = ((y1 - y0) / (x1 - x0)) * (x - x1) + y1;
    return { y: ajustar(yBruto, cfg), yBruto: yBruto, inf: inf, sup: sup, x0: x0, y0: y0, x1: x1, y1: y1, fuera: false };
  }

  /* ---------- Cálculo ---------- */
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    calcular();
  });

  switchModo.addEventListener("change", function () {
    if (ultimoResultado) render();
  });

  selModoFc.addEventListener("change", function () { if (ultimoResultado) calcular(); });

  /** Calcula solo dm, fc y C — sin anillo rotante, sin ciclo de trabajo.
   * Es el mismo procedimiento (Pasos 1 a 3) que usa el cálculo de vida,
   * pero sin necesitar ninguna carga ni etapa. */
  function calcularSoloCarga() {
    const cfg = cfgRedondeo();
    const rod = RODAMIENTOS_DATA.rodamientos[parseInt(selRodamiento.value, 10)];

    const i = RODAMIENTOS_DATA.hileras;
    const alfaRad = (RODAMIENTOS_DATA.alfaGrados * Math.PI) / 180;
    const cosAlfa = Math.cos(alfaRad);
    const dm = (rod.dExt + rod.dInt) / 2;
    const Dcm = rod.D / 10;
    const ratioBruto = (rod.D * cosAlfa) / dm;
    const ratio = ajustar(ratioBruto, cfg);
    const resFc = buscarFc(ratio, selModoFc.value, cfg);
    const fc = resFc.fc;

    const factorI = Math.pow(i * cosAlfa, 0.7);
    const factorZ = Math.pow(rod.Z, 2 / 3);
    const factorD = Math.pow(Dcm, 1.8);
    const Cbruto = 0.0856 * fc * factorI * factorZ * factorD;
    const C = ajustar(Cbruto, cfg);

    ultimoResultado = {
      modo: "carga", cfg: cfg, rod: rod,
      i: i, cosAlfa: cosAlfa, dm: dm, Dcm: Dcm,
      ratioBruto: ratioBruto, ratio: ratio, resFc: resFc, fc: fc,
      factorZ: factorZ, factorD: factorD, Cbruto: Cbruto, C: C
    };
    render();
  }

  function calcular() {
    if (modoCalculo() === "carga") { calcularSoloCarga(); return; }

    const cfg = cfgRedondeo();
    const errores = [];

    const rod = RODAMIENTOS_DATA.rodamientos[parseInt(selRodamiento.value, 10)];
    const anillo = form.querySelector('input[name="ro-anillo"]:checked').value;
    const V1 = RODAMIENTOS_DATA.factorAnillo[anillo];

    const lectHs = leerNumero(inHorasDia);
    marcarInvalido(inHorasDia, false);
    let horasDia = 24;
    if (!lectHs.vacio) {
      if (lectHs.invalido || lectHs.valor <= 0 || lectHs.valor > 24) {
        errores.push("Las horas de trabajo por día deben estar entre 0 y 24.");
        marcarInvalido(inHorasDia, true);
      } else {
        horasDia = lectHs.valor;
      }
    }

    // Leer etapas
    const filas = contCiclos.querySelectorAll(".ciclo-fila");
    if (filas.length === 0) errores.push("Agrega al menos una etapa del ciclo de trabajo.");

    const etapas = [];
    let sumaTiempo = 0;
    filas.forEach(function (f, idx) {
      const et = { idx: idx + 1 }; // et.n queda reservado para las rpm de la etapa
      [["tiempo", selUnidad.value === "segundos" ? "Tiempo [s]" : "% del tiempo"],
       ["fr", "Fr"], ["fa", "Fa"], ["n", "n"]].forEach(function (par) {
        const inp = f.querySelector('[data-campo="' + par[0] + '"]');
        const lect = leerNumero(inp);
        marcarInvalido(inp, false);
        if (lect.vacio) {
          errores.push("Etapa " + (idx + 1) + ": falta «" + par[1] + "».");
          marcarInvalido(inp, true);
        } else if (lect.invalido || lect.valor < 0) {
          errores.push("Etapa " + (idx + 1) + ": «" + par[1] + "» debe ser un número positivo.");
          marcarInvalido(inp, true);
        } else {
          et[par[0]] = lect.valor;
        }
      });

      const inpAng = f.querySelector('[data-campo="angulo"]');
      const lectAng = leerNumero(inpAng);
      marcarInvalido(inpAng, false);
      et.angulo = null;
      if (!lectAng.vacio) {
        if (lectAng.invalido || lectAng.valor < 0 || lectAng.valor >= 90) {
          errores.push("Etapa " + (idx + 1) + ": el ángulo debe estar entre 0° y 90°.");
          marcarInvalido(inpAng, true);
        } else {
          et.angulo = lectAng.valor;
        }
      }

      et.vertical = f.querySelector('[data-campo="orientacion"]').value === "vertical";
      if (et.vertical && et.angulo !== null && et.angulo > 0) {
        errores.push("Etapa " + (idx + 1) + ": elegí ángulo inclinado o trabajo vertical, no ambos.");
      }

      et.tipoCarga = RODAMIENTOS_DATA.tiposCarga.find(function (t) {
        return t.clave === f.querySelector('[data-campo="tipoCarga"]').value;
      });

      if (et.tiempo !== undefined) sumaTiempo += et.tiempo;
      etapas.push(et);
    });

    if (sumaTiempo <= 0) {
      errores.push("El tiempo total del ciclo debe ser mayor que cero.");
    }

    if (errores.length) { renderError(salida, errores); ultimoResultado = null; return; }

    /* --- Capacidad de carga dinámica C --- */
    const i = RODAMIENTOS_DATA.hileras;
    const alfaRad = (RODAMIENTOS_DATA.alfaGrados * Math.PI) / 180;
    const cosAlfa = Math.cos(alfaRad);
    const dm = (rod.dExt + rod.dInt) / 2;
    const Dcm = rod.D / 10;
    const ratioBruto = (rod.D * cosAlfa) / dm;
    const ratio = ajustar(ratioBruto, cfg);
    const resFc = buscarFc(ratio, selModoFc.value, cfg);
    const fc = resFc.fc;

    const factorI = Math.pow(i * cosAlfa, 0.7);
    const factorZ = Math.pow(rod.Z, 2 / 3);
    const factorD = Math.pow(Dcm, 1.8);
    const Cbruto = 0.0856 * fc * factorI * factorZ * factorD;
    const C = ajustar(Cbruto, cfg);
    const C3 = Math.pow(C, 3);

    /* --- Por etapa: descomposición, Y, P, N --- */
    let avisos = [];
    etapas.forEach(function (et) {
      // Trabajo inclinado: el valor de Fr se toma como la fuerza total F
      // aplicada a θ° y se descompone en Fr = F·cos θ y Fa = F·sen θ
      // (método de la práctica resuelta del docente).
      if (et.angulo !== null && et.angulo > 0) {
        const rad = (et.angulo * Math.PI) / 180;
        et.F = et.fr;
        et.faIgnorada = et.fa > 0 ? et.fa : null;
        et.frEf = et.F * Math.cos(rad);
        et.faEf = et.F * Math.sin(rad);
      } else if (et.vertical) {
        // Trabajo vertical: la dirección que el enunciado carga como Fr queda
        // alineada con el eje del rodamiento (axial) y viceversa — se intercambian.
        et.frEf = et.fa;
        et.faEf = et.fr;
      } else {
        et.frEf = et.fr;
        et.faEf = et.fa;
      }

      // Razón Fa/(i·Z·D²) con D en cm
      et.razonBruta = et.faEf / (i * rod.Z * Dcm * Dcm);
      et.razon = ajustar(et.razonBruta, cfg);

      if (et.faEf === 0) {
        et.Y = 0;
        et.interp = { y: 0, sinAxial: true };
      } else {
        et.interp = interpolarY(et.razon, cfg);
        et.Y = et.interp.y;
        if (et.interp.fuera === "menor") {
          avisos.push("Etapa " + et.idx + ": la razón Fa/(i·Z·D²) = " + fmtR(et.razon, cfg) +
            " es menor que el primer valor de la tabla (" + RODAMIENTOS_DATA.xyTabla[0].x +
            "). Se usó Y = " + RODAMIENTOS_DATA.xyTabla[0].y + " sin extrapolar.");
        }
        if (et.interp.fuera === "mayor") {
          avisos.push("Etapa " + et.idx + ": la razón Fa/(i·Z·D²) = " + fmtR(et.razon, cfg) +
            " supera el último valor de la tabla (" + RODAMIENTOS_DATA.xyTabla[RODAMIENTOS_DATA.xyTabla.length - 1].x +
            "). Se usó Y = " + RODAMIENTOS_DATA.xyTabla[RODAMIENTOS_DATA.xyTabla.length - 1].y + " sin extrapolar.");
        }
      }

      // Carga equivalente P
      et.X = RODAMIENTOS_DATA.X;
      et.C1 = et.tipoCarga.c1;
      et.terminoRadial = et.X * V1 * et.frEf;
      et.terminoAxial = et.Y * et.faEf;
      et.Pbruto = et.C1 * (et.terminoRadial + et.terminoAxial);
      et.P = ajustar(et.Pbruto, cfg);

      // Fracción del tiempo: siempre relativa al total del ciclo, sume o no 100
      // (en la práctica del docente 25+20+15+10 = 70% → t₁ = 25/70 = 0,357).
      et.porcentBruto = et.tiempo / sumaTiempo;
      et.porcent = ajustar(et.porcentBruto, cfg);

      // N' de la etapa
      et.Nprima = ajustar(et.porcent * et.n, cfg);

      // Revoluciones que soportaría con esa carga
      et.Ni = ajustar((1e6 * C3) / Math.pow(et.P, 3), cfg);
    });

    // n' = Σ N'
    const nPrima = ajustar(etapas.reduce(function (s, e) { return s + e.Nprima; }, 0), cfg);

    // αi y combinación
    let invN = 0;
    etapas.forEach(function (et) {
      et.alfa = ajustar(et.Nprima / nPrima, cfg);
      et.aporte = et.alfa / et.Ni;
      invN += et.aporte;
    });
    const N = 1 / invN;

    // Vida
    const unaEtapa = etapas.length === 1;
    const Lhoras = N / (60 * nPrima);
    const LM = Lhoras * RODAMIENTOS_DATA.factorVidaMedia;
    const Ldias = Lhoras / horasDia;
    const LMdias = LM / horasDia;
    const Lmeses = Ldias / 30;
    const LMmeses = LMdias / 30;

    ultimoResultado = {
      modo: "vida", cfg: cfg, rod: rod, anillo: anillo, V1: V1, horasDia: horasDia,
      i: i, cosAlfa: cosAlfa, dm: dm, Dcm: Dcm,
      ratioBruto: ratioBruto, ratio: ratio, resFc: resFc, fc: fc,
      factorZ: factorZ, factorD: factorD, Cbruto: Cbruto, C: C, C3: C3,
      etapas: etapas, unaEtapa: unaEtapa, sumaTiempo: sumaTiempo,
      unidad: selUnidad.value, nPrima: nPrima, invN: invN, N: N,
      Lhoras: Lhoras, Ldias: Ldias, Lmeses: Lmeses,
      LM: LM, LMdias: LMdias, LMmeses: LMmeses,
      avisos: avisos
    };
    render();
  }

  /* ---------- Render ---------- */
  function render() {
    if (ultimoResultado.modo === "carga") {
      if (switchModo.checked) renderPasoAPasoCarga();
      else renderSoloResultadosCarga();
      return;
    }
    if (switchModo.checked) renderPasoAPasoRod();
    else renderSoloResultadosRod();
  }

  /** Pasos 1 a 3 (dm, fc, C) reutilizados por el paso a paso de ambos modos. */
  function pasosCapacidadCarga(r) {
    const cfg = r.cfg, rod = r.rod;
    const pasos = [];

    pasos.push({
      titulo: "Diámetro medio del rodamiento",
      lineas: [
        { latex: "d_m = \\dfrac{d_e + d_i}{2}", texto: "dm = (de + di)/2" },
        {
          latex: "d_m = \\dfrac{" + fmtLatex(rod.dExt, 0) + " + " + fmtLatex(rod.dInt, 0) + "}{2} = " + fmtLatex(r.dm, 1) + "\\ \\text{mm}",
          texto: "dm = (" + fmtNum(rod.dExt, 0) + " + " + fmtNum(rod.dInt, 0) + ")/2 = " + fmtNum(r.dm, 1) + " mm"
        }
      ],
      nota: "Rodamiento " + rod.designacion + " (tabla del docente): de = " + rod.dExt + " mm, di = " + rod.dInt +
        " mm, D = " + rod.D + " mm, Z = " + rod.Z + " bolas, i = " + r.i + " hilera, α = " + RODAMIENTOS_DATA.alfaGrados + "°."
    });

    const lineasFc = [{
      latex: "f_c = \\dfrac{D \\cos \\alpha}{d_m} = \\dfrac{" + fmtLatex(rod.D) + " \\cdot \\cos " + RODAMIENTOS_DATA.alfaGrados + "°}{" + fmtLatex(r.dm, 1) + "} = " + latexR(r.ratio, cfg),
      texto: "D·cos α/dm = " + fmtNum(rod.D) + "·cos " + RODAMIENTOS_DATA.alfaGrados + "° / " + fmtNum(r.dm, 1) + " = " + fmtR(r.ratio, cfg)
    }];
    if (r.resFc.interpolado) {
      lineasFc.push(
        {
          latex: "\\text{interpolando:}\\quad y = \\left[\\dfrac{y_1 - y_0}{x_1 - x_0} \\cdot (x - x_1)\\right] + y_1",
          texto: "interpolando: y = [(y1−y0)/(x1−x0)·(x−x1)] + y1"
        },
        {
          latex: "f_c = \\left[\\dfrac{" + fmtLatex(r.resFc.y1, 0) + " - " + fmtLatex(r.resFc.y0, 0) + "}{" + fmtLatex(r.resFc.x1, 2) + " - " + fmtLatex(r.resFc.x0, 2) + "} \\cdot (" + latexR(r.ratio, cfg) + " - " + fmtLatex(r.resFc.x1, 2) + ")\\right] + " + fmtLatex(r.resFc.y1, 0) + " = \\mathbf{" + latexR(r.fc, cfg) + "}",
          texto: "fc = [(" + fmtNum(r.resFc.y1, 0) + "−" + fmtNum(r.resFc.y0, 0) + ")/(" + fmtNum(r.resFc.x1, 2) + "−" + fmtNum(r.resFc.x0, 2) + ")·(" + fmtR(r.ratio, cfg) + "−" + fmtNum(r.resFc.x1, 2) + ")] + " + fmtNum(r.resFc.y1, 0) + " = " + fmtR(r.fc, cfg)
        }
      );
    } else {
      lineasFc.push({
        latex: "\\Rightarrow \\text{por tabla} \\Rightarrow f_c = \\mathbf{" + fmtLatex(r.fc, 0) + "}",
        texto: "→ por tabla → fc = " + fmtNum(r.fc, 0)
      });
    }
    pasos.push({
      titulo: "Factor fc según D·cos α / dm",
      lineas: lineasFc,
      nota: r.resFc.interpolado
        ? "Tabla D·cos(α)/dm: se interpola entre las filas " + fmtNum(r.resFc.x0, 2) + " (fc = " + fmtNum(r.resFc.y0, 0) + ") y " + fmtNum(r.resFc.x1, 2) + " (fc = " + fmtNum(r.resFc.y1, 0) + ")."
        : "Tabla D·cos(α)/dm: fila " + fmtNum(r.resFc.fila.ratio, 2) + " → fc = " + fmtNum(r.fc, 0) + " (se toma la fila más próxima)."
    });

    pasos.push({
      titulo: "Capacidad de carga dinámica",
      lineas: [
        {
          latex: "C = 0{,}0856 \\cdot f_c \\cdot (i \\cos \\alpha)^{0{,}7} \\cdot Z^{2/3} \\cdot D^{1{,}8}",
          texto: "C = 0,0856 · fc · (i·cos α)^0,7 · Z^(2/3) · D^1,8"
        },
        {
          latex: "C = 0{,}0856 \\cdot " + fmtLatex(r.fc, 0) + " \\cdot (1 \\cdot \\cos 0)^{0{,}7} \\cdot " + fmtLatex(rod.Z, 0) + "^{2/3} \\cdot " + fmtLatex(r.Dcm, 3) + "^{1{,}8} = \\mathbf{" + latexR(r.C, cfg, true) + "}\\ \\text{kg}",
          texto: "C = 0,0856 · " + fmtNum(r.fc, 0) + " · 1 · " + fmtNum(rod.Z, 0) + "^(2/3) · " + fmtNum(r.Dcm, 3) + "^1,8 = " + fmtR(r.C, cfg, true) + " kg"
        }
      ],
      nota: "D se expresa en cm: " + rod.D + " mm = " + fmtNum(r.Dcm, 3) + " cm. Z^(2/3) = " + fmtNum(r.factorZ, 4) + " ; D^1,8 = " + fmtNum(r.factorD, 4) + "."
    });

    return pasos;
  }

  function renderSoloResultadosCarga() {
    const r = ultimoResultado, cfg = r.cfg;

    salida.innerHTML = "";
    const cont = document.createElement("div");
    cont.className = "ajuste-resultado";

    // Resultado destacado arriba de todo: es lo único que se pidió calcular.
    cont.appendChild(resumenHero(
      "C = " + fmtR(r.C, cfg, true) + " kg",
      "resumen-info",
      [["fc", fmtNum(r.fc, 0)], ["dm", fmtNum(r.dm, 1) + " mm"]]
    ));

    const cajaRod = caja("Rodamiento " + r.rod.designacion, "caja-generica");
    cajaRod.cuerpo.appendChild(filaDato("Diámetro medio (dm)", fmtNum(r.dm, 1) + " mm"));
    cajaRod.cuerpo.appendChild(filaDato("Razón D·cos α / dm (para leer fc en la tabla)", fmtR(r.ratio, cfg)));
    cajaRod.cuerpo.appendChild(filaDato("Factor de tabla (fc)", fmtNum(r.fc, 0)));
    cajaRod.cuerpo.appendChild(filaDato("Capacidad de carga dinámica (C)", fmtR(r.C, cfg, true) + " kg", null, true));
    cont.appendChild(cajaRod);

    salida.appendChild(cont);

    const div = document.createElement("div");
    div.className = "aviso aviso-placeholder";
    div.innerHTML = "Todos los cálculos se <strong>truncan</strong> a 3 decimales, incluidos los valores intermedios (razón, fc) — como se resuelve a mano.";
    salida.appendChild(div);
  }

  function renderPasoAPasoCarga() {
    renderPasos(salida, pasosCapacidadCarga(ultimoResultado));
    const r = ultimoResultado;
    const div = document.createElement("div");
    div.className = "aviso aviso-placeholder";
    div.innerHTML = "Todos los cálculos se <strong>truncan</strong> a 3 decimales, incluidos los valores intermedios (razón, fc) — como se resuelve a mano.";
    salida.appendChild(div);
  }

  function renderSoloResultadosRod() {
    const r = ultimoResultado, cfg = r.cfg;

    salida.innerHTML = "";
    const cont = document.createElement("div");
    cont.className = "ajuste-resultado";

    // Resultado destacado arriba de todo: es lo que en definitiva se
    // pide en el enunciado (vida media probable, en horas/días/meses).
    cont.appendChild(resumenHero(
      "Vida media probable: " + fmtR(r.LM, cfg, true) + " hs",
      "resumen-info",
      [["LM", fmtR(r.LMdias, cfg, true) + " días"], ["LM", fmtR(r.LMmeses, cfg) + " meses"]]
    ));

    const cajaRod = caja("Rodamiento " + r.rod.designacion, "caja-generica");
    cajaRod.cuerpo.appendChild(filaDato("Anillo rotante (V₁)", (r.anillo === "interior" ? "interior" : "exterior") + " (" + fmtNum(r.V1, 1) + ")"));
    cajaRod.cuerpo.appendChild(filaDato("Diámetro medio (dm)", fmtNum(r.dm, 1) + " mm"));
    cajaRod.cuerpo.appendChild(filaDato("Razón D·cos α / dm (para leer fc en la tabla)", fmtR(r.ratio, cfg)));
    cajaRod.cuerpo.appendChild(filaDato("Factor de tabla (fc)", fmtNum(r.fc, 0)));
    cajaRod.cuerpo.appendChild(filaDato("Capacidad de carga dinámica (C)", fmtR(r.C, cfg, true) + " kg", null, true));
    cont.appendChild(cajaRod);

    const cajaCarga = caja(r.unaEtapa ? "Carga" : "Ciclo de trabajo", "caja-acento");
    if (r.unaEtapa) {
      const et = r.etapas[0];
      cajaCarga.cuerpo.appendChild(filaDato("Factor axial (Y)", fmtR(et.Y, cfg)));
      cajaCarga.cuerpo.appendChild(filaDato("Carga equivalente (P)", fmtR(et.P, cfg, true) + " kg", null, true));
    } else {
      const th = "<tr><th>Etapa</th><th>% tiempo</th><th>Y</th><th>P (kg)</th><th>N (rev)</th></tr>";
      let tb = "";
      r.etapas.forEach(function (et) {
        tb += "<tr><td><strong>" + et.idx + "</strong></td><td>" + fmtR(et.porcent * 100, cfg) + "%</td><td>" +
          fmtR(et.Y, cfg) + "</td><td class=\"valor\">" + fmtR(et.P, cfg, true) + "</td><td class=\"valor\">" + fmtR(et.Ni, cfg, true) + "</td></tr>";
      });
      const wrap = document.createElement("div");
      wrap.className = "tabla-scroll";
      wrap.innerHTML = "<table class=\"tabla-resultados\"><thead>" + th + "</thead><tbody>" + tb + "</tbody></table>";
      cajaCarga.cuerpo.appendChild(wrap);
      cajaCarga.cuerpo.appendChild(filaDato("Velocidad media del ciclo (n')", fmtR(r.nPrima, cfg, true) + " rpm"));
      cajaCarga.cuerpo.appendChild(filaDato("Revoluciones combinadas (N)", fmtR(r.N, cfg, true) + " rev"));
    }
    cont.appendChild(cajaCarga);

    const cajaVida = caja("Vida útil", "caja-generica");
    cajaVida.cuerpo.appendChild(filaDato("Vida probable (L)", fmtR(r.Lhoras, cfg, true) + " hs", null, true));
    cajaVida.cuerpo.appendChild(filaDato("Vida probable (L)", fmtR(r.Ldias, cfg, true) + " días"));
    cajaVida.cuerpo.appendChild(filaDato("Vida probable (L)", fmtR(r.Lmeses, cfg) + " meses de 30 días"));
    cajaVida.cuerpo.appendChild(filaDato("Vida media probable (LM)", fmtR(r.LM, cfg, true) + " hs", null, true));
    cajaVida.cuerpo.appendChild(filaDato("Vida media probable (LM)", fmtR(r.LMdias, cfg, true) + " días"));
    cajaVida.cuerpo.appendChild(filaDato("Vida media probable (LM)", fmtR(r.LMmeses, cfg) + " meses de 30 días"));
    cont.appendChild(cajaVida);

    salida.appendChild(cont);
    agregarPie(r);
  }

  function renderPasoAPasoRod() {
    const r = ultimoResultado, cfg = r.cfg;
    const pasos = [];
    const rod = r.rod;

    /* Paso: tabla del ciclo (solo si hay varias etapas) */
    if (!r.unaEtapa) {
      let th = "<tr><th></th><th>Fr</th><th>Fa</th><th>Tiempo</th><th>Porcent.</th><th>RPM</th><th>N'</th><th>C₁</th></tr>";
      let tb = "";
      r.etapas.forEach(function (et) {
        tb += "<tr><td><strong>P" + et.idx + "</strong></td>" +
          "<td>" + fmtNum(et.fr) + "</td>" +
          "<td>" + fmtNum(et.fa) + "</td>" +
          "<td>" + fmtNum(et.tiempo) + (r.unidad === "segundos" ? " s" : " %") + "</td>" +
          "<td>" + fmtR(et.porcent, cfg) + "</td>" +
          "<td>" + fmtNum(et.n, 0) + "</td>" +
          "<td>" + fmtR(et.Nprima, cfg) + "</td>" +
          "<td>" + fmtNum(et.C1, 1) + "</td></tr>";
      });
      tb += '<tr><td colspan="6"></td><td><strong>n\' = ' + fmtR(r.nPrima, cfg) + "</strong></td><td></td></tr>";
      pasos.push({
        titulo: "Tabla del ciclo de trabajo",
        lineas: [],
        html: '<div class="tabla-scroll"><table class="tabla-resultados"><thead>' + th +
          "</thead><tbody>" + tb + "</tbody></table></div>",
        nota: "t = tiempo de la etapa / total del ciclo (" + fmtNum(r.sumaTiempo) +
          (r.unidad === "segundos" ? " s" : "%") + "). N' = t × rpm ; n' = Σ N'."
      });
    }

    /* Pasos 1 a 3: dm, fc, C (compartidos con el modo "solo carga básica") */
    pasosCapacidadCarga(r).forEach(function (p) { pasos.push(p); });

    /* Pasos por etapa: carga equivalente P */
    r.etapas.forEach(function (et) {
      const nom = r.unaEtapa ? "P" : "P" + et.idx;
      const lineas = [];

      // Trabajo inclinado: F se descompone en Fr = F·cos θ y Fa = F·sen θ
      const inclinada = et.angulo !== null && et.angulo > 0;
      if (inclinada) {
        lineas.push({
          latex: "F = " + fmtLatex(et.F) + "\\ \\text{kg aplicada a } " + fmtLatex(et.angulo) + "°:\\quad F_r = F \\cos " + fmtLatex(et.angulo) + "° \\ ;\\quad F_a = F \\operatorname{sen} " + fmtLatex(et.angulo) + "°",
          texto: "F = " + fmtNum(et.F) + " kg aplicada a " + fmtNum(et.angulo) + "°: Fr = F·cos θ ; Fa = F·sen θ"
        });
      } else if (et.vertical) {
        lineas.push({
          latex: "\\text{Trabajo vertical:}\\quad F_r \\leftrightarrow F_a \\quad\\Rightarrow\\quad F_r = " + fmtLatex(et.fa) + "\\ ;\\ F_a = " + fmtLatex(et.fr),
          texto: "Trabajo vertical: se intercambian Fr y Fa → Fr = " + fmtNum(et.fa) + " ; Fa = " + fmtNum(et.fr)
        });
      }

      lineas.push({
        latex: "\\dfrac{F_a}{i \\cdot Z \\cdot D^2} = \\dfrac{" + (inclinada ? fmtLatex(et.F) + " \\operatorname{sen} " + fmtLatex(et.angulo) + "°" : fmtLatex(et.faEf)) + "}{" + fmtLatex(r.i, 0) + " \\cdot " + fmtLatex(rod.Z, 0) + " \\cdot (" + fmtLatex(r.Dcm, 3) + ")^2} = " + latexR(et.razon, cfg),
        texto: "Fa/(i·Z·D²) = " + (inclinada ? fmtNum(et.F) + "·sen " + fmtNum(et.angulo) + "°" : fmtNum(et.faEf)) + " / (" + r.i + "·" + rod.Z + "·" + fmtNum(r.Dcm, 3) + "²) = " + fmtR(et.razon, cfg)
      });

      // Interpolación de Y
      const ip = et.interp;
      if (ip.sinAxial) {
        lineas.push({ latex: "F_a = 0 \\Rightarrow Y \\cdot F_a = 0", texto: "Fa = 0 → el término axial se anula" });
      } else if (ip.exacta) {
        lineas.push({
          latex: "\\text{por tabla} \\Rightarrow Y = \\mathbf{" + fmtLatex(ip.exacta.y) + "}",
          texto: "por tabla → Y = " + fmtNum(ip.exacta.y)
        });
      } else if (ip.fuera) {
        lineas.push({
          latex: "\\text{fuera de tabla} \\Rightarrow Y = \\mathbf{" + fmtLatex(ip.y) + "}",
          texto: "fuera de tabla → Y = " + fmtNum(ip.y)
        });
      } else {
        lineas.push(
          {
            latex: "\\text{por tabla } " + latexR(et.razon, cfg) + " \\rightarrow \\text{Interpolación:}\\quad y = \\left[\\dfrac{y_1 - y_0}{x_1 - x_0} \\cdot (x - x_1)\\right] + y_1",
            texto: "por tabla " + fmtR(et.razon, cfg) + " → Interpolación: y = [(y1−y0)/(x1−x0)·(x−x1)] + y1"
          },
          {
            latex: "y = \\left[\\dfrac{" + fmtLatex(ip.y1) + " - " + fmtLatex(ip.y0) + "}{" + fmtLatex(ip.x1) + " - " + fmtLatex(ip.x0) + "} \\cdot (" + latexR(et.razon, cfg) + " - " + fmtLatex(ip.x1) + ")\\right] + " + fmtLatex(ip.y1) + " = \\mathbf{" + latexR(et.Y, cfg) + "}",
            texto: "y = [(" + fmtNum(ip.y1) + "−" + fmtNum(ip.y0) + ")/(" + fmtNum(ip.x1) + "−" + fmtNum(ip.x0) + ")·(" + fmtR(et.razon, cfg) + "−" + fmtNum(ip.x1) + ")] + " + fmtNum(ip.y1) + " = " + fmtR(et.Y, cfg)
          }
        );
      }

      const frTxt = inclinada ? fmtLatex(et.F) + " \\cos " + fmtLatex(et.angulo) + "°" : fmtLatex(et.frEf);
      const faTxt = inclinada ? fmtLatex(et.F) + " \\operatorname{sen} " + fmtLatex(et.angulo) + "°" : fmtLatex(et.faEf);
      lineas.push(
        { latex: "P = C_1 (X \\cdot V_1 \\cdot F_r + Y \\cdot F_a)", texto: "P = C₁·(X·V₁·Fr + Y·Fa)" },
        {
          latex: nom + " = " + fmtLatex(et.C1, 1) + " (" + fmtLatex(et.X) + " \\cdot " + fmtLatex(r.V1, 1) + " \\cdot " + frTxt + " + " + latexR(et.Y, cfg) + " \\cdot " + faTxt + ") = \\mathbf{" + latexR(et.P, cfg, true) + "}\\ \\text{kg}",
          texto: nom + " = " + fmtNum(et.C1, 1) + "(" + fmtNum(et.X) + "·" + fmtNum(r.V1, 1) + "·" + fmtR(et.frEf, cfg) + " + " + fmtR(et.Y, cfg) + "·" + fmtR(et.faEf, cfg) + ") = " + fmtR(et.P, cfg, true) + " kg"
        }
      );

      pasos.push({
        titulo: "Carga equivalente " + nom + (r.unaEtapa ? "" : " (etapa " + et.idx + ")"),
        lineas: lineas,
        nota: "X = " + fmtNum(et.X) + " (tabla) ; V₁ = " + fmtNum(r.V1, 1) + " (giro de anillo " + r.anillo +
          ") ; C₁ = " + fmtNum(et.C1, 1) + " (" + et.tipoCarga.nombre.toLowerCase() + ")."
      });
    });

    if (r.unaEtapa) {
      /* Carga única: L directo (ejercicio 1 del parcial) */
      const et = r.etapas[0];
      pasos.push({
        titulo: "Vida probable en horas",
        lineas: [
          { latex: "L = \\dfrac{10^6 \\cdot C^3}{60 \\cdot n \\cdot P^3}", texto: "L = 10⁶·C³ / (60·n·P³)" },
          {
            latex: "L = \\dfrac{10^6 \\cdot (" + latexR(r.C, cfg, true) + ")^3}{60 \\cdot " + fmtLatex(et.n, 0) + " \\cdot (" + latexR(et.P, cfg, true) + ")^3} = \\mathbf{" + latexR(r.Lhoras, cfg, true) + "}\\ \\text{horas}",
            texto: "L = 10⁶·(" + fmtR(r.C, cfg, true) + ")³ / (60·" + fmtNum(et.n, 0) + "·(" + fmtR(et.P, cfg, true) + ")³) = " + fmtR(r.Lhoras, cfg, true) + " horas"
          }
        ]
      });
    } else {
      /* Ciclo: αi, Ni, combinación */
      const lineasAlfa = [
        { latex: "\\alpha_i = \\dfrac{N'_i}{n'}", texto: "αᵢ = N'ᵢ / n'" }
      ];
      r.etapas.forEach(function (et) {
        lineasAlfa.push({
          latex: "\\alpha_" + et.idx + " = \\dfrac{" + latexR(et.Nprima, cfg) + "}{" + latexR(r.nPrima, cfg) + "} = " + latexR(et.alfa, cfg),
          texto: "α" + et.idx + " = " + fmtR(et.Nprima, cfg) + " / " + fmtR(r.nPrima, cfg) + " = " + fmtR(et.alfa, cfg)
        });
      });
      pasos.push({ titulo: "Coeficientes del ciclo", lineas: lineasAlfa });

      const lineasN = [
        { latex: "N_n = \\dfrac{10^6 \\cdot C^3}{P_n^3}", texto: "Nₙ = 10⁶·C³ / Pₙ³" }
      ];
      r.etapas.forEach(function (et) {
        lineasN.push({
          latex: "N_" + et.idx + " = \\dfrac{10^6 (" + latexR(r.C, cfg, true) + ")^3}{(" + latexR(et.P, cfg, true) + ")^3} = " + latexR(et.Ni, cfg, true),
          texto: "N" + et.idx + " = 10⁶·(" + fmtR(r.C, cfg, true) + ")³/(" + fmtR(et.P, cfg, true) + ")³ = " + fmtR(et.Ni, cfg, true)
        });
      });
      pasos.push({ titulo: "Revoluciones por etapa", lineas: lineasN });

      let sumaLatex = "", sumaTexto = "";
      r.etapas.forEach(function (et, k) {
        const sep = k === 0 ? "" : " + ";
        sumaLatex += sep + "\\dfrac{" + latexR(et.alfa, cfg) + "}{" + latexR(et.Ni, cfg, true) + "}";
        sumaTexto += sep + fmtR(et.alfa, cfg) + "/" + fmtR(et.Ni, cfg, true);
      });
      pasos.push({
        titulo: "Combinación del ciclo",
        lineas: [
          { latex: "\\dfrac{1}{N} = \\dfrac{\\alpha_1}{N_1} + \\dfrac{\\alpha_2}{N_2} + \\dfrac{\\alpha_3}{N_3} \\cdots", texto: "1/N = α₁/N₁ + α₂/N₂ + α₃/N₃ …" },
          { latex: "\\dfrac{1}{N} = " + sumaLatex + " = " + r.invN.toExponential(3).replace("e-", " \\cdot 10^{-").replace(/$/, "}"), texto: "1/N = " + sumaTexto + " = " + r.invN.toExponential(3) },
          { latex: "N = \\dfrac{1}{" + r.invN.toExponential(3).replace("e-", " \\cdot 10^{-").replace(/$/, "}") + "} = \\mathbf{" + latexR(r.N, cfg, true) + "}\\ \\text{rev}", texto: "N = " + fmtR(r.N, cfg, true) + " revoluciones" }
        ]
      });

      pasos.push({
        titulo: "Vida probable en horas",
        lineas: [
          { latex: "L = \\dfrac{N}{60 \\cdot n'}", texto: "L = N / (60·n')" },
          {
            latex: "L = \\dfrac{" + latexR(r.N, cfg, true) + "}{60 \\cdot " + latexR(r.nPrima, cfg) + "} = \\mathbf{" + latexR(r.Lhoras, cfg, true) + "}\\ \\text{horas}",
            texto: "L = " + fmtR(r.N, cfg, true) + " / (60·" + fmtR(r.nPrima, cfg) + ") = " + fmtR(r.Lhoras, cfg, true) + " horas"
          }
        ]
      });
    }

    /* Días y meses */
    pasos.push({
      titulo: "Vida probable en días y meses",
      lineas: [
        {
          latex: "L = " + latexR(r.Lhoras, cfg, true) + "\\ \\text{horas} \\cdot \\dfrac{1\\ \\text{día}}{" + fmtLatex(r.horasDia) + "\\ \\text{horas}} = \\mathbf{" + latexR(r.Ldias, cfg, true) + "}\\ \\text{días}",
          texto: "L = " + fmtR(r.Lhoras, cfg, true) + " horas · (1 día / " + fmtNum(r.horasDia) + " horas) = " + fmtR(r.Ldias, cfg, true) + " días"
        },
        {
          latex: "L = \\dfrac{" + latexR(r.Ldias, cfg, true) + "}{30} = " + latexR(r.Lmeses, cfg) + "\\ \\text{meses de 30 días}",
          texto: "L = " + fmtR(r.Ldias, cfg, true) + " / 30 = " + fmtR(r.Lmeses, cfg) + " meses de 30 días"
        }
      ]
    });

    /* Vida media probable */
    pasos.push({
      titulo: "Vida media probable",
      lineas: [
        { latex: "L_M = L \\cdot " + RODAMIENTOS_DATA.factorVidaMedia, texto: "LM = L · " + RODAMIENTOS_DATA.factorVidaMedia },
        {
          latex: "L_M = " + latexR(r.Lhoras, cfg, true) + " \\cdot " + RODAMIENTOS_DATA.factorVidaMedia + " = \\mathbf{" + latexR(r.LM, cfg, true) + "}\\ \\text{horas}",
          texto: "LM = " + fmtR(r.Lhoras, cfg, true) + " · " + RODAMIENTOS_DATA.factorVidaMedia + " = " + fmtR(r.LM, cfg, true) + " horas"
        },
        {
          latex: "L_M = " + latexR(r.LM, cfg, true) + "\\ \\text{horas} \\cdot \\dfrac{1\\ \\text{día}}{" + fmtLatex(r.horasDia) + "\\ \\text{horas}} = \\mathbf{" + latexR(r.LMdias, cfg, true) + "}\\ \\text{días} = " + latexR(r.LMmeses, cfg) + "\\ \\text{meses}",
          texto: "LM = " + fmtR(r.LMdias, cfg, true) + " días = " + fmtR(r.LMmeses, cfg) + " meses de 30 días"
        }
      ]
    });

    renderPasos(salida, pasos);
    agregarPie(r);
  }

  function agregarPie(r) {
    r.avisos.forEach(function (m) {
      const div = document.createElement("div");
      div.className = "error-msg";
      div.textContent = m;
      salida.appendChild(div);
    });

    const ignoradas = r.etapas.filter(function (e) { return e.faIgnorada; });
    if (ignoradas.length) {
      const div = document.createElement("div");
      div.className = "aviso aviso-placeholder";
      div.innerHTML = "En " + (ignoradas.length === 1 ? "la etapa " : "las etapas ") +
        ignoradas.map(function (e) { return e.idx; }).join(", ") +
        " se cargó un ángulo, así que <strong>Fa se obtiene de F·sen θ</strong> y el valor escrito en el campo Fa no se usa.";
      salida.appendChild(div);
    }

    const verticales = r.etapas.filter(function (e) { return e.vertical; });
    if (verticales.length) {
      const div = document.createElement("div");
      div.className = "aviso aviso-placeholder";
      div.innerHTML = "En " + (verticales.length === 1 ? "la etapa " : "las etapas ") +
        verticales.map(function (e) { return e.idx; }).join(", ") +
        " el trabajo es <strong>vertical</strong>, así que se intercambiaron los valores cargados de Fr y Fa antes de calcular.";
      salida.appendChild(div);
    }

    const div = document.createElement("div");
    div.className = "aviso aviso-placeholder";
    div.innerHTML = "Todos los cálculos se <strong>truncan</strong> a 3 decimales, incluidos los valores intermedios (Y, α, razones) — como se resuelve a mano.";
    salida.appendChild(div);
  }

  // Estado inicial
  mostrarDatosRod();
  agregarCiclo();
  actualizarModoCalculo();
  renderVacio(salida, "Elegí el rodamiento y presiona «Calcular».", "rodamientos");
})();
