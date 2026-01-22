let jugadores = [];
let golpes = {};
let putts = {};
let par = [];
let hoyo = 1;
let fase = "setup";

/* ====== SETUP ====== */
function crearInputsJugadores() {
  const n = Number(document.getElementById("numPlayers").value);
  const cont = document.getElementById("jugadores");

  cont.innerHTML = "";

  for (let i = 1; i <= n; i++) {
    cont.innerHTML += `
      <input
        type="text"
        id="jugador_${i}"
        placeholder="Jugador ${i}"
        required
        maxlength="20"
      >
    `;
  }
}

crearInputsJugadores();

/* ====== INICIAR ====== */
function iniciarJuego() {
  jugadores = [];
  golpes = {};
  putts = {};
  par = [];

  const inputs = document.querySelectorAll("#jugadores input");

  for (let i of inputs) {
    if (!i.value || i.value.trim() === "") {
      alert("Debes ingresar el nombre de todos los jugadores");
      return; // ⛔ NO continúa
    }
  }


  for (let i = 1; i <= 18; i++) {
    let p;
    do {
      p = Number(prompt(`Par del hoyo ${i} (3, 4 o 5)`, "4"));
    } while (![3,4,5].includes(p));
    par.push(p);
  }

  inputs.forEach(i => {
    const n = i.value.trim();
    jugadores.push(n);
    golpes[n] = Array(18).fill(0);
    putts[n] = Array(18).fill(0);
  });

  hoyo = 1;
  fase = "juego";
  guardarPartida();

  document.getElementById("setup").style.display = "none";
  document.getElementById("juego").style.display = "block";
  renderTabla();
}

/* ====== TABLA ====== */
function renderTabla() {
  document.getElementById("hoyoActual").textContent = hoyo;
  const t = document.getElementById("tablaGolpes");
  t.innerHTML = "";

  jugadores.forEach(j => {
    t.innerHTML += `
      <tr><th colspan="2">${j}</th></tr>
      <tr>
        <td>
          Golpes<br>
          <button onclick="modificarGolpe('${j}',-1)">−</button>
          ${golpes[j][hoyo-1]}
          <button onclick="modificarGolpe('${j}',1)">+</button>
        </td>
        <td>
          Putts<br>
          <button onclick="modificarPutt('${j}',-1)">−</button>
          ${putts[j][hoyo-1]}
          <button onclick="modificarPutt('${j}',1)">+</button>
        </td>
      </tr>`;
  });
}

function modificarGolpe(j, v) {
  const i = hoyo - 1;
  golpes[j][i] = Math.max(0, golpes[j][i] + v);

  // Putts nunca mayores que golpes
  if (putts[j][i] > golpes[j][i]) {
    putts[j][i] = golpes[j][i];
  }

  guardarPartida();   // ✅ CORREGIDO
  renderTabla();
}

function modificarPutt(j, v) {
  const i = hoyo - 1;
  const nuevo = putts[j][i] + v;

  if (nuevo < 0) return;

  if (nuevo > golpes[j][i]) {
    alert("Los putts no pueden ser mayores que los golpes totales del hoyo");
    return;
  }

  putts[j][i] = nuevo;
  guardarPartida();   // ✅ CORREGIDO
  renderTabla();
}


/* ====== NAVEGACIÓN ====== */
function siguienteHoyo() {
  // Validar golpes antes de avanzar
  for (let j of jugadores) {
    if (golpes[j][hoyo - 1] === 0) {
      alert(`Debes registrar los golpes del hoyo ${hoyo} para todos los jugadores`);
      return; // ⛔ NO avanza
    }
  }

  if (hoyo === 9) return resumen9();

  if (hoyo === 18) {
    if (confirm("¿Finalizar la partida y ver resultados?")) {
      finalizar();
    }
    return;
  }

  hoyo++;
  guardarPartida();
  renderTabla();
}

function hoyoAnterior(){
  if(hoyo>1){hoyo--; guardarPartida(); renderTabla();}
}

