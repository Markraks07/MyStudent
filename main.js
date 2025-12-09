/* ============= MYSTUDENT - MAIN.JS COMPLETO (SIN IA) ============= */

// Saludo personalizado
const greeting = document.getElementById('greeting');
const nickname = localStorage.getItem('myStudentNickname') || 'crack';
if (greeting) greeting.textContent = `¡Hola, ${nickname}! 👋`;

// Primera vez → pedir nombre
if (!localStorage.getItem('myStudentNickname')) {
  setTimeout(() => {
    const name = prompt('¡Bienvenid@ a MyStudent! 😈\n¿Cuál es tu nombre o apodo?')?.trim();
    if (name) {
      localStorage.setItem('myStudentNickname', name);
      if (greeting) greeting.textContent = `¡Hola, ${name}! 👋`;
    }
  }, 800);
}

// Modo oscuro
const darkToggle = document.getElementById('dark-toggle');
if (darkToggle) {
  if (localStorage.getItem('myStudentDark') === 'true') {
    document.body.classList.add('dark-mode');
    darkToggle.textContent = '☀️';
  }
  darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('myStudentDark', isDark);
    darkToggle.textContent = isDark ? '☀️' : '🌙';
  });
}

// ==================== DEBERES + POMODORO ====================
if (document.getElementById('form-tarea') || document.getElementById('timer')) {
  // Tareas
  const tareas = JSON.parse(localStorage.getItem('myStudentTareas')) || [];
  const form = document.getElementById('form-tarea');
  const tablaBody = document.querySelector('#tabla-tareas tbody');

  function renderTareas() {
    if (!tablaBody) return;
    tablaBody.innerHTML = '';
    tareas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    tareas.forEach((t, i) => {
      const dias = Math.ceil((new Date(t.fecha) - new Date()) / 86400000);
      const tr = document.createElement('tr');
      if (t.entregado) tr.classList.add('table-secondary');
      tr.innerHTML = `
        <td>${t.nombre}</td>
        <td><span class="badge bg-primary">${t.tipo}</span></td>
        <td>${new Date(t.fecha).toLocaleDateString('es-ES')}</td>
        <td>${t.entregado ? '—' : dias <= 0 ? '¡HOY!' : `En ${dias} días`}</td>
        <td><button class="btn ${t.entregado ? 'btn-secondary' : 'btn-success'} btn-sm" onclick="toggle(${i})">${t.entregado ? '✓' : 'Pendiente'}</button></td>
        <td><button class="btn btn-danger btn-sm" onclick="borrar(${i})">✕</button></td>
      `;
      tablaBody.appendChild(tr);
    });
  }

  window.toggle = (i) => {
    tareas[i].entregado = !tareas[i].entregado;
    localStorage.setItem('myStudentTareas', JSON.stringify(tareas));
    renderTareas();
  };
  window.borrar = (i) => {
    if (confirm('¿Eliminar?')) {
      tareas.splice(i, 1);
      localStorage.setItem('myStudentTareas', JSON.stringify(tareas));
      renderTareas();
    }
  };

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const nueva = {
        nombre: document.getElementById('nombre-tarea').value.trim(),
        fecha: document.getElementById('fecha-tarea').value,
        tipo: document.getElementById('tipo-tarea').value,
        entregado: false
      };
      if (nueva.nombre && nueva.fecha) {
        tareas.push(nueva);
        localStorage.setItem('myStudentTareas', JSON.stringify(tareas));
        renderTareas();
        form.reset();
      }
    };
    renderTareas();
  }

  // POMODORO
  if (document.getElementById('timer')) {
    const timerDisplay = document.getElementById('timer');
    const startBtn = document.getElementById('start');
    const pauseBtn = document.getElementById('pause');
    const resetBtn = document.getElementById('reset');
    const pomodorosHechos = document.getElementById('pomodoros-hechos');

    let tiempo = 25 * 60;
    let intervalo = null;
    let pomodoros = parseInt(localStorage.getItem('pomodorosTotales') || '0');

    function actualizar() {
      const m = String(Math.floor(tiempo / 60)).padStart(2, '0');
      const s = String(tiempo % 60).padStart(2, '0');
      timerDisplay.textContent = `${m}:${s}`;
    }

    startBtn.onclick = () => {
      if (intervalo) return;
      intervalo = setInterval(() => {
        if (tiempo > 0) {
          tiempo--;
          actualizar();
        } else {
          clearInterval(intervalo);
          pomodoros++;
          localStorage.setItem('pomodorosTotales', pomodoros);
          pomodorosHechos.textContent = pomodoros;
          alert(pomodoros % 4 === 0 ? "¡Descanso largo! 🏖️" : "¡Pomodoro hecho! 🍅");
          tiempo = pomodoros % 4 === 0 ? 15 * 60 : 5 * 60;
          actualizar();
        }
      }, 1000);
      startBtn.disabled = true;
      pauseBtn.disabled = false;
    };

    pauseBtn.onclick = () => { clearInterval(intervalo); intervalo = null; startBtn.disabled = false; pauseBtn.disabled = true; };
    resetBtn.onclick = () => { clearInterval(intervalo); intervalo = null; tiempo = 25 * 60; actualizar(); startBtn.disabled = false; };

    actualizar();
  }
}

