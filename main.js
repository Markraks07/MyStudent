// ==========================================
// 1. CONFIGURACIÓN Y VARIABLES GLOBALES
// ==========================================
/**
 * @typedef {object} UserData
 * @property {string | null} uid - ID único del usuario.
 * @property {number} xp - Puntos de experiencia del usuario.
 * @property {string} nombre - Nombre del usuario.
 * @property {string} apellido - Apellido del usuario.
 */

/** @type {UserData} */
let userData = { uid: null, xp: 0, nombre: "", apellido: "" };

/**
 * Función autoejecutable para aplicar el tema guardado en localStorage.
 * @function
 */
(function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
})();

// ==========================================
// 2. SISTEMA DE AUTENTICACIÓN
// ==========================================

/**
 * Intenta iniciar sesión con el correo electrónico y la contraseña proporcionados.
 * @async
 * @function login
 * @returns {void}
 */
async function login() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    if (!email || !pass) {
        return alert("Rellena todos los campos");
    }
    try {
        await firebase.auth().signInWithEmailAndPassword(email, pass);
    } catch (err) {
        alert("Error al entrar: " + err.message);
    }
}

/**
 * Registra un nuevo usuario con el correo electrónico, contraseña, nombre y apellido proporcionados.
 * @async
 * @function register
 * @returns {void}
 */
async function register() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;

    if (!email || !pass || !nombre) {
        return alert("Faltan datos importantes");
    }

    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, pass);
        const user = userCredential.user;
        if (user && user.uid) {
            await database.ref('usuarios/' + user.uid).set({
                nombre: nombre,
                apellido: apellido || "",
                xp: 0,
                nivel: 1,
                rango: "Novato"
            });
        }
    } catch (err) {
        alert("Error al registrar: " + err.message);
    }
}

/**
 * Cierra la sesión del usuario actual y redirige a la página de inicio de sesión.
 * @async
 * @function logout
 * @returns {void}
 */
async function logout() {
    try {
        await firebase.auth().signOut();
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        alert("Error al cerrar sesión.");
    }
}

// ==========================================
// 3. DETECTOR DE SESIÓN Y CARGA DE DATOS
// ==========================================

/**
 * Observa los cambios en el estado de autenticación de Firebase.
 * Carga y actualiza la interfaz de usuario según el estado de la sesión.
 * @function onAuthStateChanged
 * @returns {void}
 */
firebase.auth().onAuthStateChanged(async (user) => {
    const modal = document.getElementById('auth-modal');

    if (user) {
        if (modal) {
            modal.style.display = 'none';
        }

        try {
            const snapshot = await database.ref('usuarios/' + user.uid).get();
            const data = snapshot.val();

            if (data) {
                userData = { uid: user.uid, ...data };
                updateUI();

                // --- Disparadores automáticos por página ---
                if (document.getElementById('task-list')) {
                    cargarTareas(user.uid);
                }
                if (document.getElementById('progress-fill')) {
                    actualizarEstadisticas();
                }
                if (document.getElementById('ranking-list')) {
                    cargarRanking();
                }
                if (document.getElementById('chat-box')) {
                    cargarChat();
                }
                if (document.getElementById('notes-grid')) {
                    cargarApuntes(user.uid);
                }
                if (document.getElementById('grades-list')) {
                    cargarNotasEscolares(user.uid);
                }

                checkSecretAccess();
                actualizarContadorTareas(user.uid);
            }
        } catch (error) {
            console.error("Error al obtener datos del usuario:", error);
        }
    } else {
        if (modal) {
            modal.style.display = 'flex';
        }
        const path = window.location.pathname;
        if (!path.endsWith("index.html") && path !== "/") {
            window.location.href = "index.html";
        }
    }
});

// ==========================================
// 4. ACTUALIZACIÓN DE INTERFAZ (UI)
// ==========================================

/**
 * Actualiza la interfaz de usuario con los datos del usuario.
 * @function updateUI
 * @returns {void}
 */
