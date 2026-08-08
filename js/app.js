/* ============================================================
   Navegación entre módulos y configuración global (decimales)
   ============================================================ */

(function () {
  const botones = document.querySelectorAll(".tab-btn");
  const modulos = {
    ajustes: document.getElementById("modulo-ajustes"),
    correas: document.getElementById("modulo-correas"),
    rodamientos: document.getElementById("modulo-rodamientos")
  };

  botones.forEach(function (btn) {
    btn.addEventListener("click", function () {
      botones.forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      Object.keys(modulos).forEach(function (clave) {
        modulos[clave].hidden = clave !== btn.dataset.modulo;
      });
    });
  });
})();