// ==================== DEBERES / EXÁMENES / TRABAJOS ====================
if (document.getElementById('form-tarea')) {
  const tareas = JSON.parse(localStorage.getItem('myStudentTareas')) || [];
  const form = document.getElementById('form-tarea');
  const tablaBody = document.querySelector('#tabla-tareas tbody');

  function diasRestantes(fecha) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const entrega = new Date(fecha);
    const diff = entrega - hoy;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function renderTareas() {
    tablaBody.innerHTML = '';
    tareas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    tareas.forEach((tarea, i) => {
      const dias = diasRestantes(tarea.fecha);
      const tr = document.createElement('tr');
      if (tarea.entregado) tr.classList.add('table-secondary', 'text-muted');
      if (dias <= 3 && !tarea.entregado) tr.classList.add('table-warning');
      if (dias < 0 && !tarea.entregado) tr.classList.add('table-danger');

      tr.innerHTML = `
        <td>${tarea.nombre}</td>
        <td><span class="badge bg-primary">${tarea.tipo}</span></td>
        <td>${new Date(tarea.fecha).toLocaleDateString('es-ES')}</td>
        <td>${tarea.entregado ? '—' : dias < 0 ? '<strong style="color:#e74c3c">¡Vencido!</strong>' : dias === 0 ? '<strong>Hoy</strong>' : dias === 1 ? 'Mañana' : `En ${dias} días`}</td>
        <td><button class="btn ${tarea.entregado ? 'btn-secondary' : 'btn-success'} btn-sm" onclick="toggleEntregado(${i})">${tarea.entregado ? 'Entregado ✓' : 'Pendiente'}</button></td>
        <td><button class="btn btn-danger btn-sm" onclick="borrarTarea(${i})">✕</button></td>
      `;
      tablaBody.appendChild(tr);
    });
  }

  window.toggleEntregado = (i) => {
    tareas[i].entregado = !tareas[i].entregado;
    localStorage.setItem('myStudentTareas', JSON.stringify(tareas));
    renderTareas();
  };

  window.borrarTarea = (i) => {
    if (confirm('¿Eliminar esta tarea?')) {
      tareas.splice(i, 1);
      localStorage.setItem('myStudentTareas', JSON.stringify(tareas));
      renderTareas();
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nueva = {
      nombre: document.getElementById('nombre-tarea').value.trim(),
      fecha: document.getElementById('fecha-tarea').value,
      tipo: document.getElementById('tipo-tarea').value,
      entregado: false
    };
    if (nueva.nombre && nueva.fecha) {
      tareas.push(nueva);
      localStorage.setItem('myStudentTareas', JSON.stringify(tareas));
      renderTareas();
      form.reset();
      document.getElementById('tipo-tarea').value = 'Deber';
    }
  });

  renderTareas();
}

// ==================== CALCULADORA TRIMESTRE CON PESOS (primer apartado) ====================
if (document.getElementById('add-evaluacion')) {
  const container = document.getElementById('evaluaciones-container');
  const notaFinalSpan = document.getElementById('nota-final-trimestre');
  const sumaPesosSpan = document.getElementById('suma-pesos');

  function crearFila(d = { nombre: '', nota: '', peso: 10 }) {
    const div = document.createElement('div');
    div.className = 'evaluacion-row col-12';
    div.innerHTML = `
      <div class="row g-2 align-items-center">
        <div class="col-md-6"><input type="text" class="form-control" placeholder="Ej: Examen 1" value="${d.nombre}"></div>
        <div class="col-md-3"><input type="number" step="0.01" min="0" max="10" class="form-control nota-input" placeholder="Nota" value="${d.nota}"></div>
        <div class="col-md-2"><input type="number" min="1" max="100" class="form-control peso-input" placeholder="% peso" value="${d.peso}"></div>
        <div class="col-md-1 text-end"><button type="button" class="btn btn-danger btn-sm remove-eval">✕</button></div>
      </div>
    `;

    div.querySelectorAll('input').forEach(i => i.addEventListener('input', calcular));
    div.querySelector('.remove-eval').onclick = () => { div.remove(); calcular(); };
    container.appendChild(div);
  }

  function calcular() {
    let sumaPonderada = 0;
    let totalPeso = 0;

    document.querySelectorAll('.evaluacion-row').forEach(row => {
      const nota = parseFloat(row.querySelector('.nota-input').value) || 0;
      const peso = parseFloat(row.querySelector('.peso-input').value) || 0;
      if (peso > 0) {
        sumaPonderada += nota * (peso / 100);
        totalPeso += peso;
      }
    });

    sumaPesosSpan.textContent = totalPeso;

    if (totalPeso === 0) {
      notaFinalSpan.textContent = '—';
    } else if (totalPeso > 100) {
      notaFinalSpan.textContent = '¡Peso >100%!';
      notaFinalSpan.style.color = '#dc3545';
    } else {
      const notaFinal = (sumaPonderada / (totalPeso / 100)).toFixed(2);
      notaFinalSpan.textContent = notaFinal;
      notaFinalSpan.style.color = notaFinal >= 5 ? '#198754' : '#dc3545';
    }
  }

  document.getElementById('add-evaluacion').addEventListener('click', () => crearFila());
  calcular();
}

