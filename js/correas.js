/* ============================================================
   MÓDULO 2 — Correas
   Procedimiento del docente (transmisión):
     1) n₁·d₁ = n₂·d₂  → despejar la incógnita
     2) i = n_accionado / n_motor = d_motor / d_accionado
     3) E = 5·d_motor
     4) L abierto  = 2E + (π/2)(D+d) + (D−d)²/(4E)
     5) L cruzado  = 2E + (π/2)(D+d) + (D+d)²/(4E)
   Cantidad y tipo de correa (procedimiento del catálogo Dunlop,
   verificado exacto contra el ejemplo de cálculo de la pág. 26):
     6) Pc = P · Fcp                       (Tabla 3)
     7) Sección según Gráfico Nº 1
     8) K = D mayor / D menor ; verificación de distancia entre ejes
     9) Correa Nº: la app busca en la Tabla 6 la longitud más próxima
        a L (lazo abierto) para la sección elegida → Fcl (Tabla 4).
    10) α = 180 − 57·(D mayor − D menor)/E → Fc  (Tabla 5)
    11) Vt = π·d·N/60000  (máx. 30 m/s)
    12) Pbk = Pb + adicional. Pb y el adicional se buscan solos en la
        Tabla 2 (fila = rpm de la polea menor, columna = diámetro de
        la polea menor, banda = K) para las secciones Z, A, B y C.
        Las secciones D y E todavía no están transcriptas (son mucho
        más grandes) — para esas dos la app pide Pb y adicional a mano.
    13) Pe = Pbk · Fcl · Fc ; Cantidad = Pc/Pe → entero superior
   No se pide "Nº de correa", "polea tensora", "prestación base" ni
   "adicional por relación": la app los deriva sola. Si se quiere
   forzar un Nº de correa distinto del automático, no hay campo para
   eso por ahora (a pedido del usuario, que prefirió sacar esos campos
   de la interfaz).
   ============================================================ */

