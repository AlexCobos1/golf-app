
let jugadores = [];
let golpes = {};
let hoyo = 1;
let par = []; // Arreglo que contendrá el par de cada uno de los 18 hoyos


function crearInputsJugadores() {
  const cantidad = document.getElementById("numPlayers").value;
  const contenedor = document.getElementById("jugadores");
  contenedor.innerHTML = "";
  for (let i = 1; i <= cantidad; i++) {
    contenedor.innerHTML += `<input placeholder="Jugador ${i}" /><br>`;
  }
}

crearInputsJugadores();

function iniciarJuego() {

    // Solicitar par de cada hoyo
  par = [];
  for (let i = 1; i <= 18; i++) {
    let valor = prompt(`Ingrese el par del hoyo ${i} (ej: 3, 4 o 5):`, "4");
    par.push(Number(valor));
  }

  const inputs = document.querySelectorAll("#jugadores input");
  jugadores = [];
  golpes = {};

  inputs.forEach(input => {
    const nombre = input.value || "Jugador";
    jugadores.push(nombre);
    golpes[nombre] = Array(18).fill(0);
  });

  document.getElementById("setup").style.display = "none";
  document.getElementById("juego").style.display = "block";
  renderTabla();
  guardarPartida();

}

function renderTabla() {
  const tabla = document.getElementById("tablaGolpes");
  tabla.innerHTML = "";

  jugadores.forEach(nombre => {
    tabla.innerHTML += `
      <tr>
        <td>${nombre}</td>
        <td>
          <button onclick="modificarGolpe('${nombre}', 1)">+</button>
          ${golpes[nombre][hoyo-1]}
          <button onclick="modificarGolpe('${nombre}', -1)">-</button>
        </td>
      </tr>
    `;
  });
}

//modificar golpes

function modificarGolpe(jugador, valor) {
  golpes[jugador][hoyo-1] =
    Math.max(0, golpes[jugador][hoyo-1] + valor);
    guardarPartida();
    renderTabla();
  
}

function siguienteHoyo() {
  if (hoyo < 9) {
    // Seguimos normalmente
    hoyo++;
    document.getElementById("hoyoActual").innerText = hoyo;
    guardarPartida();
    renderTabla();
  } else if (hoyo === 9) {
    // Llegamos al descanso de 9 hoyos
    mostrarResumen9();
  } else if (hoyo < 18) {
    // Segunda mitad de la partida
    hoyo++;
    document.getElementById("hoyoActual").innerText = hoyo;
    guardarPartida();
    renderTabla();
  } else if (hoyo === 18) {
    // Último hoyo: preguntar confirmación
    const confirmar = confirm(
      "¡Estás en el hoyo 18!\n¿Seguro que deseas finalizar la partida?"
    );
    if (!confirmar) return;

    // Marcar la partida como terminada
    guardarPartida(true);
    finalizarJuego();
  }
}
// resumen de primera vuelta
function mostrarResumen9() {
  document.getElementById("juego").style.display = "none";
  const resumenDiv = document.getElementById("resumen9");
  resumenDiv.style.display = "block";

  const tabla = document.getElementById("tablaResumen9");
  tabla.innerHTML = ""; // limpiar contenido

  // Crear tabla HTML
  let html = "<table border='1' style='border-collapse: collapse; width: 100%; text-align: center;'>";
  
  // Cabecera: Hoyos y Par
  html += "<tr><th>Jugador</th>";
  for (let i = 0; i < 9; i++) {
    html += `<th>H${i+1}<br>Par ${par[i]}</th>`;
  }

  // Total de par para los primeros 9 hoyos
  const totalPar9 = par.slice(0, 9).reduce((a, b) => a + b, 0);
  html += `<th>Total</th><th>Vs Par</th></tr>`;

  // Filas de cada jugador
  jugadores.forEach(nombre => {
    const primeros9 = golpes[nombre].slice(0, 9);
    const total9 = primeros9.reduce((a, b) => a + b, 0);
    const vsPar = total9 - totalPar9;
    const vsParText = vsPar === 0 ? "E" : vsPar > 0 ? `+${vsPar}` : `${vsPar}`;

    html += `<tr><td>${nombre}</td>`;
    for (let i = 0; i < 9; i++) {
      html += `<td>${primeros9[i]}</td>`;
    }
    html += `<td><strong>${total9}</strong></td><td>${vsParText}</td></tr>`;
  });

  // Fila final: total del par
  html += "<tr><td><strong>Par Total</strong></td>";
  for (let i = 0; i < 9; i++) {
    html += `<td>${par[i]}</td>`;
  }
  html += `<td><strong>${totalPar9}</strong></td><td>-</td></tr>`;

  html += "</table>";

  tabla.innerHTML = html;

  // Guardar estado de resumen parcial
  guardarPartida(false, true);
}
//pasar a segunda vuela
function continuarSegundoPar() {
  document.getElementById("resumen9").style.display = "none";
  document.getElementById("juego").style.display = "block";

  hoyo = 10; // empezamos el hoyo 10
  document.getElementById("hoyoActual").innerText = hoyo;
  renderTabla();

  // Guardar partida sin resumen parcial
  guardarPartida(false, false);
}