/* ====== RESUMEN 9 ====== */
function resumen9(){
  fase="resumen9"; guardarPartida();
  document.getElementById("juego").style.display="none";
  document.getElementById("resumen9").style.display="block";

  let h="<table><tr><th>Jugador</th><th>Golpes</th><th>Putts</th></tr>";
  jugadores.forEach(j=>{
    h+=`<tr><td>${j}</td><td>${sum(golpes[j],0,9)}</td><td>${sum(putts[j],0,9)}</td></tr>`;
  });
  h+="</table>";
  document.getElementById("tablaResumen9").innerHTML=h;
}
function continuarSegundoPar(){
  hoyo=10; fase="juego"; guardarPartida();
  document.getElementById("resumen9").style.display="none";
  document.getElementById("juego").style.display="block";
  renderTabla();
}

/* ====== FINAL ====== */
function finalizar(){
  fase="final"; guardarPartida();
  document.getElementById("juego").style.display="none";
  document.getElementById("resumen").style.display="block";

  let h="<table><tr><th>Jugador</th><th>Golpes</th><th>Putts</th></tr>";
  jugadores.forEach(j=>{
    h+=`<tr><td>${j}</td><td>${sum(golpes[j],0,18)}</td><td>${sum(putts[j],0,18)}</td></tr>`;
  });
  h+="</table>";
  document.getElementById("resultadoFinal").innerHTML=h;
  guardarHistorial();
}

/* ====== STORAGE ====== */
function guardarPartida(){
  localStorage.setItem("partidaActual",JSON.stringify({jugadores,golpes,putts,par,hoyo,fase}));
}
function restaurar(){
  const d=JSON.parse(localStorage.getItem("partidaActual"));
  if(!d) return;
  ({jugadores,golpes,putts,par,hoyo,fase}=d);
  document.getElementById("setup").style.display="none";
  if(fase==="resumen9") resumen9();
  else if(fase==="final") finalizar();
  else{document.getElementById("juego").style.display="block"; renderTabla();}
}
window.onload=restaurar;

/* ====== HISTORIAL ====== */
function guardarHistorial(){
  const h=JSON.parse(localStorage.getItem("historial"))||[];
  h.push({fecha:new Date().toLocaleString(),jugadores,golpes,putts,par});
  localStorage.setItem("historial",JSON.stringify(h));
}
function verHistorial() {
  const historial = JSON.parse(localStorage.getItem("historial")) || [];

  if (historial.length === 0) {
    alert("Sin historial");
    return;
  }

  // Ocultar todas las vistas
  document.getElementById("setup").style.display = "none";
  document.getElementById("juego").style.display = "none";
  document.getElementById("resumen9").style.display = "none";
  document.getElementById("resumen").style.display = "block";

  let html = "";

  historial.forEach((p, idx) => {
    html += `
      <h4>Partida ${idx + 1} – ${p.fecha}</h4>
      <table>
        <tr>
          <th>Jugador</th>
          <th>Golpes</th>
          <th>Putts</th>
        </tr>
    `;

    p.jugadores.forEach(j => {
      html += `
        <tr>
          <td>${j}</td>
          <td>${sum(p.golpes[j], 0, 18)}</td>
          <td>${sum(p.putts[j], 0, 18)}</td>
        </tr>
      `;
    });

    html += "</table><br>";
  });

  document.getElementById("resultadoFinal").innerHTML = html;
}

function verUltimoJuego(){
  const h=JSON.parse(localStorage.getItem("historial"))||[];
  if(!h.length) return alert("Sin partidas");
  const p=h[h.length-1];
  let r=`<h4>${p.fecha}</h4><table>`;
  p.jugadores.forEach(j=>{
    r+=`<tr><td>${j}</td><td>${sum(p.golpes[j],0,18)}</td><td>${sum(p.putts[j],0,18)}</td></tr>`;
  });
  r+="</table>";
  document.getElementById("setup").style.display="none";
  document.getElementById("resumen").style.display="block";
  document.getElementById("resultadoFinal").innerHTML=r;
}
function borrarHistorial() {
  if (confirm("¿Borrar todo el historial?")) {
    localStorage.removeItem("historial");
    alert("Historial eliminado");
  }
}



/* ====== UTILS ====== */
function sum(a,i,f){return a.slice(i,f).reduce((x,y)=>x+y,0);}
function nuevaPartida(){localStorage.removeItem("partidaActual");location.reload();}
function anularPartida(){if(confirm("¿Anular partida?")) nuevaPartida();}