// ==================== TABLA DE MATERIAS CON 3 EVALUACIONES (segundo apartado) ====================
if (document.getElementById('add-materia')) {
  const container = document.getElementById('materias-container');
  const mediaGlobalSpan = document.getElementById('media-global');
  let materias = JSON.parse(localStorage.getItem('myStudentMaterias')) || [];

  function crearFila(m = { nombre: '', n1: '', n2: '', n3: '' }) {
    const div = document.createElement('div');
    div.className = 'row g-3 align-items-end mb-3 pb-3 border-bottom';
    div.innerHTML = `
      <div class="col-md-4"><input type="text" class="form-control" placeholder="Nombre materia" value="${m.nombre}" required></div>
      <div class="col"><input type="number" step="0.01" min="0" max="10" class="form-control nota-input" placeholder="1ª eval" value="${m.n1}"></div>
      <div class="col"><input type="number" step="0.01" min="0" max="10" class="form-control nota-input" placeholder="2ª eval" value="${m.n2}"></div>main.js
      <div class="col"><input type="number" step="0.01" min="0" max="10" class="form-control nota-input" placeholder="3ª eval" value="${m.n3}"></div>
      <div class="col-auto"><button type="button" class="btn btn-danger btn-sm remove-materia">✕</button></div>
      <div class="col-12 col-md-2 text-center"><strong class="media-materia text-primary">—</strong></div>
    `;

    div.querySelector('.remove-materia').onclick = () => { div.remove(); actualizar(); };
    div.querySelectorAll('.nota-input, input[placeholder="Nombre materia"]').forEach(i => i.addEventListener('input', actualizar));

    container.appendChild(div);
  }

  function actualizar() {
    materias = Array.from(container.children).map(row => ({
      nombre: row.querySelector('input[placeholder="Nombre materia"]').value.trim(),
      n1: row.querySelectorAll('.nota-input')[0].value,
      n2: row.querySelectorAll('.nota-input')[1].value,
      n3: row.querySelectorAll('.nota-input')[2].value,
    }));
    localStorage.setItem('myStudentMaterias', JSON.stringify(materias));

    let sumaGlobal = 0;
    let completas = 0;

    container.querySelectorAll('.row').forEach(row => {
      const notas = Array.from(row.querySelectorAll('.nota-input'))
        .map(i => parseFloat(i.value) || 0)
        .filter(n => n > 0);

      const media = notas.length > 0 ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2) : '—';
      row.querySelector('.media-materia').textContent = media;

      if (notas.length === 3) {
        sumaGlobal += notas.reduce((a, b) => a + b, 0) / 3;
        completas++;
      }
    });

    if (completas > 0) {
      const mediaFinal = (sumaGlobal / completas).toFixed(2);
      mediaGlobalSpan.textContent = mediaFinal;
      mediaGlobalSpan.className = mediaFinal >= 5 ? 'text-success fw-bold' : 'text-danger fw-bold';
    } else {
      mediaGlobalSpan.textContent = '—';
    }
  }

  document.getElementById('add-materia').addEventListener('click', () => crearFila());

  materias.forEach(m => crearFila(m));
  actualizar();
}

// ==================== REGISTRO DE NOTAS INDIVIDUALES EDITABLES (notas.html) ====================
if (document.getElementById('add-nota-rapida')) {
  const tabla = document.querySelector('#tabla-notas');
  const mediaSpan = document.getElementById('media-general');
  let notas = JSON.parse(localStorage.getItem('myStudentNotasEditables')) || [];

  function guardar() {
    localStorage.setItem('myStudentNotasEditables', JSON.stringify(notas));
  }

  function celda(texto, tipo = 'text') {
    const td = document.createElement('td');
    td.textContent = texto ?? '—';
    td.contentEditable = true;

    if (tipo === 'date' && texto) {
      td.textContent = new Date(texto).toLocaleDateString('es-ES');
    }

    td.addEventListener('blur', () => {
      if (tipo === 'number') {
        const num = parseFloat(td.textContent);
        if (isNaN(num) || num < 0 || num > 10) {
          td.textContent = notas.find(n => n.id === td.closest('tr').dataset.id)?.nota || '—';
        } else {
          td.textContent = num.toFixed(2);
        }
      }
      actualizarFila(td.closest('tr'));
    });

    td.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        td.blur();
      }
    });

    return td;
  }

  function fila(nota) {
    const tr = document.createElement('tr');
    tr.dataset.id = nota.id;

    tr.appendChild(celda(nota.concepto));
    tr.appendChild(celda(nota.materia));
    tr.appendChild(celda(nota.nota, 'number'));

    const tdFecha = celda(nota.fecha, 'date');
    tdFecha.classList.add('text-center', 'text-muted', 'small');
    tr.appendChild(tdFecha);

    const tdBorrar = document.createElement('td');
    tdBorrar.innerHTML = `<button class="btn btn-danger btn-sm">✕</button>`;
    tdBorrar.onclick = () => {
      notas = notas.filter(n => n.id !== nota.id);
      guardar();
      render();
    };
    tr.appendChild(tdBorrar);

    return tr;
  }

  function actualizarFila(tr) {
    const id = tr.dataset.id;
    const celdas = tr.children;
    const nueva = {
      id,
      concepto: celdas[0].textContent.trim() || '—',
      materia: celdas[1].textContent.trim() || '—',
      nota: parseFloat(celdas[2].textContent) || 0,
      fecha: notas.find(n => n.id === id)?.fecha || new Date().toISOString().split('T')[0]
    };
    const i = notas.findIndex(n => n.id === id);
    if (i !== -1) notas[i] = nueva;
    guardar();
    render();
  }

  function render() {
    tabla.innerHTML = '';

    notas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    notas.forEach(n => tabla.appendChild(fila(n)));

    const valores = notas.map(n => n.nota).filter(n => n > 0);
    if (valores.length > 0) {
      const media = (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2);
      mediaSpan.textContent = media;
      mediaSpan.className = media >= 5 ? 'text-success fw-bold' : 'text-danger fw-bold';
    } else {
      mediaSpan.textContent = '—';
    }
  }

  document.getElementById('add-nota-rapida').addEventListener('click', () => {
    const concepto = document.getElementById('nuevo-concepto').value.trim();
    const materia = document.getElementById('nueva-materia').value.trim();
    const nota = document.getElementById('nueva-nota').value;
    const fecha = document.getElementById('nueva-fecha').value || new Date().toISOString().split('T')[0];

    if (concepto && materia && nota && !isNaN(nota)) {
      notas.unshift({
        id: Date.now().toString(),
        concepto,
        materia,
        nota: parseFloat(nota).toFixed(2),
        fecha
      });
      guardar();
      render();

      document.getElementById('nuevo-concepto').value = '';
      document.getElementById('nueva-materia').value = '';
      document.getElementById('nueva-nota').value = '';
      document.getElementById('nueva-fecha').value = '';
      document.getElementById('nuevo-concepto').focus();
    }
  });

  render();
}

