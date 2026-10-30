document.addEventListener("DOMContentLoaded", () => {
    // --- 1. ESTADO Y VARIABLES ---
    let carrito = JSON.parse(localStorage.getItem("carritoBarberia")) || [];
    let usuarios = JSON.parse(localStorage.getItem("usuariosBarberia")) || [];
    let usuarioActual = JSON.parse(localStorage.getItem("usuarioActual")) || null;
    let citasGuardadas = JSON.parse(localStorage.getItem("citasBarberia")) || [];

    const listaServicios = document.getElementById("lista-servicios");
    const filtros = document.getElementById("filtros");
    const itemsCarrito = document.getElementById("items-carrito");
    const totalCarrito = document.getElementById("total-carrito");
    const contadorCarrito = document.getElementById("contador-carrito");
    const btnVaciar = document.getElementById("btn-vaciar");
    const btnCarritoHeader = document.getElementById("btn-carrito");
    const asideCarrito = document.getElementById("carrito");
    const btnCerrarCarrito = document.getElementById("cerrar-carrito"); 
    const formReserva = document.getElementById("form-reserva");

    // Elementos de Autenticación
    const modalAuth = document.getElementById("modal-auth");
    const btnIniciarSesion = document.getElementById("btn-iniciar-sesion");
    const btnRegistrarse = document.getElementById("btn-registrarse");
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
    const cerrarModalAuth = document.getElementById("cerrar-modal-auth");
    const authTabs = document.querySelectorAll(".auth-tab");
    const authForms = document.querySelectorAll(".auth-form");
    const formLogin = document.getElementById("form-login");
    const formRegistro = document.getElementById("form-registro");
    const zonaUsuario = document.getElementById("zona-usuario");
    const zonaAcceso = document.getElementById("zona-acceso");
    const nombreUsuario = document.getElementById("nombre-usuario");
    const linkMisCitas = document.getElementById("link-mis-citas");
    const seccionMisCitas = document.getElementById("mis-citas-seccion");
    const contenedorMisCitas = document.getElementById("contenedor-mis-citas");

    // Elementos del Modal de Imágenes
    const modalImagen = document.getElementById("modal-imagen");
    const imgAmpliada = document.getElementById("img-ampliada");
    const tituloImgModal = document.getElementById("titulo-img-modal");
    const descImgModal = document.getElementById("desc-img-modal");
    const cerrarModalImagen = document.getElementById("cerrar-modal-imagen");

    // --- SISTEMA DE NOTIFICACIONES TOAST ---
    function mostrarToast(mensaje, tipo = "exito") {
        const contenedor = document.getElementById("toast-container");
        if (!contenedor) return;

        const toast = document.createElement("div");
        toast.className = `toast ${tipo}`;
        toast.innerHTML = `<span>${tipo === "exito" ? "✨" : "⚠️"}</span> <div>${mensaje}</div>`;

        contenedor.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = "fadeOut 0.3s ease forwards";
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // --- 2. SISTEMA DE AUTENTICACIÓN ---
    function abrirModal(tab = "login") {
        modalAuth.classList.add("activo");
        cambiarTab(tab);
    }

    function cerrarModal() {
        modalAuth.classList.remove("activo");
        limpiarErroresAuth();
    }

    function cambiarTab(tab) {
        authTabs.forEach(t => t.classList.toggle("activa", t.dataset.tab === tab));
        authForms.forEach(f => {
            f.classList.toggle("activa", f.id === `form-${tab}`);
        });
    }

    btnIniciarSesion?.addEventListener("click", () => abrirModal("login"));
    btnRegistrarse?.addEventListener("click", () => abrirModal("registro"));
    btnCerrarSesion?.addEventListener("click", cerrarSesion);
    cerrarModalAuth?.addEventListener("click", cerrarModal);
    modalAuth?.addEventListener("click", (e) => {
        if (e.target === modalAuth) cerrarModal();
    });

    authTabs.forEach(tab => {
        tab.addEventListener("click", () => cambiarTab(tab.dataset.tab));
    });

    function hashSimple(texto) {
        let hash = 0;
        for (let i = 0; i < texto.length; i++) {
            const char = texto.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return "h_" + Math.abs(hash).toString(36);
    }

    function mostrarErrorAuth(id, mensaje) {
        const span = document.getElementById(id);
        if (span) {
            span.textContent = mensaje;
            span.style.display = "block";
        }
    }

    function limpiarErroresAuth() {
        document.querySelectorAll(".auth-form .error").forEach(e => {
            e.textContent = "";
            e.style.display = "none";
        });
    }

    formRegistro?.addEventListener("submit", (e) => {
        e.preventDefault();
        limpiarErroresAuth();

        const nombre = document.getElementById("registro-nombre").value.trim();
        const correo = document.getElementById("registro-correo").value.trim().toLowerCase();
        const password = document.getElementById("registro-password").value;

        let valido = true;

        if (nombre.length < 3) {
            mostrarErrorAuth("error-registro-nombre", "Mínimo 3 caracteres");
            valido = false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            mostrarErrorAuth("error-registro-correo", "Correo inválido");
            valido = false;
        }
        if (usuarios.some(u => u.correo === correo)) {
            mostrarErrorAuth("error-registro-correo", "Este correo ya está registrado");
            valido = false;
        }
        if (password.length < 6) {
            mostrarErrorAuth("error-registro-password", "Mínimo 6 caracteres");
            valido = false;
        }

        if (!valido) return;

        const nuevoUsuario = {
            id: Date.now(),
            nombre,
            correo,
            password: hashSimple(password)
        };

        usuarios.push(nuevoUsuario);
        localStorage.setItem("usuariosBarberia", JSON.stringify(usuarios));

        iniciarSesion(nuevoUsuario);
        cerrarModal();
        formRegistro.reset();
        mostrarToast(`¡Bienvenido/a, ${nombre}! Cuenta creada con éxito.`);
    });

    formLogin?.addEventListener("submit", (e) => {
        e.preventDefault();
        limpiarErroresAuth();

        const correo = document.getElementById("login-correo").value.trim().toLowerCase();
        const password = document.getElementById("login-password").value;

        const usuario = usuarios.find(u => u.correo === correo);

        if (!usuario) {
            mostrarErrorAuth("error-login-correo", "No existe una cuenta con este correo");
            return;
        }
        if (usuario.password !== hashSimple(password)) {
            mostrarErrorAuth("error-login-password", "Contraseña incorrecta");
            return;
        }

        iniciarSesion(usuario);
        cerrarModal();
        formLogin.reset();
        mostrarToast(`¡Hola de nuevo, ${usuario.nombre}!`);
    });

    function iniciarSesion(usuario) {
        usuarioActual = { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo };
        localStorage.setItem("usuarioActual", JSON.stringify(usuarioActual));
        actualizarUIUsuario();
        prellenarFormularioReserva();
        renderizarMisCitas();
    }

    function cerrarSesion() {
        if (confirm("¿Deseas cerrar sesión?")) {
            usuarioActual = null;
            localStorage.removeItem("usuarioActual");
            actualizarUIUsuario();
            mostrarToast("Sesión cerrada correctamente", "alerta");
        }
    }

    function actualizarUIUsuario() {
        if (usuarioActual) {
            zonaUsuario.style.display = "flex";
            zonaAcceso.style.display = "none";
            nombreUsuario.textContent = `Hola, ${usuarioActual.nombre.split(" ")[0]}`;
            linkMisCitas.style.display = "block";
            seccionMisCitas.style.display = "block";
        } else {
            zonaUsuario.style.display = "none";
            zonaAcceso.style.display = "flex";
            linkMisCitas.style.display = "none";
            seccionMisCitas.style.display = "none";
        }
    }

    function prellenarFormularioReserva() {
        if (usuarioActual) {
            document.getElementById("nombre").value = usuarioActual.nombre;
        }
    }

    // --- HISTORIAL DE CITAS ---
    function renderizarMisCitas() {
        if (!usuarioActual || !contenedorMisCitas) return;

        contenedorMisCitas.innerHTML = "";
        const citasUsuario = citasGuardadas.filter(c => c.correoUsuario === usuarioActual.correo);

        if (citasUsuario.length === 0) {
            contenedorMisCitas.innerHTML = '<p class="sin-citas">No tienes citas agendadas actualmente.</p>';
            return;
        }

        citasUsuario.forEach((cita) => {
            const card = document.createElement("div");
            card.className = "cita-card";
            
            let htmlServicios = "";
            if (cita.servicios && cita.servicios.length > 0) {
                htmlServicios = "<ul>" + cita.servicios.map(s => `<li>${s.nombre} (x${s.cantidad})</li>`).join("") + "</ul>";
            } else {
                htmlServicios = "<p>Asesoría general / Sin servicios específicos</p>";
            }

            card.innerHTML = `
                <div class="cita-info">
                    <strong>💈 ${cita.area.toUpperCase()}</strong>
                    <p>📅 <strong>Fecha:</strong> ${cita.fecha} a las ${cita.hora}</p>
                    <p>📞 <strong>Teléfono:</strong> ${cita.telefono}</p>
                    <div class="cita-servicios"><strong>Servicios:</strong> ${htmlServicios}</div>
                </div>
                <button type="button" class="btn-cancelar-cita" data-id="${cita.id}">Cancelar Cita</button>
            `;
            contenedorMisCitas.appendChild(card);
        });
    }

    contenedorMisCitas?.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-cancelar-cita")) {
            const idCita = parseInt(e.target.dataset.id);
            if (confirm("¿Estás seguro de cancelar esta cita?")) {
                citasGuardadas = citasGuardadas.filter(c => c.id !== idCita);
                localStorage.setItem("citasBarberia", JSON.stringify(citasGuardadas));
                renderizarMisCitas();
                mostrarToast("Cita cancelada con éxito", "alerta");
            }
        }
    });

    // --- 3. FILTRADO DE SERVICIOS ---
    if (filtros) {
        filtros.addEventListener("click", (e) => {
            if (e.target.tagName === "BUTTON") {
                const filtro = e.target.dataset.filtro;
                const servicios = document.querySelectorAll(".servicio");
                
                servicios.forEach(servicio => {
                    if (filtro === "todos" || servicio.dataset.categoria === filtro) {
                        servicio.style.display = "block";
                        servicio.style.animation = "fadeIn 0.5s ease";
                    } else {
                        servicio.style.display = "none";
                    }
                });
            }
        });
    }

    // --- ZOOM DE IMAGENES Y AGREGAR AL CARRITO ---
    if (listaServicios) {
        listaServicios.addEventListener("click", (e) => {
            if (e.target.classList.contains("img-zoomable")) {
                const articulo = e.target.closest(".servicio");
                const tituloServicio = articulo.querySelector("h3").textContent;
                const descripcionServicio = e.target.dataset.descripcion || "Servicio profesional de alta calidad.";

                imgAmpliada.src = e.target.src;
                tituloImgModal.textContent = tituloServicio;
                descImgModal.textContent = descripcionServicio;
                modalImagen.classList.add("activo");
            }

            if (e.target.classList.contains("btn-agregar")) {
                const articulo = e.target.closest(".servicio");
                const nombreServicio = articulo.dataset.nombre;
                const producto = {
                    id: articulo.dataset.id,
                    nombre: nombreServicio,
                    precio: parseInt(articulo.dataset.precio),
                };
                agregarAlCarrito(producto);

                // Notificación flotante carrito
                mostrarToast(`¡"${nombreServicio}" agregado al carrito!`);
                
                e.target.textContent = "✓ Agregado";
                e.target.disabled = true;
                setTimeout(() => {
                    e.target.textContent = "Agregar";
                    e.target.disabled = false;
                }, 1000);
            }
        });
    }

    function cerrarZoomImagen() {
        modalImagen.classList.remove("activo");
    }

    cerrarModalImagen?.addEventListener("click", cerrarZoomImagen);
    modalImagen?.addEventListener("click", (e) => {
        if (e.target === modalImagen) cerrarZoomImagen();
    });

    // --- 4. LÓGICA DEL CARRITO Y SUMADOR ---
    function agregarAlCarrito(producto) {
        const existe = carrito.find((p) => p.id === producto.id);
        if (existe) {
            existe.cantidad++;
        } else {
            carrito.push({ ...producto, cantidad: 1 });
        }
        guardarYRenderizar();
    }

    function guardarYRenderizar() {
        localStorage.setItem("carritoBarberia", JSON.stringify(carrito));
        renderizarCarrito();
    }

    function renderizarCarrito() {
        itemsCarrito.innerHTML = "";
        let total = 0;
        let contador = 0;

        if (carrito.length === 0) {
            itemsCarrito.innerHTML = '<li class="carrito-vacio">Tu selección está vacía</li>';
        } else {
            carrito.forEach((prod, index) => {
                const subtotal = prod.precio * prod.cantidad;
                total += subtotal;
                contador += prod.cantidad;

                const li = document.createElement("li");
                li.className = "item-carrito";
                li.innerHTML = `
                    <div class="info-item">
                        <strong>${prod.nombre}</strong>
                        <span class="subtotal-item">$${subtotal.toLocaleString("es-CO")}</span>
                    </div>
                    <div class="acciones-item">
                        <div class="sumador-control">
                            <button class="btn-restar" data-index="${index}">-</button>
                            <span class="cantidad-num">${prod.cantidad}</span>
                            <button class="btn-sumar" data-index="${index}">+</button>
                        </div>
                        <button class="btn-eliminar" data-index="${index}" title="Eliminar servicio">🗑️</button>
                    </div>
                `;
                itemsCarrito.appendChild(li);
            });
        }

        totalCarrito.textContent = `$${total.toLocaleString("es-CO")}`;
        contadorCarrito.textContent = contador;
    }

    if (itemsCarrito) {
        itemsCarrito.addEventListener("click", (e) => {
            const index = e.target.dataset.index;
            if (index === undefined) return;

            if (e.target.classList.contains("btn-sumar")) {
                carrito[index].cantidad++;
                guardarYRenderizar();
            } else if (e.target.classList.contains("btn-restar")) {
                carrito[index].cantidad--;
                if (carrito[index].cantidad <= 0) {
                    carrito.splice(index, 1);
                }
                guardarYRenderizar();
            } else if (e.target.classList.contains("btn-eliminar")) {
                carrito.splice(index, 1);
                guardarYRenderizar();
            }
        });
    }

    if (btnVaciar) {
        btnVaciar.addEventListener("click", () => {
            if (carrito.length > 0 && confirm("¿Estás seguro de vaciar tu selección?")) {
                carrito = [];
                guardarYRenderizar();
                mostrarToast("Se ha vaciado el carrito", "alerta");
            }
        });
    }

    // Abrir o cerrar carrito desde el botón del header
    if (btnCarritoHeader && asideCarrito) {
        btnCarritoHeader.addEventListener("click", (e) => {
            e.stopPropagation();
            asideCarrito.classList.toggle("activo");
        });
    }

    // Cerrar carrito con la "X"
    if (btnCerrarCarrito && asideCarrito) {
        btnCerrarCarrito.addEventListener("click", () => {
            asideCarrito.classList.remove("activo");
        });
    }

    // Cerrar carrito al hacer clic fuera
    document.addEventListener("click", (e) => {
        if (asideCarrito.classList.contains("activo") && 
            !asideCarrito.contains(e.target) && 
            !btnCarritoHeader.contains(e.target) &&
            !e.target.classList.contains("btn-agregar")) {
            asideCarrito.classList.remove("activo");
        }
    });

    asideCarrito?.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    // --- 5. RESERVA, WHATSAPP E HISTORIAL ---
    if (formReserva) {
        formReserva.addEventListener("submit", (e) => {
            e.preventDefault();

            const nombre = document.getElementById("nombre").value.trim();
            const telefono = document.getElementById("telefono").value.trim();
            const area = document.getElementById("area").value;
            const fecha = document.getElementById("fecha").value;
            const hora = document.getElementById("hora").value;

            if (!nombre || !telefono || !area || !fecha || !hora) {
                mostrarToast("Por favor, completa todos los campos obligatorios.", "alerta");
                return;
            }

            if (telefono.replace(/\D/g, "").length < 10) {
                mostrarToast("Ingresa un número de teléfono válido (10 dígitos).", "alerta");
                return;
            }

            if (usuarioActual) {
                const nuevaCita = {
                    id: Date.now(),
                    correoUsuario: usuarioActual.correo,
                    nombre,
                    telefono,
                    area,
                    fecha,
                    hora,
                    servicios: [...carrito]
                };
                citasGuardadas.push(nuevaCita);
                localStorage.setItem("citasBarberia", JSON.stringify(citasGuardadas));
                renderizarMisCitas();
            }

            let mensaje = `¡Hola! 👋 Quisiera reservar una cita:%0A%0A`;
            mensaje += `👤 *Nombre:* ${nombre}%0A`;
            mensaje += `📞 *Teléfono:* ${telefono}%0A`;
            mensaje += `💈 *Área:* ${area === "barberia" ? "Barbería" : "Studio Nails"}%0A`;
            mensaje += `📅 *Fecha:* ${fecha} a las ${hora}%0A`;

            if (carrito.length > 0) {
                mensaje += `%0A🛒 *Servicios seleccionados:*%0A`;
                carrito.forEach((p) => {
                    mensaje += `▪️ ${p.nombre} (x${p.cantidad}): $${(p.precio * p.cantidad).toLocaleString("es-CO")}%0A`;
                });
                const total = carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
                mensaje += `%0A💰 *Total estimado:* $${total.toLocaleString("es-CO")}`;
            } else {
                mensaje += `%0A⚠️ *Nota:* No he seleccionado servicios específicos aún, quisiera recibir asesoría.`;
            }

            const urlWhatsApp = `https://wa.me/573023331593?text=${mensaje}`;
            window.open(urlWhatsApp, "_blank", "noopener,noreferrer");

            carrito = [];
            guardarYRenderizar();
            formReserva.reset();
            asideCarrito.classList.remove("activo");
            mostrarToast("¡Cita agendada y redirigiendo a WhatsApp!");
        });
    }

    renderizarCarrito();
    actualizarUIUsuario();
    if (usuarioActual) {
        prellenarFormularioReserva();
        renderizarMisCitas();
    }
});