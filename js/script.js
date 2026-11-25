const USUARIO_DEMO = "kinghotel@gmail.com";
const CLAVE_DEMO = "king1234";

const precios = {
  "Individual": 180,
  "Doble": 280,
  "Familiar": 420,
  "Suite": 550
};

const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const reservationForm = document.getElementById("reservationForm");
const entrada = document.getElementById("entrada");
const salida = document.getElementById("salida");
const habitacion = document.getElementById("habitacion");
const reservasKey = "hotelParaisoReservas";

let reservas = JSON.parse(localStorage.getItem(reservasKey) || "[]");

// LOGIN: comprueba que los campos estén completos y sean correctos.
loginForm.addEventListener("submit", function(event) {
  event.preventDefault();
  const usuario = document.getElementById("usuario").value.trim();
  const contrasena = document.getElementById("contrasena").value;

  if (usuario === "" || contrasena === "") {
    loginError.textContent = "Completa el usuario y la contraseña.";
    return;
  }

  if (usuario === USUARIO_DEMO && contrasena === CLAVE_DEMO) {
    loginError.textContent = "";
    loginSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    mostrarDatos();
  } else {
    loginError.textContent = "Usuario o contraseña incorrectos.";
  }
});

document.getElementById("logoutBtn").addEventListener("click", function() {
  appSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
  loginForm.reset();
});

// NAVEGACIÓN ENTRE LAS SECCIONES.
function mostrarSeccion(nombre) {
  document.querySelectorAll(".page-section").forEach(function(seccion) {
    seccion.classList.add("hidden");
  });
  const seleccionada = document.getElementById(nombre);
  if (seleccionada) seleccionada.classList.remove("hidden");

  document.querySelectorAll(".nav-link").forEach(function(enlace) {
    enlace.classList.toggle("active", enlace.dataset.section === nombre);
  });
}

document.querySelectorAll(".nav-link").forEach(function(enlace) {
  enlace.addEventListener("click", function(event) {
    event.preventDefault();
    mostrarSeccion(enlace.dataset.section);
  });
});

document.querySelectorAll("[data-go]").forEach(function(boton) {
  boton.addEventListener("click", function() {
    mostrarSeccion(boton.dataset.go);
  });
});

// CÁLCULO DEL PRECIO SEGÚN LAS NOCHES Y EL TIPO DE HABITACIÓN.
function calcularTotal() {
  const tipo = habitacion.value;
  const fechaEntrada = new Date(entrada.value + "T00:00:00");
  const fechaSalida = new Date(salida.value + "T00:00:00");
  const noches = Math.round((fechaSalida - fechaEntrada) / (1000 * 60 * 60 * 24));

  if (tipo && entrada.value && salida.value && noches > 0) {
    const total = noches * precios[tipo];
    document.getElementById("totalEstimado").textContent = "Bs " + total;
    document.getElementById("nochesTexto").textContent = noches + (noches === 1 ? " noche" : " noches") + " × Bs " + precios[tipo];
    return { noches: noches, total: total };
  }

  document.getElementById("totalEstimado").textContent = "Bs 0";
  document.getElementById("nochesTexto").textContent = "Selecciona fechas válidas y habitación.";
  return null;
}

[entrada, salida, habitacion].forEach(function(campo) {
  campo.addEventListener("change", calcularTotal);
});

// No permite seleccionar fechas anteriores al día actual.
const hoy = new Date();
const fechaHoy = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0") + "-" + String(hoy.getDate()).padStart(2, "0");
entrada.min = fechaHoy;
salida.min = fechaHoy;
entrada.addEventListener("change", function() {
  salida.min = entrada.value || fechaHoy;
  if (salida.value && salida.value <= entrada.value) salida.value = "";
  calcularTotal();
});