function updateUI() {
    if (!userData.uid) {
        return;
    }
    const elements = {
        xp: document.getElementById('user-xp'),
        name: document.getElementById('user-name'),
        avatar: document.getElementById('user-avatar'),
        mName: document.getElementById('menu-user-name'),
        mEmail: document.getElementById('menu-user-email'),
        welcome: document.getElementById('welcome-text')
    };

    if (elements.xp) {
        elements.xp.innerText = `${userData.xp || 0} XP`;
    }
    if (elements.name) {
        elements.name.innerText = userData.nombre;
    }
    if (elements.mName) {
        elements.mName.innerText = userData.nombre;
    }
    if (elements.welcome) {
        elements.welcome.innerText = `¡Hola de nuevo, ${userData.nombre}! 👋`;
    }
    if (elements.avatar) {
        elements.avatar.src = `https://ui-avatars.com/api/?name=${userData.nombre}&background=4318ff&color=fff&rounded=true`;
    }
    if (elements.mEmail && firebase.auth().currentUser) {
        elements.mEmail.innerText = firebase.auth().currentUser.email;
    }
}

// ==========================================
// 5. LÓGICA DE TAREAS Y XP
// ==========================================

/**
 * Agrega una nueva tarea a la base de datos.
 * @function addTask
 * @returns {void}
 */
function addTask() {
    const txt = document.getElementById('task-input');
    const mat = document.getElementById('task-materia');
    if (!userData.uid || !txt.value.trim()) {
        return;
    }

    database.ref('tareas/' + userData.uid).push({
        texto: txt.value,
        materia: mat.value,
        prioridad: parseInt(document.getElementById('task-priority').value),
        esfuerzo: parseInt(document.getElementById('task-effort').value),
        fechaEntrega: document.getElementById('task-date').value || "Hoy",
        timestamp: Date.now()
    });
    txt.value = "";
}

/**
 * Carga las tareas del usuario desde la base de datos y las muestra en la interfaz.
 * @function cargarTareas
 * @param {string} uid - ID del usuario.
 * @returns {void}
 */
function cargarTareas(uid) {
    database.ref('tareas/' + uid).on('value', (snap) => {
        const container = document.getElementById('task-list');
        if (!container) {
            return;
        }
        container.innerHTML = "";
        snap.forEach((child) => {
            const t = child.val();
            const div = document.createElement('div');
            div.className = `task-item priority-${t.prioridad}`;
            div.innerHTML = `
                <div style="display: flex; gap: 15px; align-items: center;">
                    <button class="btn-complete-task" onclick="completeTask('${child.key}', ${t.prioridad}, ${t.esfuerzo})">
                        <i class="fas fa-check"></i>
                    </button>
                    <div style="flex:1">
                        <strong>${t.texto}</strong> <span class="badge-materia">${t.materia}</span>
                        <p style="font-size:11px; color:var(--text-grey); margin-top:5px;">📅 ${t.fechaEntrega}</p>
                    </div>
                </div>`;
            container.appendChild(div);
        });
    });
}

/**
 * Marca una tarea como completada, elimina la tarea de la base de datos y otorga XP al usuario.
 * @async
 * @function completeTask
 * @param {string} id - ID de la tarea.
 * @param {number} pri - Prioridad de la tarea.
 * @param {number} eff - Esfuerzo de la tarea.
 * @returns {void}
 */
async function completeTask(id, pri, eff) {
    let puntos = 30 + (pri * 20) + (eff * 10);
    try {
        await database.ref('tareas/' + userData.uid + '/' + id).remove();
        subirXP(puntos);
    } catch (error) {
        console.error("Error al completar la tarea:", error);
    }
}

/**
 * Aumenta los puntos de experiencia (XP) del usuario.
 * @function subirXP
 * @param {number} p - Cantidad de XP a agregar.
 * @returns {void}
 */
function subirXP(p) {
    if (!userData.uid) {
        return;
    }
    database.ref('usuarios/' + userData.uid + '/xp').set(firebase.database.ServerValue.increment(p));
}

// ==========================================
// 6. HERRAMIENTAS (MEDIA, CHAT, APUNTES)
// ==========================================

/**
 * Agrega una nueva nota escolar a la base de datos.
 * @function addGrade
 * @returns {void}
 */