(function () {
  let ultimoResultado = null;

  const form = document.getElementById("form-correas");
  const salida = document.getElementById("salida-correas");
  const switchModo = document.getElementById("switch-correas");

  const inputs = {
    n1: document.getElementById("co-n1"),
    n2: document.getElementById("co-n2"),
    d: document.getElementById("co-d"),
    D: document.getElementById("co-D"),
    potencia: document.getElementById("co-potencia")
  };
  const inputE = document.getElementById("co-E");

  const selGrupo = document.getElementById("co-grupo");
  const selMotor = document.getElementById("co-motor");
  const selServicio = document.getElementById("co-servicio");
  const selPoleas = document.getElementById("co-poleas");
  const selSeccion = document.getElementById("co-seccion");
  const btnGrafico = document.getElementById("co-ver-grafico");
  const contGrafico = document.getElementById("co-grafico-cont");

  const ETIQUETAS = {
    n1: "n₁ (velocidad del motor)",
    n2: "n₂ (velocidad del accionado)",
    d: "d (diámetro de la polea motora)",
    D: "D (diámetro de la polea accionada)"
  };
  const UNIDADES = { n1: "rpm", n2: "rpm", d: "mm", D: "mm" };
  const SIMBOLOS = { n1: "n₁", n2: "n₂", d: "d", D: "D" };

  /* ---------- Poblar selectores desde CORREAS_DATA ---------- */
  CORREAS_DATA.fcp.forEach(function (g) {
    const o = document.createElement("option");
    o.value = g.clave;
    o.textContent = g.nombre;
    selGrupo.appendChild(o);
  });

  btnGrafico.addEventListener("click", function () {
    contGrafico.hidden = !contGrafico.hidden;
  });

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    calcular();
  });

  switchModo.addEventListener("change", function () {
    if (ultimoResultado) render();
  });

  /** Busca en la Tabla 6 el Nº de correa cuya longitud primitiva
   * nominal es más próxima a L, para la sección dada (Nº 15 a 180
   * transcriptos). Devuelve {n, longitud} o null si la sección no
   * tiene datos en ese rango. */
  function buscarCorreaNPorTabla6(seccion, L) {
    if (!seccion) return null;
    const idx = { Z: 1, A: 2, B: 3, C: 4, D: 5, E: 6 }[seccion];
    let mejor = null;
    CORREAS_DATA.tabla6.forEach(function (fila) {
      const longitud = fila[idx];
      if (longitud === null) return;
      if (mejor === null || Math.abs(longitud - L) < Math.abs(mejor.longitud - L)) {
        mejor = { n: fila[0], longitud: longitud };
      }
    });
    return mejor;
  }

  /** Busca Pb y el adicional por relación de transmisión en la
   * Tabla 2, para las secciones ya transcriptas (Z, A, B, C). Fila =
   * rpm del MOTOR más próxima (siempre el motor, sea o no la polea
   * menor — verificado con un ejercicio real del docente: motor
   * 1500rpm/300mm → Pb=16,4, no coincide con la polea menor); columna
   * de Pb = diámetro de la polea MOTORA más próximo (ignorando
   * guiones); banda de adicional = la primera cuyo límite superior es
   * ≥ K. Devuelve null si la sección todavía no está transcripta. */
  function buscarTabla2(seccion, rpmMotor, diamMotor, K) {
    const tabla = CORREAS_DATA.tabla2[seccion];
    if (!tabla) return null;

    let fila = null;
    tabla.filas.forEach(function (f) {
      if (fila === null || Math.abs(f.n - rpmMotor) < Math.abs(fila.n - rpmMotor)) fila = f;
    });

    let idxDiam = null, mejorDiff = Infinity;
    tabla.diam.forEach(function (dCol, i) {
      if (fila.pb[i] === null) return;
      const diff = Math.abs(dCol - diamMotor);
      if (diff < mejorDiff) { mejorDiff = diff; idxDiam = i; }
    });
    const pb = idxDiam !== null ? fila.pb[idxDiam] : null;
    const diamUsado = idxDiam !== null ? tabla.diam[idxDiam] : null;

    let idxBanda = CORREAS_DATA.tabla2.bandas.findIndex(function (max) { return K <= max; });
    if (idxBanda === -1) idxBanda = CORREAS_DATA.tabla2.bandas.length - 1;
    const adicional = fila.ad[idxBanda];

    return { pb: pb, adicional: adicional, filaN: fila.n, diamUsado: diamUsado, idxBanda: idxBanda };
  }

  /* ---------- Cálculo ---------- */
  function calcular() {
    const errores = [];
    const datos = {};
    const faltantes = [];

    ["n1", "n2", "d", "D"].forEach(function (clave) {
      const lect = leerNumero(inputs[clave]);
      marcarInvalido(inputs[clave], false);
      if (lect.vacio) {
        faltantes.push(clave);
        datos[clave] = null;
      } else if (lect.invalido || lect.valor <= 0) {
        errores.push(ETIQUETAS[clave] + ": debe ser un número positivo.");
        marcarInvalido(inputs[clave], true);
      } else {
        datos[clave] = lect.valor;
      }
    });

    if (errores.length) { renderError(salida, errores); ultimoResultado = null; return; }

    if (faltantes.length > 1) {
      renderError(salida, "Faltan datos: deja vacía UNA sola incógnita. Ahora faltan: " +
        faltantes.map(function (c) { return ETIQUETAS[c]; }).join(", ") + ".");
      ultimoResultado = null;
      return;
    }

    const incognita = faltantes.length === 1 ? faltantes[0] : null;

    // 1) Despeje con n₁·d₁ = n₂·d₂
    if (incognita === "n1") datos.n1 = (datos.n2 * datos.D) / datos.d;
    if (incognita === "n2") datos.n2 = (datos.n1 * datos.d) / datos.D;
    if (incognita === "d") datos.d = (datos.n2 * datos.D) / datos.n1;
    if (incognita === "D") datos.D = (datos.n1 * datos.d) / datos.n2;

    // 2) Relación de transmisión
    const i = datos.n2 / datos.n1;
    // i < 1: el accionado gira más lento que el motor (transmisión de
    // reducción). i > 1: gira más rápido (transmisión de aumento).
    const tipoTransmision = i < 1 ? "Reducción" : (i > 1 ? "Aumento" : "Directa (1:1)");

    // 3) Distancia entre ejes: si se cargó E a mano se usa tal cual (caso
    // típico de un ejercicio que ya la da); si no, se adopta E = 5·d_motor.
    const lectE = leerNumero(inputE);
    marcarInvalido(inputE, false);
    let E, Edada = false;
    if (!lectE.vacio) {
      if (lectE.invalido || lectE.valor <= 0) {
        renderError(salida, "La distancia entre ejes (E) debe ser un número positivo.");
        marcarInvalido(inputE, true);
        ultimoResultado = null;
        return;
      }
      E = lectE.valor;
      Edada = true;
    } else {
      E = 5 * datos.d;
    }

    // 4) y 5) Longitudes de correa
    const sumaD = datos.D + datos.d;
    const restaD = datos.D - datos.d;
    const Labierto = 2 * E + (Math.PI / 2) * sumaD + (restaD * restaD) / (4 * E);
    const Lcruzado = 2 * E + (Math.PI / 2) * sumaD + (sumaD * sumaD) / (4 * E);

    ultimoResultado = {
      datos: datos, incognita: incognita, i: i, tipoTransmision: tipoTransmision, E: E, Edada: Edada,
      Labierto: Labierto, Lcruzado: Lcruzado, cantidad: null
    };

    // ---- Selección de correa (si hay potencia) ----
    const lectPot = leerNumero(inputs.potencia);
    marcarInvalido(inputs.potencia, false);
    if (!lectPot.vacio) {
      if (lectPot.invalido || lectPot.valor <= 0) {
        renderError(salida, "La potencia debe ser un número positivo.");
        marcarInvalido(inputs.potencia, true);
        ultimoResultado = null;
        return;
      }
      const c = calcularSeleccion(lectPot.valor, datos, E, Labierto);
      if (c.error) { renderError(salida, c.error); ultimoResultado = null; return; }
      ultimoResultado.cantidad = c;
    }

    render();
  }

  function calcularSeleccion(P, datos, E, Labierto) {
    const grupo = CORREAS_DATA.fcp.find(function (g) { return g.clave === selGrupo.value; });
    const motor = selMotor.value;
    const servicio = selServicio.value;

    // 6) Potencia corregida
    const fcp = grupo[motor][servicio];
    const Pc = P * fcp;

    // 7) Sección
    const seccion = selSeccion.value || null;

    // La polea menor no siempre es la del motor (ej.: un motor más lento
    // que gira una bomba más rápida tiene la polea del motor más grande).
    // K, el mínimo de distancia entre ejes y el Gráfico Nº 1 se basan
    // siempre en la polea MENOR, sea motora o accionada — pero la Tabla 2
    // (prestación base) es distinta: esa siempre usa el rpm y diámetro del
    // MOTOR tal cual, aunque no sea la polea menor (verificado con un
    // ejercicio real del docente).
    const poleaMenorEsMotor = datos.d <= datos.D;
    const poleaMenorD = poleaMenorEsMotor ? datos.d : datos.D;
    const poleaMenorN = poleaMenorEsMotor ? datos.n1 : datos.n2;
    const poleaMayorD = poleaMenorEsMotor ? datos.D : datos.d;

    // 8) Relación K y verificación de distancia entre ejes
    const K = poleaMayorD / poleaMenorD;
    let lMin = null, verificaDistancia = null;
    if (K >= 3) {
      lMin = poleaMayorD;
    } else {
      lMin = ((K + 1) * poleaMenorD) / 2 + poleaMenorD;
    }
    verificaDistancia = E >= lMin;

    // 9) Arco de contacto y Fc (Tabla 5) — el arco es siempre ≤180°,
    // así que se usa (mayor − menor), sin importar cuál es cada polea.
    const alfa = 180 - (57 * (poleaMayorD - poleaMenorD)) / E;
    let filaFc = null;
    CORREAS_DATA.fc.forEach(function (fila) {
      if (filaFc === null || Math.abs(fila.grados - alfa) < Math.abs(filaFc.grados - alfa)) filaFc = fila;
    });
    const fc = filaFc ? filaFc[selPoleas.value] : null;

    // 9) Correa Nº (Tabla 6) → Fcl (Tabla 4)
    let correaN = null, correaNLejos = false, filaFcl = null, fcl = null;
    if (seccion) {
      const auto = buscarCorreaNPorTabla6(seccion, Labierto);
      if (auto) {
        correaN = auto.n;
        correaNLejos = Math.abs(auto.longitud - Labierto) / Labierto > 0.15;
        // Se toma la fila con Nº más cercano a correaN, entre las que
        // tienen valor para esta sección (verificado contra el ejemplo
        // del propio catálogo: correa B59 → Fcl=0,92 viene de la fila
        // Nº60, que es la más CERCANA a 59, no la anterior — Nº55
        // también tiene valor pero está más lejos).
        let mejor = null;
        CORREAS_DATA.fcl.forEach(function (fila) {
          if (fila[seccion] === null || fila[seccion] === undefined) return;
          if (mejor === null || Math.abs(fila.n - correaN) < Math.abs(mejor.n - correaN)) mejor = fila;
        });
        if (mejor) { filaFcl = mejor; fcl = mejor[seccion]; }
      }
    }

    // 10) Velocidad tangencial (da igual con cuál polea se calcule: por
    // definición π·d·n es igual en ambas — se usa la menor por prolijidad)
    const vt = (Math.PI * poleaMenorD * poleaMenorN) / 60000;

    // 12) Pb + adicional (Tabla 2) → Pbk. Solo Z, A, B, C transcriptas.
    let tabla2Res = null, pb = null, adicional = null, pbk = null;
    const tabla2Disponible = seccion ? !!CORREAS_DATA.tabla2[seccion] : false;
    if (seccion && tabla2Disponible) {
      tabla2Res = buscarTabla2(seccion, datos.n1, datos.d, K);
      pb = tabla2Res.pb;
      adicional = tabla2Res.adicional;
      if (pb !== null) pbk = pb + (adicional !== null ? adicional : 0);
    }

    // 13) Potencia efectiva y cantidad
    let pe = null, cantidadExacta = null, cantidad = null;
    if (pbk !== null && fcl !== null && fc !== null) {
      pe = pbk * fcl * fc;
      cantidadExacta = Pc / pe;
      cantidad = Math.ceil(cantidadExacta - 1e-9);
    }

    return {
      P: P, grupo: grupo, motor: motor, servicio: servicio, fcp: fcp, Pc: Pc,
      motorN: datos.n1, motorD: datos.d,
      poleaMenorD: poleaMenorD, poleaMenorN: poleaMenorN, poleaMenorEsMotor: poleaMenorEsMotor, poleaMayorD: poleaMayorD,
      seccion: seccion, K: K, lMin: lMin, verificaDistancia: verificaDistancia,
      correaN: correaN, correaNLejos: correaNLejos, filaFcl: filaFcl, fcl: fcl,
      alfa: alfa, filaFc: filaFc, fc: fc, poleas: selPoleas.value, vt: vt,
      tabla2Disponible: tabla2Disponible, tabla2Res: tabla2Res,
      pb: pb, adicional: adicional, pbk: pbk,
      pe: pe, cantidadExacta: cantidadExacta, cantidad: cantidad
    };
  }

  /* ---------- Render ---------- */
  function render() {
    if (switchModo.checked) renderPasoAPaso();
    else renderSoloResultados();
  }

  function nombreServicio(s) {
    return { intermedio: "intermedio (≤7 hs)", normal: "normal (8-15 hs)", continuo: "continuo (>16 hs)" }[s];
  }

  /* ---------- Modo: solo resultados ---------- */
  function renderSoloResultados() {
    const r = ultimoResultado;
    const d = r.datos;
    const c = r.cantidad;

    salida.innerHTML = "";
    const cont = document.createElement("div");
    cont.className = "ajuste-resultado";

    // Resultado destacado arriba de todo: la respuesta que más
    // probablemente se busca, según lo que se pudo calcular.
    if (c && c.cantidad !== null) {
      cont.appendChild(resumenHero(
        c.cantidad + " correa" + (c.cantidad === 1 ? "" : "s") + " " + (c.seccion || "") + " Nº " + fmtNum(c.correaN, 0),
        "resumen-info",
        [["Pc", fmtNum(c.Pc) + " HP"], ["Pe", fmtNum(c.pe) + " HP"]]
      ));
    } else if (r.incognita) {
      cont.appendChild(resumenHero(
        SIMBOLOS[r.incognita] + " = " + fmtNum(d[r.incognita]) + " " + UNIDADES[r.incognita],
        "resumen-info",
        [["i", fmtNum(r.i)], ["L abierto", fmtNum(r.Labierto) + " mm"]]
      ));
    } else {
      cont.appendChild(resumenHero(
        "L (lazo abierto) = " + fmtNum(r.Labierto) + " mm",
        "resumen-info",
        [["i", fmtNum(r.i)], ["E", fmtNum(r.E) + " mm"]]
      ));
    }

    const cajaTrans = caja("Transmisión", "caja-generica");
    if (r.incognita) {
      cajaTrans.cuerpo.appendChild(filaDato(
        SIMBOLOS[r.incognita] + " (calculada)",
        fmtNum(d[r.incognita]) + " " + UNIDADES[r.incognita],
        null, true
      ));
    }
    cajaTrans.cuerpo.appendChild(filaDato("Relación de transmisión (i)", fmtNum(r.i), r.tipoTransmision));
    cajaTrans.cuerpo.appendChild(filaDato("Distancia entre ejes (E)", fmtNum(r.E) + " mm", null, true));
    cajaTrans.cuerpo.appendChild(filaDato("Longitud — lazo abierto (L)", fmtNum(r.Labierto) + " mm", null, true));
    cajaTrans.cuerpo.appendChild(filaDato("Longitud — lazo cruzado (L)", fmtNum(r.Lcruzado) + " mm"));
    cont.appendChild(cajaTrans);

    if (c) {
      const cajaSel = caja("Selección de correa", "caja-acento");
      cajaSel.cuerpo.appendChild(filaDato("Potencia corregida (Pc)", fmtNum(c.Pc) + " HP", null, true));
      cajaSel.cuerpo.appendChild(filaDato("Sección", c.seccion || "a elegir (Gráfico 1)", null, true));
      cajaSel.cuerpo.appendChild(filaDato("Nº de correa", c.correaN !== null ? fmtNum(c.correaN, 0) : "—", null, true));
      cajaSel.cuerpo.appendChild(filaDato("Relación K (D mayor / D menor)", fmtNum(c.K)));
      cajaSel.cuerpo.appendChild(filaDato("Arco de contacto (α)", fmtNum(c.alfa) + "°"));
      cajaSel.cuerpo.appendChild(filaDato("Factor de arco (Fc)", c.fc !== null ? fmtNum(c.fc) : "—"));
      cajaSel.cuerpo.appendChild(filaDato("Factor de longitud (Fcl)", c.fcl !== null ? fmtNum(c.fcl) : "—"));
      cajaSel.cuerpo.appendChild(filaDato("Velocidad tangencial (Vt)", fmtNum(c.vt) + " m/s"));
      if (c.pb !== null) cajaSel.cuerpo.appendChild(filaDato("Prestación base (Pb)", fmtNum(c.pb) + " HP"));
      if (c.adicional !== null) cajaSel.cuerpo.appendChild(filaDato("Adicional por relación", fmtNum(c.adicional) + " HP"));
      if (c.pbk !== null) cajaSel.cuerpo.appendChild(filaDato("Prestación base corregida (Pbk)", fmtNum(c.pbk) + " HP"));
      if (c.pe !== null) cajaSel.cuerpo.appendChild(filaDato("Potencia efectiva por correa (Pe)", fmtNum(c.pe) + " HP"));
      cont.appendChild(cajaSel);
    }

    salida.appendChild(cont);
    salida.appendChild(esquemaPoleas(r));
    if (c) agregarAvisosSeleccion(c);
    else agregarNotaPotencia();
  }

  /* ---------- Modo: paso a paso ---------- */
  function renderPasoAPaso() {
    const r = ultimoResultado;
    const d = r.datos;
    const pasos = [];

    // Paso 1: planteo y despeje
    const lineasP1 = [{ latex: "n_1 \\cdot d_1 = n_2 \\cdot d_2", texto: "n₁ · d₁ = n₂ · d₂" }];
    if (r.incognita) {
      const despejes = {
        n1: {
          latex: "n_1 = \\dfrac{n_2 \\cdot d_2}{d_1} = \\dfrac{" + fmtLatex(d.n2) + " \\cdot " + fmtLatex(d.D) + "}{" + fmtLatex(d.d) + "} = " + fmtLatex(d.n1) + "\\ \\text{rpm}",
          texto: "n₁ = (n₂·d₂)/d₁ = " + fmtNum(d.n1) + " rpm"
        },
        n2: {
          latex: "n_2 = \\dfrac{n_1 \\cdot d_1}{d_2} = \\dfrac{" + fmtLatex(d.n1) + " \\cdot " + fmtLatex(d.d) + "}{" + fmtLatex(d.D) + "} = " + fmtLatex(d.n2) + "\\ \\text{rpm}",
          texto: "n₂ = (n₁·d₁)/d₂ = " + fmtNum(d.n2) + " rpm"
        },
        d: {
          latex: "d_1 = \\dfrac{n_2 \\cdot d_2}{n_1} = \\dfrac{" + fmtLatex(d.n2) + " \\cdot " + fmtLatex(d.D) + "}{" + fmtLatex(d.n1) + "} = " + fmtLatex(d.d) + "\\ \\text{mm}",
          texto: "d₁ = (n₂·d₂)/n₁ = " + fmtNum(d.d) + " mm"
        },
        D: {
          latex: "d_2 = \\dfrac{n_1 \\cdot d_1}{n_2} = \\dfrac{" + fmtLatex(d.n1) + " \\cdot " + fmtLatex(d.d) + "}{" + fmtLatex(d.n2) + "} = " + fmtLatex(d.D) + "\\ \\text{mm}",
          texto: "d₂ = (n₁·d₁)/n₂ = " + fmtNum(d.D) + " mm"
        }
      };
      lineasP1.push(despejes[r.incognita]);
      pasos.push({
        titulo: "Planteo y despeje de la incógnita (" + ETIQUETAS[r.incognita] + ")",
        lineas: lineasP1,
        nota: "d₁ = d (polea motora) y d₂ = D (polea accionada)."
      });
    } else {
      pasos.push({ titulo: "Planteo", lineas: lineasP1, nota: "Se cargaron los cuatro datos: no hay incógnita que despejar." });
    }

    // Paso 2: relación de transmisión
    pasos.push({
      titulo: "Relación de transmisión",
      lineas: [
        { latex: "i = \\dfrac{n_{accionado}}{n_{motor}} = \\dfrac{d_{motor}}{d_{accionado}}", texto: "i = n_accionado / n_motor = d_motor / d_accionado" },
        { latex: "i = \\dfrac{" + fmtLatex(d.n2) + "}{" + fmtLatex(d.n1) + "} = " + fmtLatex(r.i), texto: "i = " + fmtNum(d.n2) + " / " + fmtNum(d.n1) + " = " + fmtNum(r.i) }
      ],
      nota: "i " + (r.i < 1 ? "< 1" : (r.i > 1 ? "> 1" : "= 1")) + " → transmisión de " + r.tipoTransmision.toLowerCase() + "."
    });

    // Paso 3: distancia entre ejes
    pasos.push({
      titulo: "Distancia entre ejes",
      lineas: r.Edada
        ? [{ latex: "E = " + fmtLatex(r.E) + "\\ \\text{mm}\\ \\text{(dato del ejercicio)}", texto: "E = " + fmtNum(r.E) + " mm (dato del ejercicio)" }]
        : [{
            latex: "E = 5 \\cdot d_{motor} = 5 \\cdot " + fmtLatex(d.d) + " = " + fmtLatex(r.E) + "\\ \\text{mm}",
            texto: "E = 5 · d_motor = " + fmtNum(r.E) + " mm"
          }],
      nota: r.Edada ? null : "No se cargó E: se adopta E = 5 × d (polea motora) como estándar."
    });

    // Pasos 4 y 5: longitudes
    const t1 = 2 * r.E;
    const t2 = (Math.PI / 2) * (d.D + d.d);
    const t3a = Math.pow(d.D - d.d, 2) / (4 * r.E);
    const t3c = Math.pow(d.D + d.d, 2) / (4 * r.E);
    pasos.push({
      titulo: "Longitud de correa — lazo abierto",
      lineas: [
        { latex: "L = 2E + \\dfrac{\\pi}{2}(D + d) + \\dfrac{(D - d)^2}{4E}", texto: "L = 2·E + (π/2)·(D + d) + (D − d)²/(4·E)" },
        {
          latex: "L = 2 \\cdot " + fmtLatex(r.E) + " + \\dfrac{\\pi}{2}(" + fmtLatex(d.D) + " + " + fmtLatex(d.d) + ") + \\dfrac{(" + fmtLatex(d.D) + " - " + fmtLatex(d.d) + ")^2}{4 \\cdot " + fmtLatex(r.E) + "}",
          texto: "L = 2·" + fmtNum(r.E) + " + (π/2)·(" + fmtNum(d.D + d.d) + ") + (" + fmtNum(d.D - d.d) + ")²/(4·" + fmtNum(r.E) + ")"
        },
        {
          latex: "L = " + fmtLatex(t1) + " + " + fmtLatex(t2) + " + " + fmtLatex(t3a) + " = \\mathbf{" + fmtLatex(r.Labierto) + "}\\ \\text{mm}",
          texto: "L = " + fmtNum(t1) + " + " + fmtNum(t2) + " + " + fmtNum(t3a) + " = " + fmtNum(r.Labierto) + " mm"
        }
      ]
    });
    pasos.push({
      titulo: "Longitud de correa — lazo cerrado (cruzado)",
      lineas: [
        { latex: "L = 2E + \\dfrac{\\pi}{2}(D + d) + \\dfrac{(D + d)^2}{4E}", texto: "L = 2·E + (π/2)·(D + d) + (D + d)²/(4·E)" },
        {
          latex: "L = " + fmtLatex(t1) + " + " + fmtLatex(t2) + " + " + fmtLatex(t3c) + " = \\mathbf{" + fmtLatex(r.Lcruzado) + "}\\ \\text{mm}",
          texto: "L = " + fmtNum(t1) + " + " + fmtNum(t2) + " + " + fmtNum(t3c) + " = " + fmtNum(r.Lcruzado) + " mm"
        }
      ]
    });

    // Pasos de selección de correa
    const c = r.cantidad;
    if (c) {
      pasos.push({
        titulo: "Potencia corregida (Tabla 3)",
        lineas: [
          { latex: "P_c = P \\cdot F_{cp}", texto: "Pc = P · Fcp" },
          {
            latex: "P_c = " + fmtLatex(c.P) + " \\cdot " + fmtLatex(c.fcp) + " = \\mathbf{" + fmtLatex(c.Pc) + "}\\ \\text{HP}",
            texto: "Pc = " + fmtNum(c.P) + " · " + fmtNum(c.fcp) + " = " + fmtNum(c.Pc) + " HP"
          }
        ],
        nota: "Fcp = " + fmtNum(c.fcp) + " (Tabla 3: " + c.grupo.nombre.split("—")[0].trim() + ", motor " +
          (c.motor === "normal" ? "torque normal" : "alto torque") + ", servicio " + nombreServicio(c.servicio) + ")."
      });

      pasos.push({
        titulo: "Sección de la correa (Gráfico Nº 1)",
        lineas: [{
          latex: c.seccion ? "\\text{Con } P_c = " + fmtLatex(c.Pc) + "\\ \\text{HP y } N = " + fmtLatex(c.poleaMenorN) + "\\ \\text{rpm} \\Rightarrow \\text{sección } \\mathbf{" + c.seccion + "}" : "\\text{Elegir en el gráfico con } P_c \\text{ y las rpm de la polea menor}",
          texto: c.seccion ? "Con Pc = " + fmtNum(c.Pc) + " HP y N = " + fmtNum(c.poleaMenorN) + " rpm → sección " + c.seccion : "Elegir la sección en el Gráfico Nº 1"
        }],
        nota: "Entrar al gráfico con las rpm de la polea menor (" + (c.poleaMenorEsMotor ? "la motora" : "la accionada") + ") y la potencia corregida (botón «Ver gráfico de selección»)."
      });

      pasos.push({
        titulo: "Relación K y verificación de la distancia entre ejes",
        lineas: [
          {
            latex: "K = \\dfrac{D_{mayor}}{D_{menor}} = \\dfrac{" + fmtLatex(c.poleaMayorD) + "}{" + fmtLatex(c.poleaMenorD) + "} = " + fmtLatex(c.K),
            texto: "K = D mayor / D menor = " + fmtNum(c.K)
          },
          c.K < 3 ? {
            latex: "l \\geq \\dfrac{(K + 1) \\cdot D_{menor}}{2} + D_{menor} = \\dfrac{(" + fmtLatex(c.K) + " + 1) \\cdot " + fmtLatex(c.poleaMenorD) + "}{2} + " + fmtLatex(c.poleaMenorD) + " = " + fmtLatex(c.lMin) + "\\ \\text{mm}",
            texto: "l ≥ (K+1)·D menor/2 + D menor = " + fmtNum(c.lMin) + " mm"
          } : {
            latex: "K \\geq 3 \\Rightarrow l \\geq D_{mayor} = " + fmtLatex(c.lMin) + "\\ \\text{mm}",
            texto: "K ≥ 3 → l ≥ D mayor = " + fmtNum(c.lMin) + " mm"
          },
          {
            latex: "E = " + fmtLatex(r.E) + "\\ \\text{mm} " + (c.verificaDistancia ? "\\geq" : "<") + " " + fmtLatex(c.lMin) + "\\ \\text{mm} \\Rightarrow \\text{" + (c.verificaDistancia ? "verifica" : "NO verifica") + "}",
            texto: "E = " + fmtNum(r.E) + " mm " + (c.verificaDistancia ? "≥" : "<") + " " + fmtNum(c.lMin) + " mm → " + (c.verificaDistancia ? "verifica" : "NO verifica")
          }
        ]
      });

      const lineasN6 = [{
        latex: c.correaN !== null
          ? "L = " + fmtLatex(r.Labierto) + "\\ \\text{mm} \\Rightarrow \\text{por Tabla 6} \\Rightarrow \\text{correa " + c.seccion + "\\ N°" + fmtLatex(c.correaN, 0) + "}"
          : "\\text{Elegir sección para buscar el N° en la Tabla 6}",
        texto: c.correaN !== null
          ? "L = " + fmtNum(r.Labierto) + " mm → por Tabla 6 → correa " + c.seccion + " Nº " + fmtNum(c.correaN, 0)
          : "Elegir sección para buscar el Nº en la Tabla 6"
      }];
      if (c.fcl !== null) {
        lineasN6.push({
          latex: "F_{cl} = " + fmtLatex(c.fcl) + " \\quad (\\text{Tabla 4, fila N° " + fmtLatex(c.filaFcl.n, 0) + ", sección " + c.seccion + "})",
          texto: "Fcl = " + fmtNum(c.fcl) + " (Tabla 4, fila Nº " + fmtNum(c.filaFcl.n, 0) + ", sección " + c.seccion + ")"
        });
      }
      pasos.push({
        titulo: "Correa Nº (Tabla 6) y factor de longitud Fcl (Tabla 4)",
        lineas: lineasN6,
        nota: "Nº elegido automáticamente: es el de longitud primitiva más próxima a L en la Tabla 6 (rango transcripto: Nº 15 a 180). Para el Fcl se toma la fila más cercana a ese Nº entre las que tienen valor para la sección."
      });

      pasos.push({
        titulo: "Arco de contacto y factor Fc (Tabla 5)",
        lineas: [
          {
            latex: "\\alpha = 180 - \\dfrac{57 (D_{mayor} - D_{menor})}{E} = 180 - \\dfrac{57 (" + fmtLatex(c.poleaMayorD) + " - " + fmtLatex(c.poleaMenorD) + ")}{" + fmtLatex(r.E) + "} = \\mathbf{" + fmtLatex(c.alfa) + "°}",
            texto: "α = 180 − 57·(D mayor − D menor)/E = " + fmtNum(c.alfa) + "°"
          },
          {
            latex: "F_c = " + fmtLatex(c.fc) + " \\quad (\\text{Tabla 5, fila " + fmtLatex(c.filaFc.grados, 0) + "°, poleas " + (c.poleas === "acanaladas" ? "acanaladas" : "acanalada/plana") + "})",
            texto: "Fc = " + fmtNum(c.fc) + " (Tabla 5, fila " + fmtNum(c.filaFc.grados, 0) + "°)"
          }
        ]
      });

      pasos.push({
        titulo: "Velocidad tangencial de la correa",
        lineas: [{
          latex: "V_t = \\dfrac{\\pi \\cdot d \\cdot N}{60 \\cdot 1000} = \\dfrac{\\pi \\cdot " + fmtLatex(d.d) + " \\cdot " + fmtLatex(d.n1) + "}{60000} = \\mathbf{" + fmtLatex(c.vt) + "}\\ \\text{m/s}",
          texto: "Vt = π·d·N/60000 = " + fmtNum(c.vt) + " m/s"
        }],
        nota: c.vt > 30 ? "Atención: Vt supera los 30 m/s, se deberán usar poleas especiales." : "No debe superar los 30 m/s."
      });

      if (c.pbk !== null) {
        pasos.push({
          titulo: "Prestación base corregida (Tabla 2)",
          lineas: [
            { latex: "P_{bk} = P_b + \\text{adicional por relación}", texto: "Pbk = Pb + adicional por relación" },
            {
              latex: "P_{bk} = " + fmtLatex(c.pb) + " + " + fmtLatex(c.adicional !== null ? c.adicional : 0) + " = \\mathbf{" + fmtLatex(c.pbk) + "}\\ \\text{HP}",
              texto: "Pbk = " + fmtNum(c.pb) + " + " + fmtNum(c.adicional !== null ? c.adicional : 0) + " = " + fmtNum(c.pbk) + " HP"
            }
          ],
          nota: "Tabla 2, sección " + c.seccion + ": fila rpm " + fmtNum(c.tabla2Res.filaN, 0) + " (más próxima al motor, " + fmtNum(c.motorN, 0) +
            " rpm), columna d = " + fmtNum(c.tabla2Res.diamUsado, 0) + " mm (más próxima al motor, " + fmtNum(c.motorD, 0) + " mm) → Pb; banda de K = " + fmtNum(c.K) + " → adicional."
        });
      } else if (c.seccion && !c.tabla2Disponible) {
        pasos.push({
          titulo: "Prestación base corregida (Tabla 2)",
          lineas: [{ latex: "\\text{Sección " + c.seccion + ": Tabla 2 no transcripta todavía}", texto: "Sección " + c.seccion + ": Tabla 2 no transcripta todavía" }],
          nota: "Las secciones D y E de la Tabla 2 aún no están cargadas en la app; por ahora hay que buscar Pb y el adicional en el catálogo a mano."
        });
      }

      if (c.pe !== null) {
        pasos.push({
          titulo: "Potencia efectiva por correa",
          lineas: [
            { latex: "P_e = P_{bk} \\cdot F_{cl} \\cdot F_c", texto: "Pe = Pbk · Fcl · Fc" },
            {
              latex: "P_e = " + fmtLatex(c.pbk) + " \\cdot " + fmtLatex(c.fcl) + " \\cdot " + fmtLatex(c.fc) + " = \\mathbf{" + fmtLatex(c.pe) + "}\\ \\text{HP}",
              texto: "Pe = " + fmtNum(c.pbk) + " · " + fmtNum(c.fcl) + " · " + fmtNum(c.fc) + " = " + fmtNum(c.pe) + " HP"
            }
          ]
        });
        pasos.push({
          titulo: "Cantidad de correas",
          lineas: [
            { latex: "\\text{Cant.} = \\dfrac{P_c}{P_e} = \\dfrac{" + fmtLatex(c.Pc) + "}{" + fmtLatex(c.pe) + "} = " + fmtLatex(c.cantidadExacta), texto: "Cant. = Pc/Pe = " + fmtNum(c.cantidadExacta) },
            {
              latex: "\\Rightarrow \\textbf{" + c.cantidad + "\\ correas\\ " + (c.seccion || "?") + "\\ N°" + fmtLatex(c.correaN, 0) + "}",
              texto: "→ " + c.cantidad + " correas " + (c.seccion || "?") + " Nº " + fmtNum(c.correaN, 0)
            }
          ],
          nota: "Con fracción se adopta el entero inmediato superior."
        });
      }
    }

    renderPasos(salida, pasos);
    salida.appendChild(esquemaPoleas(ultimoResultado));
    if (c) agregarAvisosSeleccion(c);
    else agregarNotaPotencia();
  }

  /* ---------- Avisos ---------- */
  function agregarAvisosSeleccion(c) {
    if (!c.seccion) {
      const divSeccion = document.createElement("div");
      divSeccion.className = "aviso aviso-placeholder";
      divSeccion.innerHTML = "Elegí la <strong>sección</strong> con el Gráfico Nº 1 (botón «Ver gráfico») para que la app calcule sola el resto.";
      salida.appendChild(divSeccion);
    } else if (!c.tabla2Disponible) {
      const divT2 = document.createElement("div");
      divT2.className = "aviso aviso-placeholder";
      divT2.innerHTML = "La sección <strong>" + c.seccion + "</strong> todavía no tiene la Tabla 2 (prestación base) cargada en la app " +
        "— por ahora la <strong>cantidad de correas</strong> queda pendiente para esta sección. Funciona automático para Z, A, B y C.";
      salida.appendChild(divT2);
    } else if (c.correaNLejos) {
      const divLejos = document.createElement("div");
      divLejos.className = "aviso aviso-placeholder";
      divLejos.innerHTML = "La longitud más próxima disponible en la Tabla 6 (sección " + c.seccion + ", Nº " +
        fmtNum(c.correaN, 0) + ") difiere bastante de L = " + fmtNum(ultimoResultado.Labierto) +
        " mm (rango transcripto: Nº 15 a 180). Verificá el resultado con el catálogo completo si tu caso lo supera.";
      salida.appendChild(divLejos);
    }

    const dmin = c.seccion ? CORREAS_DATA.diametroMinimo[c.seccion] : null;
    if (dmin && c.poleaMenorD < dmin) {
      const div2 = document.createElement("div");
      div2.className = "error-msg";
      div2.textContent = "El diámetro de la polea menor (" + fmtNum(c.poleaMenorD) + " mm) está por debajo del mínimo aconsejado para la sección " + c.seccion + " (" + dmin + " mm, Tabla 1).";
      salida.appendChild(div2);
    }
    if (c.verificaDistancia === false) {
      const div3 = document.createElement("div");
      div3.className = "error-msg";
      div3.textContent = "La distancia entre ejes E = " + fmtNum(ultimoResultado.E) + " mm no cumple el mínimo l ≥ " + fmtNum(c.lMin) + " mm.";
      salida.appendChild(div3);
    }
  }

  function agregarNotaPotencia() {
    const div = document.createElement("div");
    div.className = "aviso aviso-placeholder";
    div.innerHTML = "Para calcular la <strong>potencia corregida y el arco de contacto</strong> carga la potencia a transmitir (HP).";
    salida.appendChild(div);
  }

  /* ---------- Esquema de poleas (SVG simple) ---------- */
  function esquemaPoleas(r) {
    const cont = document.createElement("div");
    cont.className = "esquema";

    const ancho = 360, alto = 150, cy = alto / 2;
    const maxR = 55;
    const escala = maxR / (Math.max(r.datos.d, r.datos.D) / 2);
    const r1 = Math.max(10, (r.datos.d / 2) * escala);
    const r2 = Math.max(10, (r.datos.D / 2) * escala);
    const cx1 = 80, cx2 = 280;

    const svg =
      '<svg viewBox="0 0 ' + ancho + " " + alto + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Esquema de poleas">' +
      '<line x1="' + cx1 + '" y1="' + (cy - r1) + '" x2="' + cx2 + '" y2="' + (cy - r2) + '" stroke="#1d5fa8" stroke-width="2"/>' +
      '<line x1="' + cx1 + '" y1="' + (cy + r1) + '" x2="' + cx2 + '" y2="' + (cy + r2) + '" stroke="#1d5fa8" stroke-width="2"/>' +
      '<circle cx="' + cx1 + '" cy="' + cy + '" r="' + r1 + '" fill="#e8f0fa" stroke="#16497f" stroke-width="2"/>' +
      '<circle cx="' + cx2 + '" cy="' + cy + '" r="' + r2 + '" fill="#e8f0fa" stroke="#16497f" stroke-width="2"/>' +
      '<circle cx="' + cx1 + '" cy="' + cy + '" r="3" fill="#16497f"/>' +
      '<circle cx="' + cx2 + '" cy="' + cy + '" r="3" fill="#16497f"/>' +
      '<text x="' + cx1 + '" y="' + (cy + r1 + 18) + '" text-anchor="middle" font-size="12" fill="#1f2a37">d (motora)</text>' +
      '<text x="' + cx2 + '" y="' + (cy + r2 + 18) + '" text-anchor="middle" font-size="12" fill="#1f2a37">D (accionada)</text>' +
      "</svg>";

    cont.innerHTML = svg + '<p class="nota">Esquema ilustrativo — lazo abierto (proporciones según diámetros).</p>';
    return cont;
  }

  // Estado inicial
  renderVacio(salida, "Carga los datos y presiona «Calcular».", "correas");
})();
