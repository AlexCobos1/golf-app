let jugadores = [];
let golpes = {};
let putts = {};
let par = [];
let hoyo = 1;

/* ================= SETUP ================= */

function crearInputsJugadores() {
  const n = document.getElementById("numPlayers").value;
  const cont = document.getElementById("jugadores");
  cont.innerHTML = "";
  for (let i = 1; i <= n; i++) {
    cont.innerHTML += `<input placeholder="Jugador ${i}"><br>`;
  }
}
crearInputsJugadores();

/* ================= INICIO ================= */

function iniciarJuego() {
  jugadores = [];
  golpes = {};
  putts = {};
  par = [];

  for (let i = 1; i <= 18; i++) {
    par.push(Number(prompt(`Par del hoyo ${i}`, "4")));
  }

  document.querySelectorAll("#jugadores input").forEach(i => {
    const nombre = i.value || "Jugador";
    jugadores.push(nombre);
    golpes[nombre] = Array(18).fill(0);
    putts[nombre] = Array(18).fill(0);
  });

  hoyo = 1;
  document.getElementById("setup").style.display = "none";
  document.getElementById("juego").style.display = "block";
  renderTabla();
}

/* ================= TABLA ================= */

function renderTabla() {
  document.getElementById("tituloHoyo").innerHTML =
    `Hoyo ${hoyo} <small>(Par ${par[hoyo - 1]})</small>`;

  const tabla = document.getElementById("tablaGolpes");
  tabla.innerHTML = "";

  jugadores.forEach(nombre => {
    const g = golpes[nombre][hoyo - 1];
    const p = putts[nombre][hoyo - 1];

    tabla.innerHTML += `
      <tr>
        <td colspan="2" class="nombreJugador">${nombre}</td>
      </tr>
      <tr>
        <td>
          Golpes<br>
          <button onclick="modificarGolpe('${nombre}',-1)">−</button>
          <span>${g}</span>
          <button onclick="modificarGolpe('${nombre}',1)">+</button>
        </td>
        <td>
          Putts<br>
          <button onclick="modificarPutt('${nombre}',-1)">−</button>
          <span>${p}</span>
          <button onclick="modificarPutt('${nombre}',1)">+</button>
        </td>
      </tr>
    `;
  });
}

/* ================= MODIFICAR ================= */

function modificarGolpe(j, v) {
  golpes[j][hoyo - 1] = Math.max(0, golpes[j][hoyo - 1] + v);
  renderTabla();
}

function modificarPutt(j, v) {
  putts[j][hoyo - 1] = Math.max(0, putts[j][hoyo - 1] + v);
  renderTabla();
}

/* ================= NAVEGACIÓN ================= */

function siguienteHoyo() {
  if (hoyo === 9) return mostrarResumen9();
  if (hoyo < 18) {
    hoyo++;
    renderTabla();
  } else {
    finalizarJuego();
  }
}

function hoyoAnterior() {
  if (hoyo > 1) {
    hoyo--;
    renderTabla();
  }
}

/* ================= RESUMEN 9 ================= */

function mostrarResumen9() {
  document.getElementById("juego").style.display = "none";
  document.getElementById("resumen9").style.display = "block";

  let html = "<table><tr><th>Jugador</th><th>Golpes</th><th>Putts</th></tr>";
  jugadores.forEach(j => {
    html += `
      <tr>
        <td>${j}</td>
        <td>${suma(golpes[j], 0, 9)}</td>
        <td>${suma(putts[j], 0, 9)}</td>
      </tr>`;
  });
  html += "</table>";
  document.getElementById("tablaResumen9").innerHTML = html;
}

function continuarSegundoPar() {
  document.getElementById("resumen9").style.display = "none";
  document.getElementById("juego").style.display = "block";
  hoyo = 10;
  renderTabla();
}

/* ================= FINAL ================= */

function finalizarJuego() {
  document.getElementById("juego").style.display = "none";
  document.getElementById("resumen").style.display = "block";

  let html = "<table><tr><th>Jugador</th><th>Golpes</th><th>Putts</th></tr>";
  jugadores.forEach(j => {
    html += `
      <tr>
        <td>${j}</td>
        <td>${suma(golpes[j], 0, 18)}</td>
        <td>${suma(putts[j], 0, 18)}</td>
      </tr>`;
  });
  html += "</table>";

  document.getElementById("resultadoFinal").innerHTML = html;
  guardarHistorial();
}

/* ================= HISTORIAL ================= */

function guardarHistorial() {
  const h = JSON.parse(localStorage.getItem("historial")) || [];
  h.push({
    fecha: new Date().toLocaleString(),
    jugadores: [...jugadores],
    golpes: JSON.parse(JSON.stringify(golpes)),
    putts: JSON.parse(JSON.stringify(putts)),
    par: [...par]
  });
  localStorage.setItem("historial", JSON.stringify(h));
}

function verHistorial() {
  const h = JSON.parse(localStorage.getItem("historial")) || [];
  if (!h.length) return alert("No hay historial");

  let html = "";
  h.forEach(p => {
    html += `<h4>${p.fecha}</h4><table>
      <tr><th>Jugador</th><th>Golpes</th><th>Putts</th></tr>`;
    p.jugadores.forEach(j => {
      html += `
        <tr>
          <td>${j}</td>
          <td>${suma(p.golpes[j], 0, 18)}</td>
          <td>${suma(p.putts[j], 0, 18)}</td>
        </tr>`;
    });
    html += "</table>";
  });

  document.getElementById("setup").style.display = "none";
  document.getElementById("resumen").style.display = "block";
  document.getElementById("resultadoFinal").innerHTML = html;
}

function verUltimoJuego() {
  const h = JSON.parse(localStorage.getItem("historial")) || [];
  if (!h.length) return alert("No hay juegos");

  const p = h[h.length - 1];
  let html = `<h4>${p.fecha}</h4><table>
    <tr><th>Jugador</th><th>Golpes</th><th>Putts</th></tr>`;
  p.jugadores.forEach(j => {
    html += `
      <tr>
        <td>${j}</td>
        <td>${suma(p.golpes[j], 0, 18)}</td>
        <td>${suma(p.putts[j], 0, 18)}</td>
      </tr>`;
  });
  html += "</table>";

  document.getElementById("setup").style.display = "none";
  document.getElementById("resumen").style.display = "block";
  document.getElementById("resultadoFinal").innerHTML = html;
}

function borrarHistorial() {
  if (confirm("¿Borrar todo el historial?")) {
    localStorage.removeItem("historial");
    alert("Historial eliminado");
  }
}

function anularPartida() {
  if (confirm("¿Anular partida actual?")) location.reload();
}

/* ================= UTILS ================= */

function suma(arr, a, b) {
  return arr.slice(a, b).reduce((x, y) => x + y, 0);
}

function nuevaPartida() {
  location.reload();
}