// ==================== TOP SECRET 2º ESO INS CAN PLANAS ====================
if (document.getElementById('nueva-excusa')) {

  // EXCUSAS CREÍBLES PARA PROFES DEL CAN PLANAS
  const excusas = [
    "Es que ayer tuvimos entrenamiento de fútbol hasta las 9 y no pude hacer los deberes.",
    "Mi madre me tuvo que ir al médico de urgencia y me quedé solo con mis hermanos pequeños.",
    "Se me olvidó la libreta en el instituto y no pude hacer nada.",
    "Tuve que ir al dentista y me pusieron anestesia, no podía ni escribir.",
    "Mi hermana pequeña me borró todo del ordenador sin querer.",
    "Estuve todo el finde en casa de mi abuela en el pueblo sin wifi.",
    "Me quedé sin batería en el móvil y no pude ver Classroom.",
    "Tenía partido importante y llegué a casa a las 10 de la noche muerto.",
    "Me salió una alergia a los apuntes (en serio, tengo foto del sarpullido).",
    "Mi perro se comió literalmente mi estuche con todo dentro.",
    "Se me rompió la mochila y se me cayeron todos los libros al río.",
    "Estuve ayudando a mi padre en el taller y no tuve tiempo.",
    "Tuve migraña fuerte y no podía ni mirar la pantalla.",
    "Me confundí de semana y pensé que era para la próxima.",
    "Mi primo pequeño me rayó toda la libreta con rotulador permanente.",
    "¡Te lo juro que lo hice pero se me quedó en casa encima de la mesa!"
  ];

  const excusaElement = document.getElementById('excusa');

  document.getElementById('nueva-excusa').addEventListener('click', () => {
    const random = excusas[Math.floor(Math.random() * excusas.length)];
    excusaElement.textContent = random;
    excusaElement.style.animation = 'none';
    setTimeout(() => excusaElement.style.animation = 'pulse 0.6s', 10);
  });

  // Excusa al cargar la página
  excusaElement.textContent = excusas[Math.floor(Math.random() * excusas.length)];

  // RECURSOS PERFECTOS PARA 2º ESO
  const resultados = document.getElementById('resultados-recursos');
  const buscador = document.getElementById('buscador-recursos');

  const recursos = [
    { nombre: "Matemáticas 2º ESO completas", url: "https://www.matesfacil.com/2eso/", tags: "mates matemáticas 2 eso ecuaciones fracciones" },
    { nombre: "Física y Química 2º ESO", url: "https://www.fisquiweb.es/2eso/", tags: "física química 2 eso densidad fuerzas" },
    { nombre: "Lengua 2º ESO (ortografía y sintaxis)", url: "https://www.reglasdeortografia.com/2eso", tags: "lengua castellana ortografía sintaxis" },
    { nombre: "Inglés 2º ESO (gramática + ejercicios)", url: "https://www.perfect-english-grammar.com/", tags: "inglés english present simple past" },
    { nombre: "Ciencias Sociales 2º ESO (mapas + historia)", url: "https://www.educacion.es/recursoseso/sociales2", tags: "sociales geografía historia edad media" },
    { nombre: "Biología y Geología 2º ESO", url: "https://biologia-geologia.com/2eso/", tags: "biología geología células ecosistemas" },
    { nombre: "Tecnología 2º ESO (proyectos)", url: "https://www.tecnologia2eso.com/", tags: "tecnología electricidad mecanismos" },
    { nombre: "Khan Academy 2º ESO (todo en español)", url: "https://es.khanacademy.org/math/es-segundo-de-eso", tags: "khan academy mates física química" },
    { nombre: "Apuntes completos 2º ESO (PDF)", url: "https://www.apunteseso.com/2eso", tags: "apuntes pdf descargar 2 eso" },
    { nombre: "Educatina 2º ESO (vídeos brutales)", url: "https://www.educatina.com/cursos-segundo-eso", tags: "vídeos clases educatina 2 eso" }
  ];

  function buscar() {
    const texto = buscador.value.toLowerCase().trim();
    resultados.innerHTML = '';

    if (!texto) {
      resultados.innerHTML = `<div class="col-12 text-center text-muted fs-4">Escribe algo como "mates", "física", "inglés"... ¡venga va!</div>`;
      return;
    }

    const encontrados = recursos.filter(r => r.tags.includes(texto));

    if (encontrados.length === 0) {
      resultados.innerHTML = `<div class="col-12 text-center">No encontré nada con "${texto}"... prueba con otra palabra 😅</div>`;
      return;
    }

    encontrados.forEach(r => {
      const card = document.createElement('div');
      card.className = 'col';
      card.innerHTML = `
        <div class="card h-100 shadow hover-lift border-0">
          <div class="card-body d-flex flex-column p-4">
            <h5 class="card-title">${r.nombre}</h5>
            <a href="${r.url}" target="_blank" class="btn btn-success mt-auto">¡Abrir recurso!</a>
          </div>
        </div>
      `;
      resultados.appendChild(card);
    });
  }

  buscador.addEventListener('input', buscar);
  buscar(); // mensaje inicial
}// ==================== TOP SECRET 2º ESO INS CAN PLANAS (con MUCHOS MÁS RECURSOS + EXÁMENES) ====================
if (document.getElementById('nueva-excusa')) {

  // Excusas (igual que antes, creíbles para 2º ESO)
  const excusas = [
    "Es que ayer tuvimos entrenamiento de fútbol hasta las 9 y no pude hacer los deberes.",
    "Mi madre me tuvo que ir al médico de urgencia y me quedé solo con mis hermanos pequeños.",
    "Se me olvidó la libreta en el instituto y no pude hacer nada.",
    "Tuve que ir al dentista y me pusieron anestesia, no podía ni escribir.",
    "Mi hermana pequeña me borró todo del ordenador sin querer.",
    "Estuve todo el finde en casa de mi abuela en el pueblo sin wifi.",
    "Me quedé sin batería en el móvil y no pude ver Classroom.",
    "Tenía partido importante y llegué a casa a las 10 de la noche muerto.",
    "Me salió una alergia a los apuntes (en serio, tengo foto del sarpullido).",
    "Mi perro se comió literalmente mi estuche con todo dentro.",
    "Se me rompió la mochila y se me cayeron todos los libros al río.",
    "Estuve ayudando a mi padre en el taller y no tuve tiempo.",
    "Tuve migraña fuerte y no podía ni mirar la pantalla.",
    "Me confundí de semana y pensé que era para la próxima.",
    "Mi primo pequeño me rayó toda la libreta con rotulador permanente.",
    "¡Te lo juro que lo hice pero se me quedó en casa encima de la mesa!",
    // Bloque 1 de 100 excusas creíbles
    "Me quedé dormido sin querer revisando los apuntes.",
    "Se me apagó el ordenador justo cuando iba a empezar.",
    "Mi wifi estuvo fallando toda la tarde.",
    "Ayudé a un familiar con algo urgente y no me dio tiempo.",
    "Tuve que cuidar a mi hermano pequeño toda la tarde.",
    "Me confundí de asignatura y hice otros deberes.",
    "Mi móvil no cargaba y no pude ver la tarea.",
    "Me dolía mucho la cabeza y tuve que descansar.",
    "Mi padre necesitaba ayuda en casa todo el día.",
    "Se me borró el archivo sin querer.",
    "No encontraba el libro por ningún lado.",
    "Pensé que ya lo había entregado.",
    "Creí que no había deberes hoy.",
    "La tarea no me cargaba en Classroom.",
    "Mi gato se durmió encima de mi cuaderno y lo manchó.",
    "Tuve un imprevisto familiar.",
    "Se me rompió el lápiz digital y no pude escribir.",
    "No entendía el ejercicio y nadie me respondía.",
    "Tenía fiebre y me quedé en la cama.",
    "Fui al médico y volví muy tarde.",
    "Tenía que estudiar para otro examen urgente.",
    "Me quedé sin luz en casa un rato.",
    "Se me actualizó el ordenador y tardó muchísimo.",
    "Ayudé a un amigo que estaba mal.",
    "Tuve que salir inesperadamente con mi familia.",
    "Estuve toda la tarde fuera por un compromiso.",
    "Mi padre necesitaba el ordenador para trabajar.",
    "Tuve que cuidar a mi primo pequeño.",
    "No encontraba la tarea en la agenda.",
    "Se me olvidó mirar Classroom.",
    "Mi conexión iba super lenta.",
    "Pensé que era para entregar mañana.",
    "Mi madre necesitó ayuda con algo urgente.",
    "Tenía la cabeza fatal y no podía concentrarme.",
    "Se me cayó agua sobre los apuntes.",
    "Olvidé el cuaderno en casa de un amigo.",
    "Estuve en una reunión familiar.",
    "Perdí la hoja donde apunté la tarea.",
    "No tenía datos en el móvil.",
    "Mi ordenador se sobrecalentaba.",
    "Creí que no hacía falta entregarlo.",
    "Se me olvidó completamente revisarlo.",
    "Tuve visita en casa y no pude ponerme.",
    "No pude imprimir lo que necesitaba.",
    "Me quedé sin lápiz/boli.",
    "Estuve todo el día fuera por actividades.",
    "Mi madre me hizo desconectar temprano.",
    "Estuve ayudando con compras familiares.",
    "Tuve un pequeño accidente deportivo.",
    "No entendí el ejercicio y me bloqueé.",
    "Pensé que el profe dijo que no había tarea.",
    "No me funcionaba la app del cole.",
    "Tenía que hacer otro trabajo urgente.",
    "Me dolía la vista por estar mucho rato en el ordenador.",
    "Se me olvidó el libro en mi taquilla.",
    "Mi primo estaba enfermo y lo cuidé.",
    "Había mucho ruido en casa y no podía concentrarme.",
    "Estuve con tema médico toda la tarde.",
    "Tuve una reunión importante.",
    "El internet se cortó por obras.",
    "Mi abuela necesitó ayuda.",
    "Me puse malo de repente.",
    "Estuve acompañando a alguien al médico.",
    "No funcionaba mi cuenta.",
    "No pude acceder al libro digital.",
    "Mi vecino necesitaba ayuda.",
    "Se me olvidó completamente.",
    "Pensé que no era obligatorio.",
    "Estuve resfriado.",
    "Tuve que organizar mis cosas.",
    "Me surgió algo de última hora.",
    "Tenía que preparar otro trabajo.",
    "Tuve un día muy complicado.",
    "Me equivoqué de ejercicio.",
    "Mi familia vino de visita.",
    "Había demasiadas cosas pasando en casa.",
    "Mi wifi se reiniciaba a cada rato.",
    "Estuve ocupado con otros trabajos."
  ];

  const excusaElement = document.getElementById('excusa');

  document.getElementById('nueva-excusa').addEventListener('click', () => {
    const random = excusas[Math.floor(Math.random() * excusas.length)];
    excusaElement.textContent = random;
    excusaElement.style.animation = 'none';
    setTimeout(() => excusaElement.style.animation = 'pulse 0.6s', 10);
  });

  excusaElement.textContent = excusas[Math.floor(Math.random() * excusas.length)];

  // MUCHÍSIMOS MÁS RECURSOS ACTUALIZADOS 2025 PARA 2º ESO + EXÁMENES
  const resultados = document.getElementById('resultados-recursos');
  const buscador = document.getElementById('buscador-recursos');

  const recursos = [
    // MATEMÁTICAS
    { nombre: "Apuntes y ejercicios Mates 2º ESO (PDF gratis)", url: "https://tipsacademy.es/recursos/2eso/", tags: "mates matemáticas ecuaciones fracciones 2 eso" },
    { nombre: "Khan Academy Mates 2º ESO (vídeos interactivos)", url: "https://es.khanacademy.org/math/es-segundo-de-eso", tags: "khan academy mates 2 eso ecuaciones" },
    { nombre: "Hojas de problemas Mates 2º ESO", url: "https://www.educa2.madrid.org/web/dpto_matematicas1/recursos-2-eso", tags: "mates problemas 2 eso algebra" },
    { nombre: "Apuntes Mates ESO (Academia del Tabilbao)", url: "https://www.academiadeltabilbao.com/apuntes/", tags: "apuntes mates eso 2" },

    // LENGUA
    { nombre: "Ortografía y sintaxis Lengua 2º ESO", url: "https://www.reglasdeortografia.com/2eso", tags: "lengua castellana ortografía 2 eso" },
    { nombre: "Apuntes Lengua Castellana (Wuolah)", url: "https://wuolah.com/estudios-espana/eso", tags: "apuntes lengua 2 eso oraciones" },
    { nombre: "Ejercicios Lengua 2º ESO (Studocu)", url: "https://www.studocu.com/es/high-school-degree/eso/41", tags: "lengua ejercicios 2 eso literatura" },

    // FÍSICA Y QUÍMICA
    { nombre: "Apuntes y exámenes FyQ 2º ESO (FisQuiWeb)", url: "https://fisquiweb.es/Apuntes/apun2.htm", tags: "física química 2 eso densidad fuerzas" },
    { nombre: "Cuaderno FyQ 2º ESO (apuntes + ejercicios)", url: "https://www.studocu.com/es/document/instituto-de-educacion-secundaria-leopoldo-queipo/fisica-y-quimica/cuaderno-2o-eso-apuntes-y-ejercicios-2-eso-fisica-y-quimica/83154370", tags: "fyq apuntes 2 eso" },
    { nombre: "Recursos FyQ 2º ESO (FiQuiPedia)", url: "https://www.fiquipedia.es/home/recursos/recursos-por-materia-curso/recursos-fisica-y-quimica-2-eso/", tags: "física química recursos 2 eso exámenes" },
    { nombre: "Exámenes FyQ 2º ESO 2025 (con soluciones)", url: "https://www.recursoseso.com/2025/01/11/examenes-2a-evaluacion-de-fisica-y-quimica-de-2o-eso/", tags: "exámenes fyq 2 eso 2025" },
    { nombre: "Vídeos FyQ 2º ESO (Unicoos)", url: "https://www.unicoos.com/curso/2-eso", tags: "vídeos fyq 2 eso clases" },

    // INGLÉS
    { nombre: "Gramática e ejercicios Inglés 2º ESO", url: "https://www.perfect-english-grammar.com/", tags: "inglés english 2 eso present simple" },
    { nombre: "Apuntes Inglés 2º ESO (Tips Academy)", url: "https://tipsacademy.es/recursos/2eso/", tags: "inglés apuntes 2 eso b1" },
    { nombre: "Ejercicios Inglés ESO (Wuolah)", url: "https://wuolah.com/estudios-espana/eso", tags: "inglés ejercicios 2 eso" },

    // CIENCIAS SOCIALES
    { nombre: "Geografía e Historia 2º ESO (INTEF)", url: "https://intef.es/recursos-2/secundaria-y-bachillerato/", tags: "sociales geografía historia 2 eso edad media" },
    { nombre: "Apuntes Sociales 2º ESO (Studocu)", url: "https://www.studocu.com/es/high-school-degree/eso/41", tags: "ciencias sociales 2 eso mapas" },

    // BIOLOGÍA Y GEOLOGÍA
    { nombre: "Apuntes Biología y Geología 2º ESO", url: "https://biologia-geologia.com/2eso/", tags: "biología geología 2 eso células ecosistemas" },
    { nombre: "Recursos Biología ESO (INTEF)", url: "https://intef.es/recursos-2/secundaria-y-bachillerato/", tags: "biología 2 eso recursos" },

    // TECNOLOGÍA
    { nombre: "Apuntes Tecnología 2º ESO (IES Zaframagón)", url: "https://ieszaframagon.com/recursos/apuntes-b%C3%A1sicos-tecnolog%C3%ADa-2%C2%BA-3%C2%BA-eso", tags: "tecnología 2 eso electricidad mecanismos" },
    { nombre: "Ejercicios Tecnología 2º ESO (Recursos ESO)", url: "https://www.recursoseso.com/", tags: "tecnología ejercicios 2 eso proyectos" },

    // GENERAL / EXÁMENES
    { nombre: "Todos los apuntes 2º ESO (Studocu)", url: "https://www.studocu.com/es/high-school-degree/eso/41", tags: "apuntes 2 eso todos exámenes" },
    { nombre: "Recursos ESO (Recursos ESO Blog)", url: "https://www.recursoseso.com/", tags: "recursos 2 eso exámenes 2025" },
    { nombre: "Apuntes y ejercicios ESO (Wuolah)", url: "https://wuolah.com/estudios-espana/eso", tags: "apuntes eso 2 exámenes pdf" },
    { nombre: "Materiales ESO (INTEF Procomún)", url: "https://intef.es/recursos-2/secundaria-y-bachillerato/", tags: "materiales eso 2 gratis" },
    { nombre: "Exámenes y apuntes 2º ESO (Tips Academy)", url: "https://tipsacademy.es/recursos/2eso/", tags: "exámenes 2 eso mates lengua fyq" },
    { nombre: "Vídeos y clases 2º ESO (Unicoos)", url: "https://www.unicoos.com/curso/2-eso", tags: "vídeos 2 eso todas materias" },
    { nombre: "Apuntes FyQ 2º ESO (FisQuiPedia)", url: "https://www.fiquipedia.es/home/recursos/recursos-por-materia-curso/recursos-fisica-y-quimica-2-eso/apuntes-elaboracion-propia-fisica-y-quimica-2-eso/", tags: "apuntes fyq 2 eso pdf" },
    { nombre: "Recursos Joaquín Rodrigo FyQ 2º ESO", url: "http://recursos-joaquinrodrigo.blogspot.com/p/fy.html", tags: "recursos fyq 2 eso exámenes" },
    { nombre: "Lecturas FyQ 2º ESO (Jimdo)", url: "https://leoncienciaytecnica.jimdofree.com/f%C3%ADsica-y-qu%C3%ADmica-2%C2%BAeso/", tags: "lecturas fyq 2 eso fuerzas newton" },
    { nombre: "Apuntes ESO (Academia del Tabilbao)", url: "https://www.academiadeltabilbao.com/apuntes/", tags: "apuntes eso 2 todas materias" }
  ];

  function buscar() {
    const texto = buscador.value.toLowerCase().trim();
    resultados.innerHTML = '';

    if (!texto) {
      resultados.innerHTML = `<div class="col-12 text-center text-muted fs-4"></div>`;
      return;
    }

    const encontrados = recursos.filter(r => r.tags.includes(texto));

    if (encontrados.length === 0) {
      resultados.innerHTML = `<div class="col-12 text-center">No encontré nada con "${texto}"... prueba con "mates", "fyq", "exámenes"... 😅</div>`;
      return;
    }

    encontrados.forEach(r => {
      const card = document.createElement('div');
      card.className = 'col';
      card.innerHTML = `
        <div class="card h-100 shadow hover-lift border-0">
          <div class="card-body d-flex flex-column p-4">
            <h5 class="card-title">${r.nombre}</h5>
            <a href="${r.url}" target="_blank" class="btn btn-success mt-auto">¡Abrir recurso!</a>
          </div>
        </div>
      `;
      resultados.appendChild(card);
    });
  }

  buscador.addEventListener('input', buscar);
  buscar(); // mensaje inicial
}


