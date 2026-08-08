/* ============================================================
   Utilidades compartidas: formato numérico, renderizado de
   fórmulas (KaTeX con fallback a texto) y helpers de salida.
   ============================================================ */

/* Fijo en 3 decimales, truncado (no redondeado) en toda la app —
   así resuelve el profesor a mano, sin excepción y sin opción de
   cambiarlo (pedido explícito del usuario). */
const APP = {
  decimales: 3
};

/** Trunca (no redondea) un valor a la cantidad de decimales dada. */
function truncar(valor, decimales) {
  if (!isFinite(valor)) return valor;
  const f = Math.pow(10, decimales);
  return Math.trunc(valor * f) / f;
}

/** Trunca y formatea un número con coma decimal (español). */
function fmtNum(valor, decimales) {
  const d = (decimales === undefined) ? APP.decimales : decimales;
  if (!isFinite(valor)) return "—";
  const truncado = truncar(valor, d);
  return truncado.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: d,
    useGrouping: false
  });
}

/** Formatea un número para usarlo dentro de LaTeX (coma sin espacio). */
function fmtLatex(valor, decimales) {
  return fmtNum(valor, decimales).replace(",", "{,}").replace("-", "\\text{−}");
}

/** ¿KaTeX está disponible? (si no hay internet, se usa texto plano) */
function katexDisponible() {
  return typeof katex !== "undefined";
}

/**
 * Crea una línea matemática.
 * latex: expresión LaTeX; textoPlano: alternativa legible sin KaTeX.
 */
function lineaMath(latex, textoPlano) {
  const div = document.createElement("div");
  div.className = "linea-math";
  if (katexDisponible()) {
    try {
      katex.render(latex, div, { throwOnError: false, displayMode: false });
      return div;
    } catch (e) { /* cae al texto plano */ }
  }
  div.textContent = textoPlano || latex;
  return div;
}

/**
 * Renderiza pasos estilo pizarrón.
 * pasos: [{ titulo, lineas: [{latex, texto}], nota }]
 */
function renderPasos(contenedor, pasos) {
  contenedor.innerHTML = "";
  pasos.forEach(function (paso, idx) {
    const div = document.createElement("div");
    div.className = "paso";

    const h3 = document.createElement("h3");
    h3.textContent = "Paso " + (idx + 1) + " — " + paso.titulo;
    div.appendChild(h3);

    (paso.lineas || []).forEach(function (l) {
      div.appendChild(lineaMath(l.latex, l.texto));
    });

    if (paso.html) {
      const extra = document.createElement("div");
      extra.innerHTML = paso.html;
      div.appendChild(extra);
    }

    if (paso.nota) {
      const p = document.createElement("p");
      p.className = "nota";
      p.textContent = paso.nota;
      div.appendChild(p);
    }

    contenedor.appendChild(div);
  });
}

/**
 * Renderiza una tabla resumen de resultados.
 * filas: [{ magnitud, simbolo, valor (string ya formateado), unidad }]
 */
function renderTablaResultados(contenedor, filas) {
  contenedor.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "tabla-scroll";
  const tabla = document.createElement("table");
  tabla.className = "tabla-resultados";

  tabla.innerHTML =
    "<thead><tr><th>Magnitud</th><th>Símbolo</th><th>Valor</th><th>Unidad</th></tr></thead>";

  const tbody = document.createElement("tbody");
  filas.forEach(function (f) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + f.magnitud + "</td>" +
      "<td>" + (f.simbolo || "") + "</td>" +
      '<td class="valor">' + f.valor + "</td>" +
      "<td>" + (f.unidad || "") + "</td>";
    tbody.appendChild(tr);
  });
  tabla.appendChild(tbody);
  wrap.appendChild(tabla);
  contenedor.appendChild(wrap);
}

/** Muestra un mensaje de error en el contenedor de salida. */
function renderError(contenedor, mensajes) {
  contenedor.innerHTML = "";
  (Array.isArray(mensajes) ? mensajes : [mensajes]).forEach(function (m) {
    const div = document.createElement("div");
    div.className = "error-msg";
    div.textContent = m;
    contenedor.appendChild(div);
  });
}

/* Mismos trazos que los íconos de las pestañas (index.html), reusados
   acá para que el estado vacío de cada módulo se sienta como "todavía
   no hay nada" en su propio lenguaje visual, no un mensaje genérico. */
const ICONOS_VACIO = {
  ajustes: '<path d="M4 8v8M20 8v8M4 12h16"/><path d="M8 9.5v5M12 9.5v5M16 9.5v5" stroke-width="1.2" opacity=".65"/>',
  correas: '<circle cx="7" cy="16" r="3"/><circle cx="17" cy="8" r="4"/><line x1="8.9" y1="13.8" x2="14.3" y2="10.7"/><line x1="5.6" y1="18.5" x2="15.5" y2="11.9"/>',
  rodamientos: '<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="3.6"/><circle cx="12" cy="4.6" r="1" fill="currentColor" stroke="none"/><circle cx="19.1" cy="8.8" r="1" fill="currentColor" stroke="none"/><circle cx="19.1" cy="15.2" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="19.4" r="1" fill="currentColor" stroke="none"/><circle cx="4.9" cy="15.2" r="1" fill="currentColor" stroke="none"/><circle cx="4.9" cy="8.8" r="1" fill="currentColor" stroke="none"/>'
};

