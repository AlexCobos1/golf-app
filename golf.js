/* ================= ESTADO GLOBAL ================= */

let jugadores = [];
let golpes = {};
let putts = {};
let par = [];

let hoyo = 1;
let fase = "setup"; // setup | juego | resumen9 | final
let vistaActual = "setup";

let campoActual = null;
let inicioHoyo = 1;
let ordenHoyos = [];

let fechaPartidaActual = null;
let vieneDeUltimoJuego = false;
let yaFinalizada = false;

/* ========= SEGURIDAD PAR ========= */
function getParSeguro(hoyoReal) {
  return par[hoyoReal - 1] ?? 0;
}

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
  campoActual = null;
  par = [];

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
  if (!nombre) return alert("Selecciona un campo");

  if (!confirm(`¿Borrar "${nombre}"?`)) return;

   const campos = JSON.parse(localStorage.getItem("campos")) || {};
   delete campos[nombre];
   localStorage.setItem("campos", JSON.stringify(campos));

   campoActual = null;
   par = [];
   select.value = "";
   cargarCampos();
}

/* ================= JUGADORES ================= */
function crearInputsJugadores() {
  const n = Number(document.getElementById("numPlayers").value);
  const cont = document.getElementById("jugadores");
  cont.innerHTML = "";
  for (let i = 1; i <= n; i++) {
    cont.innerHTML += `<input id="jugador_${i}" placeholder="Jugador ${i}" maxlength="20">`;
  }
}
crearInputsJugadores();

/* ================= JUEGO ================= */
function iniciarJuego() {
  fechaPartidaActual = new Date().toLocaleString();

  if (!campoActual || !par.length) {
    alert("Selecciona un campo");
    return;
  }

  jugadores = [];
  golpes = {};
  putts = {};

  for (let i of document.querySelectorAll("#jugadores input")) {
    if (!i.value.trim()) {
      alert("Completa todos los jugadores");
      return; // 🔧 antes era throw ""
    }
    jugadores.push(i.value.trim());
    golpes[i.value.trim()] = Array(18).fill(0);
    putts[i.value.trim()] = Array(18).fill(0);
  }

  inicioHoyo = Number(document.getElementById("inicioVuelta").value);
  ordenHoyos = inicioHoyo === 10
    ? [...Array.from({length:9},(_,i)=>i+10), ...Array.from({length:9},(_,i)=>i+1)]
    : Array.from({length:18},(_,i)=>i+1);

  hoyo = 1;
  fase = "juego";
  guardarVista("juego");
  guardarPartida();

  ocultarTodo();
  document.getElementById("juego").style.display = "block";
  renderTabla();
}

/* ================= rendertabla ================= */
function renderTabla() {

  // 🔒 SOLO ejecutar si estamos realmente jugando
  if (fase !== "juego") return;

  guardarVista("juego");

  const hoyoReal = ordenHoyos[hoyo - 1];

  document.getElementById("hoyoActual").textContent = hoyoReal;
  document.getElementById("parActual").textContent = `(Par ${par[hoyoReal - 1]})`;

  const t = document.getElementById("tablaGolpes");
  t.innerHTML = "";

  jugadores.forEach(j => {
    t.innerHTML += `
      <tr><th colspan="2">${j}</th></tr>
      <tr>
        <td>Golpes<br>
          <button onclick="modGolpe('${j}',-1)">−</button>
          <span>${golpes[j][hoyoReal - 1]}</span>
          <button onclick="modGolpe('${j}',1)">+</button>
        </td>
        <td>Putts<br>
          <button onclick="modPutt('${j}',-1)">−</button>
          <span>${putts[j][hoyoReal - 1]}</span>
          <button onclick="modPutt('${j}',1)">+</button>
        </td>
      </tr>`;
  });
}


/* === RESTO DEL ARCHIVO === */
                               /*--------------------------function modGolpe----------------------*/