// ==================== EXTRAS DEL CAN PLANAS (extras.html) ====================
if (document.body.contains(document.getElementById('frase-dia'))) {

  // 3. Frase + vacaciones
  const frases = [
    "Hoy es un gran día para ser el mejor de 2º ESO 🔥",
    "Cada pomodoro te acerca más a las vacaciones 🏖️",
    "Tú puedes con mates, física y con todo 💪",
    "El que la sigue la consigue, crack del Can Planas 😈",
    "Un día más cerca de ser una leyenda del insti"
  ];
  document.getElementById('frase-dia').textContent = frases[Math.floor(Math.random() * frases.length)];

  function diasVacaciones() {
    const hoy = new Date();
    const navidad = new Date(hoy.getFullYear(), 11, 22); // 22 dic
    if (hoy > navidad) navidad.setFullYear(hoy.getFullYear() + 1);
    const diff = navidad - hoy;
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    document.getElementById('vacaciones').textContent = `🎄 Faltan ${dias} días para NAVIDAD`;
  }
  diasVacaciones();

  // 1. Calendario exámenes
  const listaEx = document.getElementById('lista-examenes');
  let examenes = JSON.parse(localStorage.getItem('examenesCanPlanas')) || [];

  function renderEx() {
    listaEx.innerHTML = '';
    examenes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    examenes.forEach((e, i) => {
      const dias = Math.ceil((new Date(e.fecha) - new Date()) / 86400000);
      const div = document.createElement('div');
      div.className = 'alert alert-info d-flex justify-content-between align-items-center';
      div.innerHTML = `<strong>${e.nombre}</strong> — ${new Date(e.fecha).toLocaleDateString('es-ES')} (${dias > 0 ? 'Faltan ' + dias + ' días' : '¡HOY!'})`;
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-danger';
      btn.textContent = '✕';
      btn.onclick = () => { examenes.splice(i, 1); localStorage.setItem('examenesCanPlanas', JSON.stringify(examenes)); renderEx(); };
      div.appendChild(btn);
      listaEx.appendChild(div);
    });
  }

  document.getElementById('add-exam').onclick = () => {
    const nombre = document.getElementById('exam-nombre').value.trim();
    const fecha = document.getElementById('exam-fecha').value;
    if (nombre && fecha) {
      examenes.push({ nombre, fecha });
      localStorage.setItem('examenesCanPlanas', JSON.stringify(examenes));
      document.getElementById('exam-nombre').value = '';
      renderEx();
    }
  };
  renderEx();

  // 9. Sticky notes
  const stickies = document.getElementById('stickies');
  let notas = JSON.parse(localStorage.getItem('stickiesCanPlanas')) || [];

  function renderSticky() {
    stickies.innerHTML = '';
    notas.forEach((n, i) => {
      const div = document.createElement('div');
      div.className = 'sticky';
      div.textContent = n;
      const x = document.createElement('span');
      x.textContent = '✕';
      x.style.cssText = 'position:absolute; top:5px; right:10px; cursor:pointer; font-weight:bold;';
      x.onclick = () => { notas.splice(i, 1); localStorage.setItem('stickiesCanPlanas', JSON.stringify(notas)); renderSticky(); };
      div.appendChild(x);
      stickies.appendChild(div);
    });
  }

  document.getElementById('add-nota').onclick = () => {
    const t = document.getElementById('nueva-nota').value.trim();
    if (t) {
      notas.push(t);
      localStorage.setItem('stickiesCanPlanas', JSON.stringify(notas));
      document.getElementById('nueva-nota').value = '';
      renderSticky();
    }
  };
  renderSticky();

  // 7. Lo-fi
  const lofi = document.getElementById('lofi');
  document.getElementById('play-lofi').onclick = () => lofi.play();
  document.getElementById('stop-lofi').onclick = () => lofi.pause();

  // 8. Ranking
  document.getElementById('rank-pomos').textContent = localStorage.getItem('pomodorosTotales') || 0;
  document.getElementById('rank-tareas').textContent = JSON.parse(localStorage.getItem('myStudentTareasPomodoro') || '[]').filter(t => t.hecha).length;
  const med = document.getElementById('medalla');
  const p = parseInt(document.getElementById('rank-pomos').textContent);
  med.textContent = p >= 100 ? "🏆" : p >= 50 ? "🥇" : p >= 20 ? "🥈" : p >= 10 ? "🥉" : "🌟";

  // 5 + 10. Modo examen + fiesta
  document.getElementById('modo-examen').onclick = () => {
    document.body.style.background = '#000';
    document.querySelector('main').innerHTML = '<div class="text-center text-white display-1">MODO EXAMEN ACTIVADO<br><small>¡Sin distracciones!</small></div>';
  };

  // Confeti (para la fiesta)
  const canvas = document.getElementById('confeti');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  document.getElementById('fiesta').onclick = () => {
    alert("¡ENHORABUENA CRACK DEL CAN PLANAS! 🎉");
    let particles = [];
    const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff'];
    const boom = () => {
      particles = [];
      for (let i = 0; i < 300; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: Math.random() * 10 - 5,
          vy: Math.random() * 10 - 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4
        });
      }
    };
    boom();
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(animate);
    };
    animate();
  };
}