// GUARDAR UNA RESERVA.
reservationForm.addEventListener("submit", function(event) {
  event.preventDefault();
  const mensaje = document.getElementById("reservationMessage");
  const calculo = calcularTotal();

  if (!reservationForm.checkValidity()) {
    reservationForm.reportValidity();
    return;
  }
  if (!calculo) {
    mensaje.textContent = "La fecha de salida debe ser posterior a la fecha de entrada.";
    mensaje.className = "form-message error";
    return;
  }

  const reserva = {
    id: Date.now(),
    nombre: document.getElementById("nombre").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    documento: document.getElementById("documento").value.trim(),
    habitacion: habitacion.value,
    huespedes: document.getElementById("huespedes").value,
    entrada: entrada.value,
    salida: salida.value,
    total: calculo.total
  };

  reservas.push(reserva);
  guardarReservas();
  reservationForm.reset();
  document.getElementById("huespedes").value = 1;
  salida.min = fechaHoy;
  calcularTotal();
  mensaje.textContent = "¡Reserva guardada correctamente!";
  mensaje.className = "form-message success";
  mostrarDatos();
});

function guardarReservas() {
  localStorage.setItem(reservasKey, JSON.stringify(reservas));
}

function fechaBonita(fecha) {
  if (!fecha) return "-";
  const partes = fecha.split("-");
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

// ACTUALIZAR TABLAS Y CONTADORES.
function mostrarDatos() {
  document.getElementById("totalReservas").textContent = reservas.length;
  document.getElementById("totalClientes").textContent = new Set(reservas.map(r => r.correo.toLowerCase())).size;
  document.getElementById("habitacionesDisponibles").textContent = Math.max(0, 8 - reservas.length);

  const recientes = reservas.slice(-5).reverse();
  document.getElementById("recentTable").innerHTML = recientes.length ? recientes.map(r =>
    `<tr><td><strong>${escapar(r.nombre)}</strong></td><td>${escapar(r.habitacion)}</td><td>${fechaBonita(r.entrada)}</td><td>${fechaBonita(r.salida)}</td><td><span class="status">Registrada</span></td></tr>`
  ).join("") : '<tr><td colspan="5" class="empty">Todavía no hay reservas.</td></tr>';

  dibujarReservas(reservas);
  dibujarClientes();
}

function dibujarReservas(lista) {
  const tabla = document.getElementById("reservationsTable");
  tabla.innerHTML = lista.length ? lista.map(r =>
    `<tr><td><strong>${escapar(r.nombre)}</strong></td><td>${escapar(r.correo)}<br>${escapar(r.telefono)}</td><td>${escapar(r.habitacion)}</td><td>${fechaBonita(r.entrada)}</td><td>${fechaBonita(r.salida)}</td><td><strong>Bs ${r.total}</strong></td><td><button class="delete-btn" onclick="eliminarReserva(${r.id})">Eliminar</button></td></tr>`
  ).join("") : '<tr><td colspan="7" class="empty">Todavía no hay reservas.</td></tr>';
}

function dibujarClientes() {
  const clientes = [];
  const vistos = new Set();
  reservas.forEach(function(r) {
    const correo = r.correo.toLowerCase();
    if (!vistos.has(correo)) {
      vistos.add(correo);
      clientes.push(r);
    }
  });
  document.getElementById("clientsTable").innerHTML = clientes.length ? clientes.map(r =>
    `<tr><td><strong>${escapar(r.nombre)}</strong></td><td>${escapar(r.correo)}</td><td>${escapar(r.telefono)}</td><td>${escapar(r.documento || "-")}</td></tr>`
  ).join("") : '<tr><td colspan="4" class="empty">Todavía no hay clientes.</td></tr>';
}

function eliminarReserva(id) {
  if (confirm("¿Seguro que deseas eliminar esta reserva?")) {
    reservas = reservas.filter(r => r.id !== id);
    guardarReservas();
    mostrarDatos();
  }
}

// BÚSQUEDA DE RESERVAS POR NOMBRE.
document.getElementById("buscarReserva").addEventListener("input", function() {
  const texto = this.value.toLowerCase();
  const filtradas = reservas.filter(r => r.nombre.toLowerCase().includes(texto));
  dibujarReservas(filtradas);
});

// Evita insertar etiquetas HTML si se escriben caracteres especiales en los campos.
function escapar(valor) {
  return String(valor).replace(/[&<>"']/g, function(caracter) {
    return {"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[caracter];
  });
}

mostrarDatos();