window.addGrade = function() {
    const mat = document.getElementById('grade-materia').value;
    const name = document.getElementById('grade-name').value;
    const val = parseFloat(document.getElementById('grade-value').value);

    // Validaciones básicas
    if (!name || isNaN(val)) {
        return alert("Por favor, introduce el nombre del examen y una nota válida.");
    }

    if (!userData.uid) {
        return alert("Debes estar logueado para guardar notas.");
    }

    // Guardar en Firebase
    database.ref('notas_escolares/' + userData.uid).push({
        materia: mat,
        nombre: name,
        valor: val,
        fecha: Date.now()
    }).then(() => {
        alert("Nota guardada correctamente");
        // Limpiar campos
        document.getElementById('grade-name').value = "";
        document.getElementById('grade-value').value = "";
    }).catch(err => {
        console.error("Error al guardar nota:", err);
    });
};

/**
 * Guarda una nueva nota en la base de datos.
 * @function saveNote
 * @returns {void}
 */
function saveNote() {
    const title = document.getElementById('note-title').value;
    const body = document.getElementById('note-body').value;
    if (!title || !body) {
        return alert("Completa los campos");
    }
    database.ref('apuntes/' + userData.uid).push({ titulo: title, contenido: body, fecha: Date.now() });
    document.getElementById('note-title').value = "";
    document.getElementById('note-body').value = "";
}

/**
 * Carga los apuntes del usuario desde la base de datos y los muestra en la interfaz.
 * @function cargarApuntes
 * @param {string} uid - ID del usuario.
 * @returns {void}
 */
function cargarApuntes(uid) {
    database.ref('apuntes/' + uid).on('value', (snap) => {
        const grid = document.getElementById('notes-grid');
        if (!grid) {
            return;
        }
        grid.innerHTML = "";
        snap.forEach(child => {
            const n = child.val();
            grid.innerHTML += `<div class="card"><h3>${n.titulo}</h3><p>${n.contenido}</p></div>`;
        });
    });
}

/**
 * Carga los mensajes del chat global desde la base de datos y los muestra en la interfaz.
 * @function cargarChat
 * @returns {void}
 */