function finalizarJuego() {
  console.log("=== VERIFICAR VARIABLES ===");
  console.log("Hoyo actual:", hoyo);
  console.log("Jugadores:", jugadores);
  console.log("Golpes:", golpes);
  console.log("Par:", par);

  // Ocultar secciones anteriores
  document.getElementById("setup").style.display = "none";
  document.getElementById("juego").style.display = "none";
  document.getElementById("resumen9").style.display = "none";

  // Mostrar resumen final
  document.getElementById("resumen").style.display = "block";

  const div = document.getElementById("resultadoFinal");
  div.innerHTML = "";

  // Construir tabla de resumen final igual al de los primeros 9 hoyos
  let html = "<table border='1' style='border-collapse: collapse; width: 100%; text-align: center;'>";
  html += "<tr><th>Jugador</th>";
  for (let i = 0; i < 18; i++) html += `<th>H${i+1}<br>Par${par[i]}</th>`;

  const totalPar = par.reduce((a,b)=>a+b,0);
  html += "<th>Total</th><th>Vs Par</th></tr>";

  // Filas por jugador
  jugadores.forEach(nombre => {
    let totalJugador = golpes[nombre].reduce((a,b)=>a+b,0);
    const vsPar = totalJugador - totalPar;
    const vsParText = vsPar===0?"E":vsPar>0?`+${vsPar}`:vsPar;

    let fila = `<tr><td>${nombre}</td>`;
    for (let i = 0; i < 18; i++) fila += `<td>${golpes[nombre][i]}</td>`;
    fila += `<td>${totalJugador}</td><td>${vsParText}</td></tr>`;
    html += fila;
  });

  // Fila Par Total
  html += `<tr><td><strong>Par Total</strong></td>`;
  for (let i=0;i<18;i++) html += `<td>${par[i]}</td>`;
  html += `<td>${totalPar}</td><td>-</td></tr>`;

  html += "</table>";
  div.innerHTML = html;
  agregarAHistorial(); // esto guarda la partida en localStorage
}

// guarda la partida
function guardarPartida(terminada = false, resumen9 = false) {
  localStorage.setItem("golf_partida", JSON.stringify({
    jugadores,
    golpes,
    hoyo,
    terminada,
    resumen9,
    par
  }));
}

function cargarPartida() {
  const data = localStorage.getItem("golf_partida");

  if (!data) {
    document.getElementById("setup").style.display = "block";
    document.getElementById("juego").style.display = "none";
    document.getElementById("resumen").style.display = "none";
    document.getElementById("resumen9").style.display = "none";
    return;
  }

  const partida = JSON.parse(data);
  jugadores = partida.jugadores || [];
  golpes = partida.golpes || {};
  par = partida.par || Array(18).fill(4);
  hoyo = partida.hoyo || 1;

  if (partida.terminada) {
    // Partida finalizada
    document.getElementById("setup").style.display = "none";
    document.getElementById("juego").style.display = "none";
    document.getElementById("resumen").style.display = "block";
    finalizarJuego();
  } else if (partida.resumen9) {
    // Mostrar resumen de los primeros 9 hoyos
    document.getElementById("setup").style.display = "none";
    document.getElementById("juego").style.display = "none";
    document.getElementById("resumen").style.display = "none";
    document.getElementById("resumen9").style.display = "block";
    mostrarResumen9();
  } else {
    // Partida en curso
    document.getElementById("setup").style.display = "none";
    document.getElementById("juego").style.display = "block";
    document.getElementById("resumen").style.display = "none";
    document.getElementById("resumen9").style.display = "none";
    document.getElementById("hoyoActual").innerText = hoyo;
    renderTabla();
  }
}
//reinicia la partida

function reiniciarPartida() {
  localStorage.removeItem("golf_partida");
  location.reload();
}

window.onload = cargarPartida;

function nuevaPartida() {
  localStorage.removeItem("golf_partida");
  location.reload();
}

function verHistorial() {
  alert("Historial en construcción");
}

function anularPartida() {
  const confirmar = confirm(
    "¿Seguro que deseas anular la partida actual?\nSe perderán los datos."
  );

  if (!confirmar) return;

  localStorage.removeItem("golf_partida");
  location.reload();
}