/** Mensaje neutro cuando todavía no se calculó nada. icono: clave de
 * ICONOS_VACIO ("ajustes"/"correas"/"rodamientos"), opcional. */
function renderVacio(contenedor, texto, icono) {
  const svg = icono && ICONOS_VACIO[icono]
    ? '<svg class="salida-vacia-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONOS_VACIO[icono] + "</svg>"
    : "";
  contenedor.innerHTML = '<div class="salida-vacia">' + svg + '<p>' + texto + "</p></div>";
}

/** Lee un input numérico. Devuelve {valor, vacio, invalido}. */
function leerNumero(input) {
  const raw = input.value.trim();
  if (raw === "") return { valor: null, vacio: true, invalido: false };
  const v = Number(raw.replace(",", "."));
  if (!isFinite(v)) return { valor: null, vacio: false, invalido: true };
  return { valor: v, vacio: false, invalido: false };
}

/** Marca visualmente un input como inválido. */
function marcarInvalido(input, invalido) {
  input.classList.toggle("invalido", !!invalido);
}

/* ============================================================
   Helpers compartidos de "solo resultados" (los tres módulos):
   cajas de datos (caja + filaDato) y el resultado destacado que
   va arriba de todo (resumenHero) — así el usuario ve la respuesta
   final primero y el detalle de apoyo debajo, sin tener que leer
   todo para encontrar el número que le importa.
   ============================================================ */

/** Fila etiqueta/valor dentro de una caja. valorSecundario es
 * opcional (texto chico debajo, p.ej. mm al lado de µm). */
function filaDato(etiqueta, valorPrincipal, valorSecundario, destacado) {
  const fila = document.createElement("div");
  fila.className = "dato-fila" + (destacado ? " dato-destacado" : "");
  const et = document.createElement("span");
  et.className = "dato-etiqueta";
  et.textContent = etiqueta;
  fila.appendChild(et);

  const valWrap = document.createElement("span");
  valWrap.className = "dato-valor-wrap";
  const val = document.createElement("span");
  val.className = "dato-valor";
  val.textContent = valorPrincipal;
  valWrap.appendChild(val);
  if (valorSecundario) {
    const sec = document.createElement("span");
    sec.className = "dato-valor-sec";
    sec.textContent = valorSecundario;
    valWrap.appendChild(sec);
  }
  fila.appendChild(valWrap);
  return fila;
}

/** Caja con encabezado + cuerpo de filaDato. clase = acento visual
 * ("caja-generica" azul, "caja-acento" violeta, o las específicas
 * de Ajustes "caja-agujero"/"caja-eje"). Devuelve el contenedor con
 * `.cuerpo` para ir agregando filaDato adentro. */
function caja(titulo, clase) {
  const cont = document.createElement("div");
  cont.className = "caja-parte " + clase;
  const enc = document.createElement("div");
  enc.className = "caja-encabezado";
  const h3 = document.createElement("h3");
  h3.textContent = titulo;
  enc.appendChild(h3);
  cont.appendChild(enc);
  const cuerpo = document.createElement("div");
  cuerpo.className = "caja-datos";
  cont.appendChild(cuerpo);
  cont.cuerpo = cuerpo;
  return cont;
}

/** El resultado destacado que va ARRIBA de todo en "solo resultados":
 * un título grande (la respuesta) + hasta unos pocos valores de apoyo
 * a la derecha. clase: "resumen-juego" (verde), "resumen-aprieto"
 * (rojo), "resumen-indeterminado" (ámbar) o "resumen-info" (azul,
 * para resultados neutros como "cantidad de correas" o "vida
 * probable", que no son un veredicto tipo juego/aprieto).
 * valores: [[etiqueta, valorPrincipal, valorSecundarioOpcional], ...] */
function resumenHero(titulo, clase, valores) {
  const resumen = document.createElement("div");
  resumen.className = "resumen-ajuste " + clase;
  const tipo = document.createElement("span");
  tipo.className = "resumen-tipo";
  tipo.textContent = titulo;
  resumen.appendChild(tipo);

  if (valores && valores.length) {
    const cont = document.createElement("div");
    cont.className = "resumen-valores";
    valores.forEach(function (par) {
      const item = document.createElement("div");
      item.className = "resumen-item";
      const et = document.createElement("span");
      et.className = "resumen-etiqueta";
      et.textContent = par[0];
      const val = document.createElement("span");
      val.className = "resumen-valor";
      val.textContent = par[1];
      item.appendChild(et);
      item.appendChild(val);
      if (par[2]) {
        const sec = document.createElement("span");
        sec.className = "resumen-valor-mm";
        sec.textContent = par[2];
        item.appendChild(sec);
      }
      cont.appendChild(item);
    });
    resumen.appendChild(cont);
  }
  return resumen;
}