/* ========= CONFIGURACIÓN ========= */

// Hash SHA-256 de la contraseña real: "1234"
// Generado desde: https://emn178.github.io/online-tools/sha256.html
const PASSWORD_HASH = "a2ddc727ac52753df03d00c51d5f7e8daa8eab2e718757227df8caf6eaed930b";

// Clave donde se guarda la sesión
const SESSION_KEY = "mystudent_secret_access";


/* ========= INICIO AUTOMÁTICO ========= */

document.addEventListener("DOMContentLoaded", () => {
  const isLogged = localStorage.getItem(SESSION_KEY);

  if (isLogged === "true") {
    showSecretSection();
  } else {
    showLogin();
  }
});


/* ========= FUNCIÓN PRINCIPAL LOGIN ========= */

async function login() {
  const input = document.getElementById("password-input").value.trim();
  if (!input) return alert("Introduce la contraseña");

  const hash = await sha256(input);

  if (hash === PASSWORD_HASH) {
    localStorage.setItem(SESSION_KEY, "true");
    showSecretSection();
  } else {
    alert("Contraseña incorrecta");
  }
}


/* ========= LOGOUT ========= */

function logout() {
  localStorage.removeItem(SESSION_KEY);
  showLogin();
}


/* ========= CONTROL DE VISTAS ========= */

function showSecretSection() {
  document.getElementById("login-box").style.display = "none";
  document.getElementById("secret-box").style.display = "block";
}

function showLogin() {
  document.getElementById("secret-box").style.display = "none";
  document.getElementById("login-box").style.display = "block";
}

// Función sha256: devuelve el hash SHA-256 en hex (usa Web Crypto API)
async function sha256(message) {
  if (!window.crypto || !crypto.subtle) {
    // Fallback minimal — en navegadores muy antiguos no funcionará correctamente
    throw new Error('Web Crypto API no disponible en este navegador.');
  }
  const msgUint8 = new TextEncoder().encode(message);                     // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);     // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer));               // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  return hashHex;
}


// ==================== MENÚ RESPONSIVE ====================
const menuToggle = document.querySelector('.menu-toggle');
const aside = document.querySelector('aside');

menuToggle.addEventListener('click', () => {
  aside.classList.toggle('open');
});