function hoyoAnterior() {
  if (hoyo > 1) {
    const confirmar = confirm(
      "¿Seguro que quieres volver al hoyo anterior?\n" +
      "Podrás modificar los golpes ya registrados."
    );
    if (!confirmar) return;

    hoyo--;
    document.getElementById("hoyoActual").innerText = hoyo;
    renderTabla();
    guardarPartida();
  } else {
    alert("Este es el primer hoyo, no se puede retroceder más.");
  }
}
function continuarSegundoPar() {
  document.getElementById("resumen9").style.display = "none";
  document.getElementById("juego").style.display = "block";

  hoyo = 10; // Inicia el hoyo 10
  document.getElementById("hoyoActual").innerText = hoyo;
  renderTabla();
  guardarPartida();
}
// Al cargar la página, verificar si hay partida guardada
window.onload = function() {
  cargarPartida();

}
// Guardar la partida actual en historial
function agregarAHistorial() {
  const historial = JSON.parse(localStorage.getItem("historial")) || [];
  const partida = {
    fecha: new Date().toLocaleString(),
    jugadores: [...jugadores],
    golpes: {...golpes},
    par: [...par]
  };
  historial.push(partida);
  localStorage.setItem("historial", JSON.stringify(historial));
}

function verHistorial() {
  const historial = JSON.parse(localStorage.getItem("historial")) || [];
  if(historial.length === 0){
    alert("No hay partidas en el historial");
    return;
  }

  // Limpiar pantalla y mostrar historial
  document.getElementById("setup").style.display = "none";
  document.getElementById("juego").style.display = "none";
  document.getElementById("resumen9").style.display = "none";
  document.getElementById("resumen").style.display = "block";

  const div = document.getElementById("resultadoFinal");
  div.innerHTML = "<h4>Historial de partidas</h4>";

  historial.forEach((partida, index) => {
    let html = `<h5>Partida ${index+1} - ${partida.fecha}</h5>`;
    html += "<table border='1' style='border-collapse: collapse; width: 100%; text-align: center;'>";
    html += "<tr><th>Jugador</th>";
    for(let i=0;i<partida.par.length;i++) html += `<th>H${i+1}<br>Par${partida.par[i]}</th>`;
    const totalPar = partida.par.reduce((a,b)=>a+b,0);
    html += "<th>Total</th><th>Vs Par</th></tr>";

    partida.jugadores.forEach(nombre => {
      let totalJugador = partida.golpes[nombre].reduce((a,b)=>a+b,0);
      const vsPar = totalJugador - totalPar;
      const vsParText = vsPar===0?"E":vsPar>0?`+${vsPar}`:vsPar;

      let fila = `<tr><td>${nombre}</td>`;
      for (let i=0;i<partida.par.length;i++) fila += `<td>${partida.golpes[nombre][i]}</td>`;
      fila += `<td>${totalJugador}</td><td>${vsParText}</td></tr>`;
      html += fila;
    });

    // Par total
    html += `<tr><td><strong>Par Total</strong></td>`;
    for(let i=0;i<partida.par.length;i++) html += `<td>${partida.par[i]}</td>`;
    html += `<td>${totalPar}</td><td>-</td></tr>`;

    html += "</table><hr>";
    div.innerHTML += html;
  });
}
function borrarHistorial() {
  const confirmar = confirm("¿Seguro que deseas borrar todo el historial?");
  if(!confirmar) return;

  localStorage.removeItem("historial");  // elimina todas las partidas
  alert("Historial eliminado");
  location.reload(); // recarga la página para limpiar la interfaz
}
function verUltimoJuego() {
  const historial = JSON.parse(localStorage.getItem("historial")) || [];
  
  if(historial.length === 0){
    alert("No hay partidas registradas todavía");
    return;
  }

  const ultimo = historial[historial.length - 1]; // toma la última partida

  document.getElementById("setup").style.display = "none";
  document.getElementById("juego").style.display = "none";
  document.getElementById("resumen9").style.display = "none";
  document.getElementById("resumen").style.display = "block";

  const div = document.getElementById("resultadoFinal");
  div.innerHTML = `<h4>Último juego - ${ultimo.fecha}</h4>`;

  // Construir tabla igual al resumen final
  let html = "<table border='1' style='border-collapse: collapse; width: 100%; text-align: center;'>";
  html += "<tr><th>Jugador</th>";
  for(let i=0;i<ultimo.par.length;i++) html += `<th>H${i+1}<br>Par${ultimo.par[i]}</th>`;
  const totalPar = ultimo.par.reduce((a,b)=>a+b,0);
  html += "<th>Total</th><th>Vs Par</th></tr>";

  ultimo.jugadores.forEach(nombre => {
    const totalJugador = ultimo.golpes[nombre].reduce((a,b)=>a+b,0);
    const vsPar = totalJugador - totalPar;
    const vsParText = vsPar===0 ? "E" : vsPar > 0 ? `+${vsPar}` : vsPar;

    let fila = `<tr><td>${nombre}</td>`;
    for(let i=0;i<ultimo.par.length;i++) fila += `<td>${ultimo.golpes[nombre][i]}</td>`;
    fila += `<td>${totalJugador}</td><td>${vsParText}</td></tr>`;
    html += fila;
  });

  html += `<tr><td><strong>Par Total</strong></td>`;
  for(let i=0;i<ultimo.par.length;i++) html += `<td>${ultimo.par[i]}</td>`;
  html += `<td>${totalPar}</td><td>-</td></tr>`;
  html += "</table>";

  div.innerHTML += html;

}