function modGolpe(j, v) {
  if (!golpes[j]) {
    golpes[j] = Array(18).fill(0);
  }

  if (!putts[j]) {
    putts[j] = Array(18).fill(0);
  }

  const hoyoReal = ordenHoyos[hoyo - 1];

  golpes[j][hoyoReal - 1] = Math.max(0, golpes[j][hoyoReal - 1] + v);

  if (putts[j][hoyoReal - 1] > golpes[j][hoyoReal - 1]) {
    putts[j][hoyoReal - 1] = golpes[j][hoyoReal - 1];
  }

  guardarPartida();
  renderTabla();
}

                                     /*---------------------function modPutt------------------------*/
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

                                          /* =============function siguienteHoyo================= */
function siguienteHoyo(){
 const hoyoReal = ordenHoyos[hoyo - 1];

for (let j of jugadores) {
  if (golpes[j][hoyoReal - 1] === 0) {
    alert(`Faltan golpes en el hoyo ${hoyoReal}`);
    return;
  }
}

  if (hoyo === 9) return resumen9();
  if (hoyo === 18) {
  if (!confirm("¿Seguro que deseas terminar la partida?")) {
    return; // se queda en el hoyo 18
  }
  return finalizar();
}
  hoyo++;
  guardarPartida();
  renderTabla();
}
                               /*-----------------------function hoyoAnterior-----------------*/
function hoyoAnterior(){
  if (hoyo > 1) {
    hoyo--;
    guardarPartida();
    renderTabla();
  }
}

                                    /* =============function==== RESUMEN 9 ================= */
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
      const puttsTotal = sum(putts[j], 0, 9);

     hoyosVuelta1.forEach(h => {
      total += golpes[j][h - 1];
      html += `<td>${pintarGolpeConPutts(
        golpes[j][h - 1],
        putts[j][h - 1],
        par[h - 1]
      )}</td>`;

    });

    html += `
<td>
  ${total}
  <br><small>(${puttsTotal})</small>
</td>
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
                                                        /*------funcion continuarSegundoPar------*/
function continuarSegundoPar() {
  hoyo = 10; // índice 10 → hoyo real correcto
  fase = "juego";
  guardarPartida();
  ocultarTodo();
  document.getElementById("juego").style.display = "block";
  renderTabla();
}

                                                     /* ======funcion  FINALalizar ================= */
function finalizar() {
  if (fase === "final") {
    mostrarResumenFinal();
    return;
  }
  fase = "final";
  guardarVista("resumen");
  guardarPartida();
// 🔒 asegurar partidaActual final persistente
localStorage.setItem("partidaActual", JSON.stringify({
  jugadores,
  golpes,
  putts,
  par,
  campoActual,
  hoyo: 18,
  fase: "final",
  inicioHoyo,
  ordenHoyos,
  guardadaEnHistorial: true
  
}));
fechaPartidaActual = fechaPartidaActual || new Date().toLocaleString();

  guardarHistorial();

  const partida = JSON.parse(localStorage.getItem("partidaActual"));
   partida.guardadaEnHistorial = true;
   localStorage.setItem("partidaActual", JSON.stringify(partida));

    ocultarTodo();
  document.getElementById("resumen").style.display = "block";

  const par9_1 = sum(par, 0, 9);
  const par9_2 = sum(par, 9, 18);
  const par18 = par9_1 + par9_2;

  let h = "<table><tr><th>Jugador</th>";

  for (let i = 1; i <= 18; i++) h += `<th>${i}</th>`;

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

    const putts1_9 = sum(putts[j], 0, 9);
    const putts10_18 = sum(putts[j], 9, 18);
    const puttsTotal = putts1_9 + putts10_18;

    h += `<tr><td>${j}</td>`;

    for (let i = 0; i < 18; i++) {
      h += `<td>${pintarGolpeConPutts(
        golpes[j][i],
        putts[j][i],
        par[i]
      )}</td>`;
    }

    h += `
    <td>
  ${v1}
  <br><small>(${putts1_9})</small>