function cargarChat() {
    database.ref('chat_global').limitToLast(30).on('value', (snap) => {
        const box = document.getElementById('chat-box');
        if (!box) {
            return;
        }
        box.innerHTML = "";
        snap.forEach(child => {
            const m = child.val();
            const amI = m.uid === userData.uid;
            const msgClass = amI ? 'msg-me' : 'msg-others';
            box.innerHTML += `<div class="chat-message ${msgClass}"><small>${m.nombre}</small><br>${m.msg}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

/**
 * Envía un mensaje al chat global.
 * @function sendMsg
 * @returns {void}
 */
function sendMsg() {
    const input = document.getElementById('chat-input');
    if (!input.value.trim()) {
        return;
    }
    database.ref('chat_global').push({ nombre: userData.nombre, msg: input.value, uid: userData.uid, time: Date.now() });
    input.value = "";
}

// ==========================================
// 7. ESTADÍSTICAS Y SECRETO
// ==========================================

/**
 * Actualiza las estadísticas del usuario en la interfaz.
 * @function actualizarEstadisticas
 * @returns {void}
 */
function actualizarEstadisticas() {
    const xp = userData.xp || 0;
    const nivel = Math.floor(xp / 500) + 1;
    const progreso = ((xp % 500) / 500) * 100;
    const fill = document.getElementById('progress-fill');
    if (fill) {
        fill.style.width = progreso + "%";
    }
    if (document.getElementById('current-level-text')) {
        document.getElementById('current-level-text').innerText = `Nivel ${nivel}`;
    }
    if (document.getElementById('stat-total-xp')) {
        document.getElementById('stat-total-xp').innerText = xp;
    }
    if (document.getElementById('xp-to-next')) {
        document.getElementById('xp-to-next').innerText = `Faltan ${500 - (xp % 500)} XP para el Nivel ${nivel + 1}`;
    }
}

/**
 * Verifica si el usuario tiene acceso al área secreta y muestra/oculta el enlace.
 * @function checkSecretAccess
 * @returns {void}
 */
function checkSecretAccess() {
    const nivel = Math.floor((userData.xp || 0) / 500) + 1;
    const secretLink = document.getElementById('secret-nav-link');
    if (nivel >= 5 && secretLink) {
        secretLink.style.display = "flex";
    }
}

/**
 * Alterna el modo oscuro.
 * @function toggleDarkMode
 * @returns {void}
 */
function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.contains('dark-mode');

    if (isDark) {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    }

    // Sincronizar todos los interruptores que existan en la página
    const toggles = document.querySelectorAll('#dark-mode-toggle');
    toggles.forEach(t => t.checked = !isDark);

    console.log("Cambiado a:", !isDark ? "Oscuro" : "Claro");
}

/**
 * Aplica el tema guardado en localStorage al cargar la página.
 * @function aplicarTemaAlCargar
 * @returns {void}
 */
function aplicarTemaAlCargar() {
    const savedTheme = localStorage.getItem('theme');
    const toggleInput = document.getElementById('dark-mode-toggle');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (toggleInput) {
            toggleInput.checked = true;
        }
    } else {
        document.body.classList.remove('dark-mode');
        if (toggleInput) {
            toggleInput.checked = false;
        }
    }
}

// Ejecutar inmediatamente al cargar el script
aplicarTemaAlCargar();

/**
 * Abre o cierra el menú de perfil.
 * @function toggleProfileMenu
 * @param {Event} e - Evento de clic.
 * @returns {void}
 */
function toggleProfileMenu(e) {
    if (e) {
        e.stopPropagation(); // Evita que el clic se cierre inmediatamente
    }
    const menu = document.getElementById('profile-menu');
    if (menu) {
        const isVisible = menu.style.display === 'flex';
        menu.style.display = isVisible ? 'none' : 'flex';
    }
}

// Escuchar clics en el avatar o el contenedor del perfil
document.addEventListener('click', (e) => {
    const avatar = document.getElementById('user-avatar');
    const menu = document.getElementById('profile-menu');

    // Si clicamos en el avatar, abrimos el menú
    if (avatar && avatar.contains(e.target)) {
        toggleProfileMenu(e);
    }
    // Si clicamos fuera del menú, lo cerramos
    else if (menu && !menu.contains(e.target)) {
        menu.style.display = 'none';
    }
});

/**
 * Carga las notas escolares del usuario desde la base de datos y las muestra en la interfaz.
 * @function cargarNotasEscolares
 * @param {string} uid - ID del usuario.
 * @returns {void}
 */
function cargarNotasEscolares(uid) {
    database.ref('notas_escolares/' + uid).on('value', (snap) => {
        const container = document.getElementById('grades-list');
        if (!container) {
            return;
        }
        container.innerHTML = "";

        if (!snap.exists()) {
            container.innerHTML = "<p style='text-align:center; opacity:0.6;'>No hay notas registradas aún.</p>";
            return;
        }

        let sumaNotas = 0;
        let totalNotas = 0;

        snap.forEach(child => {
            const n = child.val();
            const valor = parseFloat(n.valor);
            sumaNotas += valor;
            totalNotas++;

            const color = valor >= 5 ? '#05cd99' : '#ff4d4d';

            const div = document.createElement('div');
            div.className = "card";
            div.style = `display:flex; justify-content:space-between; align-items:center; border-left: 6px solid ${color}; margin-bottom:15px; padding: 15px;`;
            div.innerHTML = `
                <div>
                    <small style="color:var(--text-grey); font-weight:bold;">${n.materia}</small>
                    <h3 style="margin:5px 0 0 0;">${n.nombre}</h3>
                </div>
                <div style="font-size: 24px; font-weight: 900; color: ${color}">${valor.toFixed(1)}</div>
            `;
            container.appendChild(div);
        });

        // CALCULAR MEDIA AUTOMÁTICA si estamos en la página de calificaciones
        const mediaDisplay = document.getElementById('resultado-media');
        if (mediaDisplay && totalNotas > 0) {
            const mediaFinal = (sumaNotas / totalNotas).toFixed(2);
            mediaDisplay.innerText = mediaFinal;

            const mensajeMedia = document.getElementById('mensaje-media');
            if (mensajeMedia) {
                mensajeMedia.innerText = mediaFinal >= 5 ? "¡Vas por buen camino! 🎉" : "Necesitas reforzar un poco 📚";
            }
        }
    });
}

/**
 * Calcula la media ponderada de las notas ingresadas manualmente.
 * @function calcularMediaManual
 * @returns {void}
 */
window.calcularMediaManual = function() {
    // Buscamos todos los campos de notas y pesos por su clase
    const notas = document.getElementsByClassName('m-nota');
    const pesos = document.getElementsByClassName('m-peso');

    let sumaPonderada = 0;
    let pesoTotal = 0;

    for (let i = 0; i < notas.length; i++) {
        let n = parseFloat(notas[i].value);
        let p = parseFloat(pesos[i].value);

        // Solo sumamos si ambos campos tienen números
        if (!isNaN(n) && !isNaN(p)) {
            sumaPonderada += (n * (p / 100));
            pesoTotal += p;
        }
    }

    const resultadoMedia = document.getElementById('resultado-media-manual');
    if (resultadoMedia) {
        // Si el peso total no es 100, avisamos o calculamos sobre lo que haya
        const final = sumaPonderada.toFixed(2);
        resultadoMedia.innerText = final;

        // Cambiamos el color según si aprueba o no
        resultadoMedia.style.color = final >= 5 ? "#05cd99" : "#ff4d4d";

        if (pesoTotal !== 100 && pesoTotal > 0) {
            console.warn("Atención: El peso total no suma 100%, es: " + pesoTotal + "%");
        }
    }
};

/**
 * Añade una nueva fila para ingresar notas y pesos en la calculadora de media.
 * @function addMediaRow
 * @returns {void}
 */
window.addMediaRow = function() {
    const container = document.getElementById('media-rows');
    if (!container) {
        return;
    }

    const div = document.createElement('div');
    div.className = "media-row";
    div.style = "display: flex; gap: 10px; margin-bottom: 10px;";
    div.innerHTML = `
        <input type="number" placeholder="Nota" class="m-nota" style="flex:2; padding:8px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg); color:var(--text-main);">
        <input type="number" placeholder="Peso %" class="m-peso" style="flex:1; padding:8px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg); color:var(--text-main);">
    `;
    container.appendChild(div);
};

/**
 * Carga el ranking de usuarios desde la base de datos y lo muestra en la interfaz.
 * @function cargarRanking
 * @returns {void}
 */
function cargarRanking() {
    // Consultamos los 10 usuarios con más XP
    database.ref('usuarios').orderByChild('xp').limitToLast(10).on('value', (snapshot) => {
        const container = document.getElementById('ranking-list');
        if (!container) {
            return;
        }

        container.innerHTML = "";
        let usuarios = [];

        snapshot.forEach(child => {
            usuarios.push(child.val());
        });

        // Los ordenamos de mayor a menor
        usuarios.sort((a, b) => b.xp - a.xp);

        usuarios.forEach((u, index) => {
            const row = document.createElement('div');
            row.className = "ranking-row";
            // Estilo dinámico para los 3 primeros puestos
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

            row.style = `display:flex; align-items:center; justify-content:space-between; padding:12px; border-radius:10px; margin-bottom:5px; background: var(--bg);`;

            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-weight:bold; width:30px;">${medal}</span>
                    <img src="https://ui-avatars.com/api/?name=${u.nombre}&background=random" style="width:30px; border-radius:50%;">
                    <span>${u.nombre} ${u.apellido || ''}</span>
                </div>
                <span class="xp-badge" style="background:var(--primary); color:white; padding:4px 10px; border-radius:15px; font-size:12px;">
                    ${u.xp || 0} XP
                </span>
            `;
            container.appendChild(row);
        });
    });
}

/**
 * Actualiza el contador de tareas en la barra lateral.
 * @function actualizarContadorTareas
 * @param {string} uid - ID del usuario.
 * @returns {void}
 */
function actualizarContadorTareas(uid) {
    database.ref('tareas/' + uid).on('value', (snapshot) => {
        const contador = document.getElementById('task-counter');
        if (contador) {
            const num = snapshot.numChildren();
            contador.innerText = num;
            contador.style.display = num > 0 ? 'inline-block' : 'none';
        }
    });
}