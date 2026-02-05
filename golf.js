let jugadores = [];
let golpes = {};
let putts = {};
let par = [];
let hoyo = 1;
let fase = "setup";
let campoActual = null;
let vistaActual = "setup"; // setup | juego | resumen9 | resumen | historial
let inicioHoyo = 1; // 1 o 10
let ordenHoyos = []; // orden real de juego
let vieneDeUltimoJuego = false;

/* ================= CAMPOS ================= */
function cargarCampos() {
  const select = document.getElementById("campoSelect");
  if (!select) return;

  const campos = JSON.parse(localStorage.getItem("campos")) || {};
  select.innerHTML = `<option value="">-- Campo nuevo --</option>`;
  Object.keys(campos).forEach(c => {
    select.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

function seleccionarCampo() {
  const campos = JSON.parse(localStorage.getItem("campos")) || {};
  const sel = document.getElementById("campoSelect").value;
  if (sel && campos[sel]) {
    campoActual = sel;
    par = [...campos[sel]];
  }
}

function guardarVista(vista) {
  vistaActual = vista;
  localStorage.setItem("vistaActual", vista);
}

function volverInicio() {
  // 🔴 LIMPIAR CAMPO ACTUAL
  campoActual = null;
  par = [];

  // 🔴 LIMPIAR SELECT VISUALMENTE
  const select = document.getElementById("campoSelect");
  if (select) select.value = "";

  ocultarTodo();
  document.getElementById("setup").style.display = "block";
  guardarVista("setup");
}


function nuevoCampo() {
  const nombre = prompt("Nombre del campo");
  if (!nombre) return;

  const pares = [];
  for (let i = 1; i <= 18; i++) {
    let p;
    do {
      p = Number(prompt(`Par del hoyo ${i}`, "4"));
    } while (![3,4,5].includes(p));
    pares.push(p);
  }

  const campos = JSON.parse(localStorage.getItem("campos")) || {};
  campos[nombre] = pares;
  localStorage.setItem("campos", JSON.stringify(campos));

  campoActual = nombre;
  par = pares;
  cargarCampos();
  document.getElementById("campoSelect").value = nombre;
}
function borrarCampo() {
  const select = document.getElementById("campoSelect");
  const nombre = select.value;

  if (!nombre) {
    alert("Selecciona un campo para borrar");
    return;
  }

  if (!confirm(`¿Seguro que deseas borrar el campo "${nombre}"?`)) return;

  const campos = JSON.parse(localStorage.getItem("campos")) || {};

  if (!campos[nombre]) {
    alert("El campo no existe");
    return;
  }

  delete campos[nombre];
  localStorage.setItem("campos", JSON.stringify(campos));

  // Reset selección
  campoActual = null;
  par = [];
  select.value = "";

  cargarCampos();
  alert(`Campo "${nombre}" eliminado`);
}

/* ================= JUGADORES ================= */
function crearInputsJugadores() {
  const n = Number(document.getElementById("numPlayers").value);
  const cont = document.getElementById("jugadores");
   cont.innerHTML = "";
   for (let i = 1; i <= n; i++) {
    cont.innerHTML += `
      <input id="jugador_${i}" placeholder="Jugador ${i}" maxlength="20">
    `;
  }
}
 crearInputsJugadores();

/* ================= INICIAR ================= */
function iniciarJuego() {

  if (!campoActual || !par.length) {
    alert("Debes seleccionar o crear un campo de golf");
    return;
  }

   jugadores = [];
   golpes = {};
   putts = {};

  const inputs = document.querySelectorAll("#jugadores input");

   for (let i of inputs) {
    if (!i.value.trim()) {
      alert("Debes ingresar el nombre de TODOS los jugadores");
      return;
    }
   }

  inputs.forEach(i => {
    const n = i.value.trim();
    jugadores.push(n);
    golpes[n] = Array(18).fill(0);
    putts[n] = Array(18).fill(0);
  });

  inicioHoyo = Number(document.getElementById("inicioVuelta").value);

  if (inicioHoyo === 10) {
    ordenHoyos = [
      ...Array.from({ length: 9 }, (_, i) => i + 10),
      ...Array.from({ length: 9 }, (_, i) => i + 1)
    ];
  } else {
    ordenHoyos = Array.from({ length: 18 }, (_, i) => i + 1);
  }

  hoyo = 1;
  fase = "juego";
  guardarVista("juego");
  guardarPartida();

  ocultarTodo();
  document.getElementById("juego").style.display = "block";
  renderTabla();
}
/* ================= TABLA ================= */
function renderTabla() {

  guardarVista("juego"); // 👈 CLAVE, evita que refrescar te saque

 const hoyoReal = ordenHoyos[hoyo - 1];

document.getElementById("hoyoActual").textContent = hoyoReal;
document.getElementById("parActual").textContent = `(Par ${par[hoyoReal - 1]})`;

  const t = document.getElementById("tablaGolpes");
  t.innerHTML = "";

  jugadores.forEach(j => {
    t.innerHTML += `
      <tr><th colspan="2">${j}</th></tr>
      <tr>
        <td>
          Golpes<br>
          <button onclick="modGolpe('${j}',-1)">−</button>
          <span class="golpe-actual">${golpes[j][hoyoReal - 1]}</span>
          <button onclick="modGolpe('${j}',1)">+</button>
        </td>
        <td>
          Putts<br>
          <button onclick="modPutt('${j}',-1)">−</button>
          <span class="golpe-actual">${putts[j][hoyoReal - 1]}</span>
          <button onclick="modPutt('${j}',1)">+</button>
        </td>
      </tr>`;
  });
}

function modGolpe(j, v) {
  const hoyoReal = ordenHoyos[hoyo - 1];

  golpes[j][hoyoReal - 1] = Math.max(0, golpes[j][hoyoReal - 1] + v);

  if (putts[j][hoyoReal - 1] > golpes[j][hoyoReal - 1]) {
    putts[j][hoyoReal - 1] = golpes[j][hoyoReal - 1];
  }

  guardarPartida();
  renderTabla();
}

function modPutt(j, v) {
  const hoyoReal = ordenHoyos[hoyo - 1];
  const nuevo = putts[j][hoyoReal - 1] + v;

  if (nuevo < 0) return;
  if (nuevo > golpes[j][hoyoReal - 1]) {
    return alert("Putts no pueden ser mayores que golpes");
  }

  putts[j][hoyoReal - 1] = nuevo;
  guardarPartida();
  renderTabla();
}

/* ================= NAVEGACIÓN ================= */
function siguienteHoyo(){
 const hoyoReal = ordenHoyos[hoyo - 1];

for (let j of jugadores) {
  if (golpes[j][hoyoReal - 1] === 0) {
    alert(`Faltan golpes en el hoyo ${hoyoReal}`);
    return;
  }
}

  if (hoyo === 9) return resumen9();
  if (hoyo === 18) return finalizar();

  hoyo++;
  guardarPartida();
  renderTabla();
}

function hoyoAnterior(){
  if (hoyo > 1) {
    hoyo--;
    guardarPartida();
    renderTabla();
  }
}

/* ================= RESUMEN 9 ================= */
function resumen9() {
  fase = "resumen9";
  guardarPartida();
  ocultarTodo();
  document.getElementById("resumen9").style.display = "block";

  const hoyosVuelta1 = ordenHoyos.slice(0, 9);
  const parVuelta1 = hoyosVuelta1.reduce((s, h) => s + par[h - 1], 0);

  let html = "<table><tr><th>Jugador</th>";

  hoyosVuelta1.forEach(h => {
    html += `<th>${h}</th>`;
  });

  html += "<th>Total</th><th>+/-</th></tr>";

  jugadores.forEach(j => {
    let total = 0;
    html += `<tr><td>${j}</td>`;

    hoyosVuelta1.forEach(h => {
      total += golpes[j][h - 1];
      html += `<td>${pintarGolpe(golpes[j][h - 1], par[h - 1])}</td>`;
    });

    html += `
      <td>${total}</td>
      <td>${total - parVuelta1 > 0 ? "+" : ""}${total - parVuelta1}</td>
    </tr>`;
  });

  html += `
    <tr class="par">
      <th>PAR</th>
      ${hoyosVuelta1.map(h => `<th>${par[h - 1]}</th>`).join("")}
      <th>${parVuelta1}</th>
      <th>0</th>
    </tr>
  </table>`;

  document.getElementById("tablaResumen9").innerHTML = html;
}

function continuarSegundoPar() {
  hoyo = 10; // índice 10 → hoyo real correcto
  fase = "juego";
  guardarPartida();
  ocultarTodo();
  document.getElementById("juego").style.display = "block";
  renderTabla();
}

/* ================= FINAL ================= */
function finalizar(){
  fase = "final";
  guardarVista("resumen");
  guardarPartida();
  ocultarTodo();
  document.getElementById("resumen").style.display = "block";

  const par9_1 = sum(par, 0, 9);
  const par9_2 = sum(par, 9, 18);
  const par18 = par9_1 + par9_2;

  let h = "<table><tr><th>Jugador</th>";

 for (let i = 1; i <= 18; i++) {
  h += `<th>${i}</th>`;
 }
  h += `
    <th>1–9</th>
    <th>10–18</th>
    <th>Total</th>
    <th>+/-</th>
  </tr>`;

  jugadores.forEach(j => {
    const v1 = sum(golpes[j], 0, 9);
    const v2 = sum(golpes[j], 9, 18);
    const total = v1 + v2;

    h += `<tr><td>${j}</td>`;

    for (let i = 0; i < 18; i++) {
      h += `<td>${pintarGolpe(golpes[j][i], par[i])}</td>`;

    }

    h += `
      <td>${v1}</td>
      <td>${v2}</td>
      <td>${total}</td>
      <td>${total - par18 > 0 ? "+" : ""}${total - par18}</td>
    </tr>`;
  });

  h += `
    <tr class="par">
      <th>PAR</th>
      ${par.map(p => `<th>${p}</th>`).join("")}
      <th>${par9_1}</th>
      <th>${par9_2}</th>
      <th>${par18}</th>
      <th>0</th>
    </tr>
  </table>`;

  document.getElementById("resultadoFinal").innerHTML = h;

  guardarHistorial();
}

/* ================= HISTORIAL ================= */
function guardarHistorial(){
  const h = JSON.parse(localStorage.getItem("historial")) || [];

  const partida = JSON.parse(localStorage.getItem("partidaActual"));
  if (!partida) return;

  partida.fecha = new Date().toLocaleString();
  h.push(partida);

  localStorage.setItem("historial", JSON.stringify(h));
}

function verHistorial() {
  const historial = JSON.parse(localStorage.getItem("historial")) || [];
  if (!historial.length) return alert("Sin historial");

  ocultarTodo();
  document.getElementById("historial").style.display = "block";
  guardarVista("historial");

  let html = "";

  historial.forEach((p, i) => {
    const par9_1 = sum(p.par, 0, 9);
    const par9_2 = sum(p.par, 9, 18);
    const par18 = par9_1 + par9_2;

    html += `
  <div class="historial-item">
    <div class="historial-titulo">
      Partida ${i + 1} – ${p.fecha}
    </div>
    <button class="btn-borrar-historial" data-index="${i}">
      🗑️ Borrar
    </button>
  </div>
`;

    html += "<table><tr><th>Jugador</th>";

    for (let h = 1; h <= 18; h++) {
      html += `<th>${h}</th>`;
    }
    html += `
      <th>1–9</th>
      <th>10–18</th>
      <th>Total</th>
      <th>+/-</th>
    </tr>`;

    p.jugadores.forEach(j => {
      const v1 = sum(p.golpes[j], 0, 9);
      const v2 = sum(p.golpes[j], 9, 18);
      const total = v1 + v2;

      html += `<tr><td>${j}</td>`;

      for (let k = 0; k < 18; k++) {
        html += `<td>${pintarGolpe(p.golpes[j][k], p.par[k])}</td>`;
      }

      html += `
        <td>${v1}</td>
        <td>${v2}</td>
        <td>${total}</td>
        <td>${total - par18 > 0 ? "+" : ""}${total - par18}</td>
      </tr>`;
    });

    html += `
      <tr class="par">
        <th>PAR</th>
        ${p.par.map(x => `<th>${x}</th>`).join("")}
        <th>${par9_1}</th>
        <th>${par9_2}</th>
        <th>${par18}</th>
        <th>0</th>
      </tr>
    </table><br>`;
  });

  document.getElementById("contenidoHistorial").innerHTML = html;
  document.querySelectorAll(".btn-borrar-historial").forEach(btn => {
  btn.addEventListener("touchstart", borrarPartidaDesdeHistorial);
  btn.addEventListener("click", borrarPartidaDesdeHistorial);
});

}

function salirHistorial() {
  guardarVista("setup");

  ocultarTodo();

  const partida = localStorage.getItem("partidaActual");

  if (partida) {
    restaurar();
  } else {
    document.getElementById("setup").style.display = "block";
  }
}
function regresarInicio() {
  if (!confirm("¿Seguro que deseas regresar al inicio?")) return;

  guardarVista("setup");
  ocultarTodo();
  document.getElementById("setup").style.display = "block";
}

function verUltimoJuego(){
  const h = JSON.parse(localStorage.getItem("historial")) || [];
  if (!h.length) return alert("Sin partidas");

  vieneDeUltimoJuego = true; // 👈 CLAVE
  localStorage.setItem("partidaActual", JSON.stringify(h[h.length-1]));
  guardarVista("juego");
  restaurar();
}


function borrarHistorial(){
  if (confirm("¿Borrar historial completo?")) {
    localStorage.removeItem("historial");
    alert("Historial eliminado");
  }
}

/* ================= STORAGE ================= */
function guardarPartida(){
  localStorage.setItem("partidaActual",
    JSON.stringify({jugadores,golpes,putts,par,hoyo,fase,campoActual,inicioHoyo,ordenHoyos})
  );
}

function restaurar() {
  const vista = localStorage.getItem("vistaActual") || "setup";
  const d = JSON.parse(localStorage.getItem("partidaActual"));

  ocultarTodo();

  // ✅ SIEMPRE respetar la vista
  if (vista === "setup") {
    document.getElementById("setup").style.display = "block";
    return;
  }

  if (vista === "historial") {
    document.getElementById("historial").style.display = "block";
    verHistorial();
    return;
  }

  // A partir de aquí SÍ puede restaurar partida
  if (!d) {
    document.getElementById("setup").style.display = "block";
    guardarVista("setup");
    return;
  }

  ({ jugadores, golpes, putts, par, hoyo, fase, campoActual } = d);

   inicioHoyo = d.inicioHoyo || 1;
ordenHoyos = d.ordenHoyos || Array.from({ length: 18 }, (_, i) => i + 1);

  if (fase === "resumen9") {
    resumen9();
  } else if (fase === "final") {
  document.getElementById("resumen").style.display = "block";
  document.getElementById("resultadoFinal").innerHTML = "";
  finalizar();
}
else {
    document.getElementById("juego").style.display = "block";
    renderTabla();
  }
 }

/* ================= CONTROL ================= */
function ocultarTodo() {
  ["setup","juego","resumen9","resumen","historial"]
    .forEach(id => {
      const e = document.getElementById(id);
      if (e) e.style.display = "none";
    });
}
function anularPartida() {
  if (!localStorage.getItem("partidaActual")) {
    alert("No hay partida activa");
    return;
  }

  if (!confirm("¿Anular partida actual?")) return;

  // 🔥 LIMPIAR PARTIDA
  localStorage.removeItem("partidaActual");

  // 🔥 LIMPIAR CAMPO
  campoActual = null;
  par = [];
  inicioHoyo = 1;
  ordenHoyos = [];

  // 🔥 LIMPIAR SELECT
  const select = document.getElementById("campoSelect");
  if (select) select.value = "";

  fase = "setup";
  guardarVista("setup");

  localStorage.removeItem("vistaActual");

  ocultarTodo();
  document.getElementById("setup").style.display = "block";
}

function nuevaPartida(){
  anularPartida();
}

window.onload = () => {
  cargarCampos();
  restaurar(); // 👈 SOLO restaurar, nada más
};

function sum(arr, from, to) {
  let s = 0;
  for (let i = from; i < to; i++) {
    s += arr[i] || 0;
  }
  return s;
}
function volverInicioDesdeHistorial() {
  guardarVista("setup");
  ocultarTodo();
  document.getElementById("setup").style.display = "block";
}
function pintarGolpe(golpes, parHoyo) {
  if (golpes === 0) return "";
  if (golpes < parHoyo) {
    return `<span class="bajo-par">${golpes}</span>`;
  }
  if (golpes > parHoyo) {
    return `<span class="sobre-par">${golpes}</span>`;
  }
  return `<span class="al-par">${golpes}</span>`;
}
function borrarPartidaDesdeHistorial(e) {
  e.preventDefault();
  e.stopPropagation();

  const index = Number(this.dataset.index);
  const historial = JSON.parse(localStorage.getItem("historial")) || [];

  if (!historial[index]) {
    alert("La partida no existe");
    return;
  }

  if (!confirm("¿Seguro que deseas borrar esta partida?")) return;

  historial.splice(index, 1);
  localStorage.setItem("historial", JSON.stringify(historial));

  verHistorial(); // refresca vista
}