</td>
<td>
  ${v2}
  <br><small>(${putts10_18})</small>
</td>
<td>
  ${total}
  <br><small>(${puttsTotal})</small>
</td>
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
}

                                                        /* ======funcion  guardarHISTORIAL ================= */
function guardarHistorial() {
  const historial = JSON.parse(localStorage.getItem("historial")) || [];

  // 🚫 evitar duplicados
  if (historial.some(h => h.fecha === fechaPartidaActual)) return;

  const partida = {
    jugadores,
    golpes,
    putts,
    par,
    campoActual,
    inicioHoyo,
    ordenHoyos,
    fecha: fechaPartidaActual || new Date().toLocaleString()
  };

  historial.push(partida);
  localStorage.setItem("historial", JSON.stringify(historial));
}
                                         /*--------------------function verHistorial--------------------*/
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
      const putts1_9   = sum(p.putts[j], 0, 9);
      const putts10_18 = sum(p.putts[j], 9, 18);
      const puttsTotal = putts1_9 + putts10_18;


      html += `<tr><td>${j}</td>`;

      for (let k = 0; k < 18; k++) {
        html += `<td>${pintarGolpeConPutts(
         p.golpes[j][k],
         p.putts[j][k],
         p.par[k]
        )}</td>`;

      }

      html += `
        <td>
  ${v1}
  <br><small>(${putts1_9})</small>
</td>
<td>
  ${v2}
  <br><small>(${putts10_18})</small>
</td>
<td>
  ${total}
  <br><small>(${puttsTotal})</small>
</td>
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
                                                 /*-----------function salirHistorial---------------*/
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
                                          /*---------------function regresarInicio---------------*/
function regresarInicio() {
  if (!confirm("¿Seguro que deseas regresar al inicio?")) return;

  guardarVista("setup");
  ocultarTodo();
  document.getElementById("setup").style.display = "block";
}
                                  /*----------------------function verUltimoJuego--------------------*/
function verUltimoJuego() {
  const historial = JSON.parse(localStorage.getItem("historial")) || [];
  if (!historial.length) {
    alert("Sin partidas");
    return;
  }

  const ultima = historial[historial.length - 1];

  // 🔒 guardar como partida activa válida
  localStorage.setItem("partidaActual", JSON.stringify({
    jugadores: ultima.jugadores,
    golpes: ultima.golpes,
    putts: ultima.putts,
    par: ultima.par,
    campoActual: ultima.campoActual,
    inicioHoyo: ultima.inicioHoyo,
    ordenHoyos: ultima.ordenHoyos,
    hoyo: 18,
    fase: "final"
  }));
asegurarEstructuraGolpes();

  // 🔑 FORZAR vista correcta
  guardarVista("resumen");

  restaurar();
}
 
                                         /* =================function guardarPartida  ================= */
function guardarPartida() {
  const anterior = JSON.parse(localStorage.getItem("partidaActual")) || {};

  const partida = {
    ...anterior, // 👈 conserva fecha, guardadaEnHistorial, etc
    jugadores,
    golpes,
    putts,
    par,
    hoyo,
    fase,
    campoActual,
    inicioHoyo,
    ordenHoyos,
    fecha: fechaPartidaActual // 🔑
  };

  localStorage.setItem("partidaActual", JSON.stringify(partida));
}

                                      /*----------------function restaurar------------------*/
function restaurar() {
  const vista = localStorage.getItem("vistaActual") || "setup";
  const d = JSON.parse(localStorage.getItem("partidaActual"));

  ocultarTodo();
   if (vista === "setup") {
    document.getElementById("setup").style.display = "block";
    return;
  }

  if (vista === "historial") {
    document.getElementById("historial").style.display = "block";
    verHistorial();
    return;
  }

   if (!d) {
    document.getElementById("setup").style.display = "block";
    guardarVista("setup");
    return;
  }

  ({ jugadores, golpes, putts, par, hoyo, fase, campoActual } = d);

  inicioHoyo = d.inicioHoyo || 1;
  ordenHoyos = d.ordenHoyos || Array.from({ length: 18 }, (_, i) => i + 1);

  asegurarEstructuraGolpes(); // 🔧 antes estaba al final

  if (fase === "resumen9") {
    resumen9();
  } else if (fase === "final") {
    mostrarResumenFinal();
  } else {
    document.getElementById("juego").style.display = "block";
    renderTabla();
  }
}

                              /* ===============function== ocultartodo ================= */
function ocultarTodo() {
  ["setup","juego","resumen9","resumen","historial"]
    .forEach(id => {
      const e = document.getElementById(id);
      if (e) e.style.display = "none";
    });
}
                 /*-----------------------------function anularPartida-------------------*/
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
                          /*-----------------------function nuevaPartida---------------------*/
function nuevaPartida(){
  anularPartida();
}

window.onload = () => {
  cargarCampos();
  restaurar(); // 👈 SOLO restaurar, nada más
};
                              /*--------------------function sum--------------------------*/
function sum(arr, from, to) {
  let s = 0;
  for (let i = from; i < to; i++) s += arr[i] || 0;
  return s;
}

               /*------------------------------function volverInicioDesdeHistorial----------------------*/
function volverInicioDesdeHistorial() {
  guardarVista("setup");
  ocultarTodo();
  document.getElementById("setup").style.display = "block";
}
                          /*----------------------function pintarGolpeConPutts---------------------------*/
function pintarGolpeConPutts(golpes, putts, parHoyo) {
  if (golpes === 0) return "";
  let clase = "al-par";
  if (golpes < parHoyo) clase = "bajo-par";
  if (golpes > parHoyo) clase = "sobre-par";

  return `<span class="${clase}">${golpes}</span> <small>(${putts})</small>`;
}
                       /*---------------------function borrarPartidaDesdeHistorial----------------------------*/
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
                                         /*--------function mostrarResumenFinal--------------*/
function mostrarResumenFinal() {
  ocultarTodo();
  document.getElementById("resumen").style.display = "block";

  const par9_1 = sum(par, 0, 9);
  const par9_2 = sum(par, 9, 18);
  const par18 = par9_1 + par9_2;

  let html = "<table><tr><th>Jugador</th>";

  for (let i = 1; i <= 18; i++) html += `<th>${i}</th>`;

  html += `
    <th>1–9</th>
    <th>10–18</th>
    <th>Total</th>
    <th>+/-</th>
  </tr>`;

  jugadores.forEach(j => {
    const v1 = sum(golpes[j], 0, 9);
    const v2 = sum(golpes[j], 9, 18);
    const total = v1 + v2;

    html += `<tr><td>${j}</td>`;

    for (let i = 0; i < 18; i++) {
      html += `<td>${pintarGolpeConPutts(
        golpes[j][i],
        putts[j][i],
        par[i]
      )}</td>`;
    }

    html += `
      <td>${v1}<br><small>(${sum(putts[j],0,9)})</small></td>
      <td>${v2}<br><small>(${sum(putts[j],9,18)})</small></td>
      <td>${total}<br><small>(${sum(putts[j],0,18)})</small></td>

      <td>${total - par18 > 0 ? "+" : ""}${total - par18}</td>
      </tr>`;
  });

  html += `
    <tr class="par">
      <th>PAR</th>
      ${par.map(p => `<th>${p}</th>`).join("")}
      <th>${par9_1}</th>
      <th>${par9_2}</th>
      <th>${par18}</th>
      <th>0</th>
    </tr>
  </table>`;

  document.getElementById("resultadoFinal").innerHTML = html;
}

function asegurarEstructuraGolpes() {
  jugadores.forEach(j => {
    if (!golpes[j]) golpes[j] = Array(18).fill(0);
    if (!putts[j]) putts[j] = Array(18).fill(0);
  });
}
