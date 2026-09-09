// MODO OSCURO: se recuerda la preferencia del usuario entre visitas
const darkModeToggle = document.getElementById('dark-mode-toggle');
const DARK_MODE_KEY = 'elalebrije-dark-mode';

function aplicarModoOscuro(activar) {
    document.body.classList.toggle('dark-mode', activar);
    if (darkModeToggle) {
        darkModeToggle.setAttribute('aria-pressed', activar ? 'true' : 'false');
        darkModeToggle.title = activar ? 'Modo claro' : 'Modo oscuro';
    }
}

aplicarModoOscuro(localStorage.getItem(DARK_MODE_KEY) === 'true');

if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        const activo = !document.body.classList.contains('dark-mode');
        aplicarModoOscuro(activo);
        localStorage.setItem(DARK_MODE_KEY, activo ? 'true' : 'false');
    });
}

// =====================================================================
// PANEL OCULTO DE EDICIÓN (Menú, Noticias, Promociones)
// =====================================================================
// El panel NO aparece para nadie por defecto. Solo se activa entrando a
// esta página con el siguiente texto pegado al final del link, en la barra
// de direcciones:
//
//   #panel-secreto-alebrije
//
// Ejemplo: https://tu-usuario.github.io/cafe-el-alebrije/#panel-secreto-alebrije
//
// Al entrar así, pide una contraseña (la que se configuró en Vercel, variable
// ADMIN_PASSWORD). Si es correcta, aparecen los botones de "editar" en Menú,
// Noticias y Promociones. Los cambios que se guarden ahí se ven de inmediato
// para CUALQUIER visitante del sitio, en cualquier dispositivo.
//
// ⚠️ Cambia "panel-secreto-alebrije" por otra palabra tuya antes de publicar,
// para que sea aún más difícil de adivinar.
const PANEL_SECRETO_HASH = '#panel-secreto-alebrije';
const ADMIN_SESSION_KEY = 'elalebrije-admin-activo';

// ⚠️ Mismo dominio de Vercel que configuraste para Mercado Pago.
const API_BASE_URL = 'https://cafeteria-cultural-el-alebrije.vercel.app/api';

let modoAdmin = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
let contenidoServidor = { noticias: null, promociones: null, menu: {}, podcast: null, videos: null, recetas: null, inicio: null, info: null, menuNuevos: null, menuSabores: null };

function mostrarBotonesAdmin(mostrar){
    document.querySelectorAll('.solo-admin').forEach((el) => {
        el.hidden = !mostrar;
    });
}

async function intentarActivarPanelSecreto(){
    if (window.location.hash !== PANEL_SECRETO_HASH) return;

    // Limpia el hash de la barra de direcciones para que no quede visible.
    history.replaceState(null, '', window.location.pathname + window.location.search);

    if (modoAdmin) {
        mostrarBotonesAdmin(true);
        return;
    }

    const clave = window.prompt('Contraseña del panel de edición:');
    if (!clave) return;

    try {
        const resp = await fetch(`${API_BASE_URL}/admin-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: clave })
        });
        const datos = await resp.json();
        if (resp.ok && datos.ok) {
            modoAdmin = true;
            sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
            mostrarBotonesAdmin(true);
            alert('Panel de edición activado en esta pestaña.');
        } else {
            alert('Contraseña incorrecta.');
        }
    } catch (err) {
        console.error('Error activando panel:', err);
        alert('No se pudo conectar con el panel. Revisa tu conexión.');
    }
}

// Contraseña guardada para esta sesión (para no pedirla en cada guardado).
function obtenerClaveAdmin(){
    return sessionStorage.getItem('elalebrije-admin-clave') || '';
}

async function guardarContenidoEnServidor(tipo, datos){
    let clave = obtenerClaveAdmin();
    if (!clave) {
        clave = window.prompt('Contraseña del panel para guardar el cambio:') || '';
        if (!clave) return false;
    }

    try {
        const resp = await fetch(`${API_BASE_URL}/content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo, datos, password: clave })
        });
        if (resp.status === 401) {
            alert('Contraseña incorrecta. El cambio no se guardó.');
            sessionStorage.removeItem('elalebrije-admin-clave');
            return false;
        }
        if (!resp.ok) throw new Error('Respuesta no válida');
        sessionStorage.setItem('elalebrije-admin-clave', clave);
        return true;
    } catch (err) {
        console.error('Error guardando en servidor:', err);
        alert('No se pudo guardar el cambio. Revisa tu conexión e intenta de nuevo.');
        return false;
    }
}

// Trae el contenido actual del servidor (si existe) antes de pintar nada.
// Si el servidor no responde (sin internet, Vercel no configurado aún, etc.)
// el sitio sigue funcionando con las listas de este archivo.
const cargaContenidoServidor = fetch(`${API_BASE_URL}/content`)
    .then((r) => r.ok ? r.json() : null)
    .then((datos) => {
        if (datos) contenidoServidor = datos;
    })
    .catch((err) => console.warn('No se pudo cargar contenido del servidor, usando el local:', err));

// =====================================================================
// NOTICIAS Y EVENTOS
// =====================================================================
// Esta es la lista de noticias/eventos que se muestran en la sección
// "Noticias" del inicio. Es solo el punto de partida: en cuanto el panel
// oculto de edición guarda un cambio, el sitio usa esa versión en vez de
// esta lista, para todos los visitantes.
//
//   { fecha: "Sáb 14 sep", etiqueta: "Evento", titulo: "...", descripcion: "..." }
//
//   - fecha: texto corto, como se quiera mostrar (ej. "Sáb 14 sep", "Todo septiembre").
//   - etiqueta: una palabra para clasificarla (ej. "Evento", "Aviso", "Exposición").
//   - titulo / descripcion: el texto de la tarjeta.
const NOTICIAS = [

    {
        fecha: 'Sáb 14 sep',
        etiqueta: 'Evento',
        titulo: 'Noche de jazz en el patio',
        descripcion: 'Música en vivo desde las 8 PM. Entrada libre, consumo en barra.'
    },
    {
        fecha: 'Todo septiembre',
        etiqueta: 'Exposición',
        titulo: 'Alebrijes de papel maché',
        descripcion: 'Exhibición de artesanos locales en nuestro salón principal, todo el mes.'
    },
    {
        fecha: 'Aviso',
        etiqueta: 'Importante',
        titulo: 'Cerramos temprano el 16 de septiembre',
        descripcion: 'Por el desfile del barrio, cerraremos a las 3:00 PM ese día.'
    }
];

// PIN para poder editar las noticias desde el botón "Administrar noticias"
// del sitio. Cámbialo por uno que solo tú conozcas.
const NOTICIAS_PIN = '2026';
const NOTICIAS_STORAGE_KEY = 'elalebrije-noticias';

function obtenerNoticiasActuales(){
    if (contenidoServidor.noticias) return contenidoServidor.noticias;
    try {
        const guardadas = localStorage.getItem(NOTICIAS_STORAGE_KEY);
        if (guardadas) return JSON.parse(guardadas);
    } catch (err) { /* si algo falla, se usa la lista NOTICIAS de arriba */ }
    return NOTICIAS;
}

function pintarNoticias(){
    const grid = document.getElementById('noticias-grid');
    const vacio = document.getElementById('noticias-vacio');
    if (!grid) return;

    // Las noticias automáticas (agregadas solas al crear un producto/sabor
    // nuevo) se ocultan solas después de 1 día completo, como si nunca
    // hubieran estado. Las noticias puestas a mano nunca se ocultan.
    const noticias = obtenerNoticiasActuales().filter((n) => !n.automatica || esReciente(n.creadaEn));
    grid.innerHTML = '';

    if (!noticias.length) {
        if (vacio) vacio.hidden = false;
        return;
    }
    if (vacio) vacio.hidden = true;

    noticias.forEach((n) => {
        const card = document.createElement('article');
        card.className = 'noticia-card';
        card.innerHTML = `
            <div class="noticia-card-top">
                <span class="noticia-fecha">📅 ${n.fecha || ''}</span>
                ${n.etiqueta ? `<span class="noticia-etiqueta">${n.etiqueta}</span>` : ''}
            </div>
            <h3>${n.titulo || ''}</h3>
            <p>${n.descripcion || ''}</p>
        `;
        grid.appendChild(card);
    });
}

pintarNoticias();

// ---- Panel para agregar/editar/borrar noticias desde el sitio ----
const noticiasAdminBtn = document.getElementById('noticias-admin-btn');
const noticiasModal = document.getElementById('noticias-modal');
const noticiasModalClose = document.getElementById('noticias-modal-close');
const noticiasModalLista = document.getElementById('noticias-modal-lista');
const noticiasModalAgregar = document.getElementById('noticias-modal-agregar');
const noticiasModalGuardar = document.getElementById('noticias-modal-guardar');
const noticiasModalCopiar = document.getElementById('noticias-modal-copiar');
const noticiasModalCopiado = document.getElementById('noticias-modal-copiado');

let noticiasEnEdicion = [];
let noticiasDesbloqueadas = false;

function crearFilaNoticia(n, index){
    const wrap = document.createElement('div');
    wrap.className = 'noticia-form';
    wrap.innerHTML = `
        <div class="noticia-form-row">
            <div style="flex:1">
                <label>Fecha</label>
                <input type="text" class="n-fecha" placeholder="Ej. Sáb 14 sep">
            </div>
            <div style="flex:1">
                <label>Etiqueta</label>
                <input type="text" class="n-etiqueta" placeholder="Ej. Evento">
            </div>
        </div>
        <label>Título</label>
        <input type="text" class="n-titulo" placeholder="Título de la noticia">
        <label style="margin-top:10px">Descripción</label>
        <textarea class="n-descripcion" placeholder="Detalles del evento o aviso"></textarea>
        <div style="margin-top:10px; text-align:right;">
            <button type="button" class="noticia-form-eliminar">🗑 Eliminar esta noticia</button>
        </div>
    `;
    wrap.querySelector('.n-fecha').value = n.fecha || '';
    wrap.querySelector('.n-etiqueta').value = n.etiqueta || '';
    wrap.querySelector('.n-titulo').value = n.titulo || '';
    wrap.querySelector('.n-descripcion').value = n.descripcion || '';
    wrap.querySelector('.noticia-form-eliminar').addEventListener('click', () => {
        noticiasEnEdicion.splice(index, 1);
        pintarFormularioNoticias();
    });
    return wrap;
}

function pintarFormularioNoticias(){
    if (!noticiasModalLista) return;
    noticiasModalLista.innerHTML = '';
    noticiasEnEdicion.forEach((n, i) => {
        noticiasModalLista.appendChild(crearFilaNoticia(n, i));
    });
}

function leerFormularioNoticias(){
    const filas = [...noticiasModalLista.querySelectorAll('.noticia-form')];
    return filas.map((fila) => ({
        fecha: fila.querySelector('.n-fecha').value.trim(),
        etiqueta: fila.querySelector('.n-etiqueta').value.trim(),
        titulo: fila.querySelector('.n-titulo').value.trim(),
        descripcion: fila.querySelector('.n-descripcion').value.trim()
    })).filter((n) => n.titulo); // ignora tarjetas que se dejaron sin título
}

function abrirNoticiasModal(){
    if (!noticiasModal) return;
    noticiasEnEdicion = obtenerNoticiasActuales().map((n) => ({...n}));
    pintarFormularioNoticias();
    if (noticiasModalCopiado) noticiasModalCopiado.classList.remove('show');
    noticiasModal.classList.add('open');
}

function cerrarNoticiasModal(){
    if (noticiasModal) noticiasModal.classList.remove('open');
}

if (noticiasAdminBtn) {
    noticiasAdminBtn.addEventListener('click', () => {
        abrirNoticiasModal();
    });
}
if (noticiasModalClose) noticiasModalClose.addEventListener('click', cerrarNoticiasModal);
if (noticiasModal) {
    noticiasModal.addEventListener('click', (e) => {
        if (e.target === noticiasModal) cerrarNoticiasModal();
    });
}
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && noticiasModal && noticiasModal.classList.contains('open')) {
        cerrarNoticiasModal();
    }
});

if (noticiasModalAgregar) {
    noticiasModalAgregar.addEventListener('click', () => {
        noticiasEnEdicion = leerFormularioNoticias();
        noticiasEnEdicion.push({ fecha: '', etiqueta: 'Evento', titulo: '', descripcion: '' });
        pintarFormularioNoticias();
    });
}

if (noticiasModalGuardar) {
    noticiasModalGuardar.addEventListener('click', async () => {
        const nuevas = leerFormularioNoticias();
        noticiasModalGuardar.disabled = true;
        const ok = await guardarContenidoEnServidor('noticias', nuevas);
        noticiasModalGuardar.disabled = false;
        if (!ok) return;
        contenidoServidor.noticias = nuevas;
        try {
            localStorage.setItem(NOTICIAS_STORAGE_KEY, JSON.stringify(nuevas));
        } catch (err) { /* almacenamiento no disponible en este navegador */ }
        pintarNoticias();
        cerrarNoticiasModal();
        alert('Noticias actualizadas: ya se ven así para todos los visitantes.');
    });
}

if (noticiasModalCopiar) {
    noticiasModalCopiar.addEventListener('click', () => {
        const nuevas = leerFormularioNoticias();
        const bloque = 'const NOTICIAS = ' + JSON.stringify(nuevas, null, 4).replace(/"([a-zA-Z]+)":/g, '$1:') + ';';
        const avisar = () => {
            if (noticiasModalCopiado) noticiasModalCopiado.classList.add('show');
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(bloque).then(avisar).catch(() => {
                window.prompt('Copia este código manualmente:', bloque);
            });
        } else {
            window.prompt('Copia este código manualmente:', bloque);
        }
    });
}


// =====================================================================
// MÁS PROMOCIONES (sección "Más promociones", debajo de Promoción Desayuno)
// =====================================================================
// Lista de promociones que se muestran en la sección "Más promociones".
// Para agregar, editar o quitar una promoción SIN tocar nada más del
// código, edita esta lista:
//
//   { horario: "Viernes desde las 6:00 PM", titulo: "...", descripcion: "...", precio: "$30" }
//
// TIP: el sitio también trae un botón "✏️ Administrar promociones" (arriba
// de la sección) para agregar/editar/borrar sin tocar código, con el mismo
// PIN que noticias (PROMOCIONES2_PIN, aquí abajo). OJO: esos cambios solo se
// ven en el navegador donde se hicieron. Para que se vean igual para TODAS
// las personas que visiten el sitio, hay que usar el botón "Copiar código
// para el sitio" de ese panel y pegar el resultado aquí, reemplazando esta lista.
const PROMOCIONES2 = [
    {
        horario: 'Viernes desde las 6:00 PM',
        titulo: 'Noche de Karaoke',
        descripcion: 'Ven a cantar con nosotros todos los viernes a partir de las 6 PM. Café americano y capuchino a $30.',
        precio: '$30'
    }
];

// PIN para poder editar las promociones desde el botón "Administrar
// promociones" del sitio. Es el mismo que el de noticias para que sea
// más fácil de recordar; cámbialo por uno que solo tú conozcas si quieres
// usar otro distinto.
const PROMOCIONES2_PIN = NOTICIAS_PIN;
const PROMOCIONES2_STORAGE_KEY = 'elalebrije-promociones2';

function obtenerPromociones2Actuales(){
    if (contenidoServidor.promociones) return contenidoServidor.promociones;
    try {
        const guardadas = localStorage.getItem(PROMOCIONES2_STORAGE_KEY);
        if (guardadas) return JSON.parse(guardadas);
    } catch (err) { /* si algo falla, se usa la lista PROMOCIONES2 de arriba */ }
    return PROMOCIONES2;
}

function pintarPromociones2(){
    const grid = document.getElementById('promo2-grid');
    const vacio = document.getElementById('promo2-vacio');
    if (!grid) return;

    const promos = obtenerPromociones2Actuales();
    grid.innerHTML = '';

    if (!promos.length) {
        if (vacio) vacio.hidden = false;
        return;
    }
    if (vacio) vacio.hidden = true;

    promos.forEach((p) => {
        const card = document.createElement('article');
        card.className = 'promo2-card';
        card.innerHTML = `
            <div class="promo2-card-top">
                <span class="promo2-horario">📅 ${p.horario || ''}</span>
                ${p.precio ? `<span class="promo2-precio">${p.precio}</span>` : ''}
            </div>
            <h3>${p.titulo || ''}</h3>
            <p>${p.descripcion || ''}</p>
        `;
        grid.appendChild(card);
    });
}

pintarPromociones2();

// ---- Panel para agregar/editar/borrar promociones desde el sitio ----
const promo2AdminBtn = document.getElementById('promo2-admin-btn');
const promo2Modal = document.getElementById('promo2-modal');
const promo2ModalClose = document.getElementById('promo2-modal-close');
const promo2ModalLista = document.getElementById('promo2-modal-lista');
const promo2ModalAgregar = document.getElementById('promo2-modal-agregar');
const promo2ModalGuardar = document.getElementById('promo2-modal-guardar');
const promo2ModalCopiar = document.getElementById('promo2-modal-copiar');
const promo2ModalCopiado = document.getElementById('promo2-modal-copiado');

let promos2EnEdicion = [];
let promos2Desbloqueadas = false;

function crearFilaPromo2(p, index){
    const wrap = document.createElement('div');
    wrap.className = 'promo2-form';
    wrap.innerHTML = `
        <div class="promo2-form-row">
            <div style="flex:1">
                <label>Horario</label>
                <input type="text" class="p2-horario" placeholder="Ej. Viernes desde las 6:00 PM">
            </div>
            <div style="flex:1">
                <label>Precio</label>
                <input type="text" class="p2-precio" placeholder="Ej. $30">
            </div>
        </div>
        <label>Título</label>
        <input type="text" class="p2-titulo" placeholder="Título de la promoción">
        <label style="margin-top:10px">Descripción</label>
        <textarea class="p2-descripcion" placeholder="Detalles de la promoción"></textarea>
        <div style="margin-top:10px; text-align:right;">
            <button type="button" class="promo2-form-eliminar">🗑 Eliminar esta promoción</button>
        </div>
    `;
    wrap.querySelector('.p2-horario').value = p.horario || '';
    wrap.querySelector('.p2-precio').value = p.precio || '';
    wrap.querySelector('.p2-titulo').value = p.titulo || '';
    wrap.querySelector('.p2-descripcion').value = p.descripcion || '';
    wrap.querySelector('.promo2-form-eliminar').addEventListener('click', () => {
        promos2EnEdicion.splice(index, 1);
        pintarFormularioPromos2();
    });
    return wrap;
}

function pintarFormularioPromos2(){
    if (!promo2ModalLista) return;
    promo2ModalLista.innerHTML = '';
    promos2EnEdicion.forEach((p, i) => {
        promo2ModalLista.appendChild(crearFilaPromo2(p, i));
    });
}

function leerFormularioPromos2(){
    const filas = [...promo2ModalLista.querySelectorAll('.promo2-form')];
    return filas.map((fila) => ({
        horario: fila.querySelector('.p2-horario').value.trim(),
        precio: fila.querySelector('.p2-precio').value.trim(),
        titulo: fila.querySelector('.p2-titulo').value.trim(),
        descripcion: fila.querySelector('.p2-descripcion').value.trim()
    })).filter((p) => p.titulo); // ignora tarjetas que se dejaron sin título
}

function abrirPromo2Modal(){
    if (!promo2Modal) return;
    promos2EnEdicion = obtenerPromociones2Actuales().map((p) => ({...p}));
    pintarFormularioPromos2();
    if (promo2ModalCopiado) promo2ModalCopiado.classList.remove('show');
    promo2Modal.classList.add('open');
}

function cerrarPromo2Modal(){
    if (promo2Modal) promo2Modal.classList.remove('open');
}

if (promo2AdminBtn) {
    promo2AdminBtn.addEventListener('click', () => {
        abrirPromo2Modal();
    });
}
if (promo2ModalClose) promo2ModalClose.addEventListener('click', cerrarPromo2Modal);
if (promo2Modal) {
    promo2Modal.addEventListener('click', (e) => {
        if (e.target === promo2Modal) cerrarPromo2Modal();
    });
}
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && promo2Modal && promo2Modal.classList.contains('open')) {
        cerrarPromo2Modal();
    }
});

if (promo2ModalAgregar) {
    promo2ModalAgregar.addEventListener('click', () => {
        promos2EnEdicion = leerFormularioPromos2();
        promos2EnEdicion.push({ horario: '', titulo: '', descripcion: '', precio: '' });
        pintarFormularioPromos2();
    });
}

if (promo2ModalGuardar) {
    promo2ModalGuardar.addEventListener('click', async () => {
        const nuevas = leerFormularioPromos2();
        promo2ModalGuardar.disabled = true;
        const ok = await guardarContenidoEnServidor('promociones', nuevas);
        promo2ModalGuardar.disabled = false;
        if (!ok) return;
        contenidoServidor.promociones = nuevas;
        try {
            localStorage.setItem(PROMOCIONES2_STORAGE_KEY, JSON.stringify(nuevas));
        } catch (err) { /* almacenamiento no disponible en este navegador */ }
        pintarPromociones2();
        cerrarPromo2Modal();
        alert('Promociones actualizadas: ya se ven así para todos los visitantes.');
    });
}

if (promo2ModalCopiar) {
    promo2ModalCopiar.addEventListener('click', () => {
        const nuevas = leerFormularioPromos2();
        const bloque = 'const PROMOCIONES2 = ' + JSON.stringify(nuevas, null, 4).replace(/"([a-zA-Z]+)":/g, '$1:') + ';';
        const avisar = () => {
            if (promo2ModalCopiado) promo2ModalCopiado.classList.add('show');
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(bloque).then(avisar).catch(() => {
                window.prompt('Copia este código manualmente:', bloque);
            });
        } else {
            window.prompt('Copia este código manualmente:', bloque);
        }
    });
}


// MENÚ FIJO: sombra al hacer scroll
const menuBar = document.querySelector('.menu');
if (menuBar) {
    window.addEventListener('scroll', () => {
        menuBar.classList.toggle('scrolled', window.scrollY > 10);
    });
}

// VIDEOS: lightbox
const videoModal = document.getElementById('video-modal');
const videoModalFrame = document.getElementById('video-modal-frame');
const videoModalClose = document.getElementById('video-modal-close');

function abrirVideoModal(videoId, title){
    if (!videoId) {
        videoModalFrame.innerHTML = `<p style="color:#fff;padding:40px;text-align:center;">
            Todavía no se ha agregado el video de "${title}".
        </p>`;
    } else {
        videoModalFrame.innerHTML = `<iframe
            src="https://www.youtube.com/embed/${videoId}"
            title="${title}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen></iframe>`;
    }
    videoModal.classList.add('open');
}

function cerrarVideoModal() {
    videoModal.classList.remove('open');
    videoModalFrame.innerHTML = '';
}

if (videoModalClose) {
    videoModalClose.addEventListener('click', cerrarVideoModal);
}
if (videoModal) {
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) cerrarVideoModal();
    });
}

// =====================================================================
// PODCAST
// =====================================================================
// Lista de episodios que se muestra por defecto. En cuanto se guarde un
// cambio desde el panel oculto, se usa esa versión para todos los
// visitantes en vez de esta lista.
const PODCAST = [
    { numero: 'Ep. 01', duracion: '24 min', color: '#e6007e', titulo: 'El origen de los alebrijes', descripcion: 'De dónde viene el nombre del café y la leyenda detrás de estas criaturas de colores.', audio: '' },
    { numero: 'Ep. 02', duracion: '31 min', color: '#00b3a4', titulo: 'De la milpa a la taza', descripcion: 'Platicamos con productores de café de altura sobre el camino del grano hasta tu mesa.', audio: '' },
    { numero: 'Ep. 03', duracion: '27 min', color: '#1f6fd6', titulo: 'Voces del barrio', descripcion: 'Artesanos y vecinos que exponen su trabajo en nuestras paredes cuentan su historia.', audio: '' },
    { numero: 'Ep. 04', duracion: '22 min', color: '#ff9000', titulo: 'Crónicas del foro', descripcion: 'Lo que pasa detrás de cámaras en nuestras noches de música en vivo.', audio: '' }
];

function obtenerPodcastActual(){
    return contenidoServidor.podcast || PODCAST;
}

function pintarPodcast(){
    const grid = document.getElementById('podcast-grid');
    const vacio = document.getElementById('podcast-vacio');
    if (!grid) return;
    const episodios = obtenerPodcastActual();
    grid.innerHTML = '';
    if (vacio) vacio.hidden = episodios.length > 0;
    episodios.forEach((ep) => {
        const art = document.createElement('article');
        art.className = 'podcast-card';
        art.style.setProperty('--accent', ep.color || '#ff9000');
        const reproductor = ep.youtubeId
            ? `<div class="podcast-yt-embed" style="aspect-ratio:16/9;border-radius:10px;overflow:hidden;margin-top:8px;"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${ep.youtubeId}" title="${ep.titulo || 'Episodio'}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border:0;"></iframe></div>`
            : `<audio controls ${ep.audio ? `src="${ep.audio}"` : ''}></audio>`;
        art.innerHTML = `
            <div class="podcast-card-top">
                <span class="podcast-num">${ep.numero || ''}</span>
                <span class="podcast-dur">${ep.duracion || ''}</span>
            </div>
            <h3>${ep.titulo || ''}</h3>
            <p>${ep.descripcion || ''}</p>
            ${reproductor}
        `;
        grid.appendChild(art);
    });
}
pintarPodcast();

// Panel de administración de Podcast (mismo patrón que Noticias/Promociones)
const podcastAdminBtn = document.getElementById('podcast-admin-btn');
const podcastModal = document.getElementById('podcast-modal');
const podcastModalClose = document.getElementById('podcast-modal-close');
const podcastModalLista = document.getElementById('podcast-modal-lista');
const podcastModalAgregar = document.getElementById('podcast-modal-agregar');
const podcastModalGuardar = document.getElementById('podcast-modal-guardar');
let podcastFormulario = [];

function renderFormularioPodcast(){
    if (!podcastModalLista) return;
    podcastModalLista.innerHTML = '';
    podcastFormulario.forEach((ep, i) => {
        const fila = document.createElement('div');
        fila.className = 'noticia-form';
        fila.innerHTML = `
            <div class="noticia-form-row">
                <div style="flex:1"><label>Número</label><input type="text" placeholder="Ep. 0${i + 1}" value="${ep.numero || ''}" data-campo="numero" data-i="${i}"></div>
                <div style="flex:1"><label>Duración</label><input type="text" placeholder="24 min" value="${ep.duracion || ''}" data-campo="duracion" data-i="${i}"></div>
            </div>
            <label>Título</label>
            <input type="text" placeholder="Título del episodio" value="${ep.titulo || ''}" data-campo="titulo" data-i="${i}">
            <label style="margin-top:10px">Descripción</label>
            <textarea data-campo="descripcion" data-i="${i}">${ep.descripcion || ''}</textarea>
            <label style="margin-top:10px">Subir archivo de audio (opcional, si NO usas YouTube)</label>
            <input type="file" accept="audio/*" data-campo-archivo="audio" data-i="${i}">
            ${ep.audio && ep.audio.startsWith('data:') ? `<p style="font-size:12px; color:#2a9d4a; margin-top:4px;">✓ Audio adjuntado</p>` : ''}
            <label style="margin-top:10px">Link de YouTube (opcional, pega el link completo si el episodio tiene video)</label>
            <input type="text" placeholder="https://www.youtube.com/watch?v=..." value="${ep.youtubeId || ''}" data-campo="youtubeId" data-i="${i}">
            <div style="margin-top:10px; text-align:right;">
                <button type="button" class="noticia-form-eliminar" data-i="${i}">🗑 Eliminar este episodio</button>
            </div>
        `;
        podcastModalLista.appendChild(fila);
    });
    podcastModalLista.querySelectorAll('input, textarea').forEach((input) => {
        const campo = input.getAttribute('data-campo');
        if (!campo) return;
        const esYoutube = campo === 'youtubeId';
        input.addEventListener(esYoutube ? 'change' : 'input', () => {
            const i = Number(input.getAttribute('data-i'));
            podcastFormulario[i][campo] = esYoutube ? extraerYoutubeId(input.value) : input.value;
        });
    });
    podcastModalLista.querySelectorAll('input[type="file"][data-campo-archivo]').forEach((input) => {
        input.addEventListener('change', () => {
            const archivo = input.files[0];
            if (!archivo) return;
            const i = Number(input.getAttribute('data-i'));
            const campo = input.getAttribute('data-campo-archivo');
            const lector = new FileReader();
            lector.onload = () => {
                podcastFormulario[i][campo] = lector.result;
                renderFormularioPodcast();
            };
            lector.readAsDataURL(archivo);
        });
    });
    podcastModalLista.querySelectorAll('.noticia-form-eliminar').forEach((btn) => {
        btn.addEventListener('click', () => {
            const i = Number(btn.getAttribute('data-i'));
            podcastFormulario.splice(i, 1);
            renderFormularioPodcast();
        });
    });
}

if (podcastAdminBtn) {
    podcastAdminBtn.addEventListener('click', () => {
        podcastFormulario = JSON.parse(JSON.stringify(obtenerPodcastActual()));
        renderFormularioPodcast();
        podcastModal.classList.add('open');
    });
}
if (podcastModalClose) podcastModalClose.addEventListener('click', () => podcastModal.classList.remove('open'));
if (podcastModal) podcastModal.addEventListener('click', (e) => { if (e.target === podcastModal) podcastModal.classList.remove('open'); });
if (podcastModalAgregar) {
    podcastModalAgregar.addEventListener('click', () => {
        podcastFormulario.push({ numero: '', duracion: '', color: '#ff9000', titulo: '', descripcion: '', audio: '' });
        renderFormularioPodcast();
    });
}
if (podcastModalGuardar) {
    podcastModalGuardar.addEventListener('click', async () => {
        podcastModalGuardar.disabled = true;
        const ok = await guardarContenidoEnServidor('podcast', podcastFormulario);
        podcastModalGuardar.disabled = false;
        if (!ok) return;
        contenidoServidor.podcast = podcastFormulario;
        pintarPodcast();
        podcastModal.classList.remove('open');
        alert('Podcast actualizado: ya se ve así para todos los visitantes.');
    });
}

// =====================================================================
// VIDEOS
// =====================================================================
const VIDEOS = [
    { titulo: 'Un día en El Alebrije', color: '#e6007e', youtubeId: '' },
    { titulo: 'Ritual del café de olla', color: '#00b3a4', youtubeId: '' },
    { titulo: 'Pintando alebrijes', color: '#1f6fd6', youtubeId: '' },
    { titulo: 'Noche de jazz en el patio', color: '#ff9000', youtubeId: '' }
];

function obtenerVideosActuales(){
    return contenidoServidor.videos || VIDEOS;
}

// Extrae el ID de YouTube de un link completo, o lo regresa tal cual si ya
// es solo el ID.
function extraerYoutubeId(texto){
    if (!texto) return '';
    texto = texto.trim();
    const patrones = [
        /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    ];
    for (const p of patrones) {
        const m = texto.match(p);
        if (m) return m[1];
    }
    // Si ya parece ser solo el ID (11 caracteres típicos), úsalo tal cual.
    if (/^[a-zA-Z0-9_-]{6,20}$/.test(texto)) return texto;
    return texto;
}

function pintarVideos(){
    const grid = document.getElementById('video-grid');
    const vacio = document.getElementById('videos-vacio');
    if (!grid) return;
    const videos = obtenerVideosActuales();
    grid.innerHTML = '';
    if (vacio) vacio.hidden = videos.length > 0;
    videos.forEach((v) => {
        const btn = document.createElement('button');
        btn.className = 'video-card';
        btn.style.setProperty('--accent', v.color || '#ff9000');
        const portada = v.youtubeId
            ? `<img src="https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg" alt="${v.titulo || ''}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0;">`
            : '';
        btn.style.position = 'relative';
        btn.style.overflow = 'hidden';
        btn.innerHTML = `${portada}<span class="video-play" style="z-index:1;">▶</span><span class="video-label" style="z-index:1;">${v.titulo || ''}</span>`;
        btn.addEventListener('click', () => abrirVideoModal(v.youtubeId, v.titulo || 'Video'));
        grid.appendChild(btn);
    });
}
pintarVideos();

// Panel de administración de Videos
const videosAdminBtn = document.getElementById('videos-admin-btn');
const videosModal = document.getElementById('videos-modal');
const videosModalClose = document.getElementById('videos-modal-close');
const videosModalLista = document.getElementById('videos-modal-lista');
const videosModalAgregar = document.getElementById('videos-modal-agregar');
const videosModalGuardar = document.getElementById('videos-modal-guardar');
let videosFormulario = [];

function renderFormularioVideos(){
    if (!videosModalLista) return;
    videosModalLista.innerHTML = '';
    videosFormulario.forEach((v, i) => {
        const fila = document.createElement('div');
        fila.className = 'noticia-form';
        fila.innerHTML = `
            <label>Título</label>
            <input type="text" placeholder="Título del video" value="${v.titulo || ''}" data-campo="titulo" data-i="${i}">
            <label style="margin-top:10px">Link de YouTube (pega el link completo)</label>
            <input type="text" placeholder="https://www.youtube.com/watch?v=..." value="${v.youtubeId || ''}" data-campo="youtubeId" data-i="${i}">
            ${v.youtubeId ? `<img src="https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg" style="max-width:180px; border-radius:6px; margin-top:8px; display:block;" alt="Portada">` : ''}
            <div style="margin-top:10px; text-align:right;">
                <button type="button" class="noticia-form-eliminar" data-i="${i}">🗑 Eliminar este video</button>
            </div>
        `;
        videosModalLista.appendChild(fila);
    });
    videosModalLista.querySelectorAll('input').forEach((input) => {
        input.addEventListener(input.getAttribute('data-campo') === 'youtubeId' ? 'change' : 'input', () => {
            const i = Number(input.getAttribute('data-i'));
            const campo = input.getAttribute('data-campo');
            let valor = input.value;
            if (campo === 'youtubeId') valor = extraerYoutubeId(valor);
            videosFormulario[i][campo] = valor;
            if (campo === 'youtubeId') renderFormularioVideos();
        });
    });
    videosModalLista.querySelectorAll('.noticia-form-eliminar').forEach((btn) => {
        btn.addEventListener('click', () => {
            const i = Number(btn.getAttribute('data-i'));
            videosFormulario.splice(i, 1);
            renderFormularioVideos();
        });
    });
}

if (videosAdminBtn) {
    videosAdminBtn.addEventListener('click', () => {
        videosFormulario = JSON.parse(JSON.stringify(obtenerVideosActuales()));
        renderFormularioVideos();
        videosModal.classList.add('open');
    });
}
if (videosModalClose) videosModalClose.addEventListener('click', () => videosModal.classList.remove('open'));
if (videosModal) videosModal.addEventListener('click', (e) => { if (e.target === videosModal) videosModal.classList.remove('open'); });
if (videosModalAgregar) {
    videosModalAgregar.addEventListener('click', () => {
        videosFormulario.push({ titulo: '', color: '#ff9000', youtubeId: '' });
        renderFormularioVideos();
    });
}
if (videosModalGuardar) {
    videosModalGuardar.addEventListener('click', async () => {
        videosModalGuardar.disabled = true;
        const ok = await guardarContenidoEnServidor('videos', videosFormulario);
        videosModalGuardar.disabled = false;
        if (!ok) return;
        contenidoServidor.videos = videosFormulario;
        pintarVideos();
        videosModal.classList.remove('open');
        alert('Videos actualizados: ya se ven así para todos los visitantes.');
    });
}
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarVideoModal();
});


// MENÚ: pestañas de categorías (Bebidas / Snacks / Desayunos / Comida Corrida)
const menuTabs = document.querySelectorAll('.menu-tab');
const menuPanels = document.querySelectorAll('.menu-panel');

menuTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-target');

        menuTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        menuPanels.forEach((panel) => {
            panel.classList.toggle('active', panel.id === `panel-${target}`);
        });
    });
});

// DESAYUNOS (inicio) y RECETAS (menú): cada tarjeta/enlace lleva directo al
// menú, activa la pestaña correcta y resalta el platillo para poder pedirlo.
document.querySelectorAll('.breakfast-1[data-menu-tab], .receta-ver-menu[data-menu-tab]').forEach((link) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        const tabTarget = link.getAttribute('data-menu-tab');
        const itemId = link.getAttribute('data-menu-item');

        const tabBtn = document.querySelector(`.menu-tab[data-target="${tabTarget}"]`);
        if (tabBtn) tabBtn.click();

        const item = itemId ? document.getElementById(itemId) : null;
        if (!item) {
            document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        setTimeout(() => {
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            item.classList.add('cart-highlight');
            setTimeout(() => item.classList.remove('cart-highlight'), 1600);
        }, 50);
    });
});


let loadMoreBtn = document.querySelector('#load-more');
let currentItem = 4;

loadMoreBtn.onclick = () => {

    let boxes = [...document.querySelectorAll('.box-container .box')];
    for(var i = currentItem; i<currentItem + 4; i++){
        boxes[i].style.display = 'inline-block';
    }
    currentItem += 4;
    if(currentItem >= boxes.length){
        loadMoreBtn.style.display = 'none'
    }
}

//CARRITO

const carrito = document.getElementById('carrito');
const lista = document.querySelector('#lista-carrito tbody');
const vaciarCarritoBtn = document.getElementById('vaciar-carrito');

let contadorCarrito = 0;

// PROMO DESAYUNO: actualiza en vivo la foto del platillo + café elegidos
const PROMO_DESAYUNO_IMG = {
    'Chilaquiles verdes y sencillos': 'imagenes/chilaquiles.png',
    'Molletes con pechuga de pavo': 'imagenes/molletes.png',
    'Sándwich': 'imagenes/sandwich.png',
    'Ensalada con todo, sin pollo': 'imagenes/ensalada.png'
};
const PROMO_CAFE_IMG = {
    'Americano': 'imagenes/americano.png',
    'Capuchino': 'imagenes/capuchino.png'
};

function animarCombo(img){
    if (!img) return;
    img.classList.remove('promo-combo-pop');
    void img.offsetWidth; // fuerza reflow para poder repetir la animación
    img.classList.add('promo-combo-pop');
}

function actualizarPromoCombo(){
    const comidaInput = document.querySelector('input[name="promo-desayuno-1"]:checked');
    const cafeInput = document.querySelector('input[name="promo-cafe-1"]:checked');
    const imgComida = document.getElementById('promo-combo-food');
    const imgCafe = document.getElementById('promo-combo-drink');

    if (comidaInput && imgComida) {
        const nuevoSrc = PROMO_DESAYUNO_IMG[comidaInput.value];
        if (nuevoSrc && imgComida.getAttribute('src') !== nuevoSrc) {
            imgComida.setAttribute('src', nuevoSrc);
            imgComida.setAttribute('alt', comidaInput.nextElementSibling ? comidaInput.nextElementSibling.textContent : comidaInput.value);
            animarCombo(imgComida);
        }
    }
    if (cafeInput && imgCafe) {
        const nuevoSrc = PROMO_CAFE_IMG[cafeInput.value];
        if (nuevoSrc && imgCafe.getAttribute('src') !== nuevoSrc) {
            imgCafe.setAttribute('src', nuevoSrc);
            imgCafe.setAttribute('alt', cafeInput.value);
            animarCombo(imgCafe);
        }
    }
}

document.querySelectorAll('input[name="promo-desayuno-1"], input[name="promo-cafe-1"]').forEach((input) => {
    input.addEventListener('change', actualizarPromoCombo);
});

// Le da un id estable a cada tarjeta de producto para poder regresar a ella desde el carrito
document.querySelectorAll('.cart-item').forEach((card, index) => {
    if (!card.id) {
        card.id = `cart-source-${index}`;
    }
});

// CARRITO: se abre/cierra con clic (antes era con hover, y se cerraba solo con mover el mouse)
const imgCarrito = document.getElementById('img-carrito');
const submenuCarrito = carrito.closest('.submenu');

if (imgCarrito && submenuCarrito) {
    imgCarrito.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        submenuCarrito.classList.toggle('open');
    });

    // Clic fuera del carrito lo cierra
    document.addEventListener('click', (e) => {
        if (!submenuCarrito.contains(e.target)) {
            submenuCarrito.classList.remove('open');
        }
    });

    // Evita que un clic dentro del carrito (que no sea un enlace) lo cierre por accidente
    carrito.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

cargarEventListeners();

function cargarEventListeners(){
    carrito.addEventListener('click', eliminarElemento);
    vaciarCarritoBtn.addEventListener('click', vaciarCarrito);
}

function formatearPrecio(n){
    return `$${n}`;
}

// Calcula el precio actual de una tarjeta (.cart-item) según las opciones elegidas
function calcularPrecio(card){
    let precio = parseFloat(card.getAttribute('data-base-price'));
    if (isNaN(precio)) return null; // precio aún no definido (ej. crepas)

    // Radios que cambian el precio (ej. tamaño, preparación, sabor con costo extra)
    card.querySelectorAll('.option-group[data-affects-price="true"] input[type="radio"]:checked').forEach((radio) => {
        if (!esOpcionVisible(radio)) return;
        if (radio.dataset.price !== undefined) {
            precio = parseFloat(radio.dataset.price);
        }
    });

    // Checkboxes tipo "extra" que suman al precio (ej. envío a domicilio)
    card.querySelectorAll('.addon-checkbox:checked').forEach((addon) => {
        if (addon.dataset.addonPrice) {
            precio += parseFloat(addon.dataset.addonPrice);
        }
    });

    return precio;
}

// Una opción no cuenta si está dentro de un .option-conditional oculto (ej. "Salado" cuando se eligió "Dulce")
function esOpcionVisible(input){
    const conditional = input.closest('.option-conditional');
    return !conditional || !conditional.hidden;
}

// Recolecta el texto de las opciones elegidas para anotarlo junto al nombre del producto
function recolectarOpciones(card){
    const partes = [];

    // Radios (con o sin efecto en precio)
    card.querySelectorAll('.option-group input[type="radio"]:checked').forEach((radio) => {
        if (!esOpcionVisible(radio)) return;
        partes.push(radio.value);
    });

    // Selects de sabor/variante (solo si están visibles)
    card.querySelectorAll('select.option-select').forEach((select) => {
        if (!esOpcionVisible(select)) return;
        if (select.value) partes.push(select.value);
    });

    // Checkboxes de ingredientes (dentro de option-checklist)
    const ingredientes = [...card.querySelectorAll('.option-checklist input[type="checkbox"]:checked')]
        .filter(esOpcionVisible)
        .map(cb => cb.value);
    if (ingredientes.length) partes.push(`con ${ingredientes.join(', ')}`);

    // Addons (envío, etc.)
    card.querySelectorAll('.addon-checkbox:checked').forEach((addon) => {
        partes.push(addon.value);
    });

    return partes;
}

// Alterna qué bloque de opciones se muestra (ej. Dulce vs. Salado)
document.querySelectorAll('[data-show]').forEach((input) => {
    input.addEventListener('change', () => {
        const opciones = input.closest('.item-options');
        if (!opciones) return;
        opciones.querySelectorAll('.option-conditional').forEach((cond) => {
            cond.hidden = true;
        });
        const objetivo = document.getElementById(input.dataset.show);
        if (objetivo) objetivo.hidden = false;
    });
});

function actualizarPrecioMostrado(card){
    const precioUnitario = calcularPrecio(card);
    const display = card.querySelector('[data-price-display]');
    if (!display || precioUnitario === null) return;

    const cantidad = obtenerCantidad(card);
    if (cantidad > 1) {
        display.textContent = `${formatearPrecio(precioUnitario)} × ${cantidad} = ${formatearPrecio(precioUnitario * cantidad)}`;
    } else {
        display.textContent = formatearPrecio(precioUnitario);
    }
}

// Refresca el precio en vivo cuando el usuario cambia una opción
document.querySelectorAll('.cart-item').forEach((card) => {
    card.querySelectorAll('.item-options input, .item-options select').forEach((input) => {
        input.addEventListener('change', () => actualizarPrecioMostrado(card));
    });
});

// SELECTOR DE CANTIDAD: se agrega automáticamente a cada tarjeta de producto
// (justo antes del botón "Agregar al carrito") para poder pedir varias
// órdenes del mismo platillo en un solo clic.
const CANTIDAD_MIN = 1;
const CANTIDAD_MAX = 20;

function obtenerCantidad(card){
    const valor = card.querySelector('.cantidad-valor');
    const cantidad = valor ? parseInt(valor.textContent, 10) : 1;
    return isNaN(cantidad) ? 1 : cantidad;
}

function fijarCantidad(card, cantidad){
    const valor = card.querySelector('.cantidad-valor');
    if (!valor) return;
    const nueva = Math.min(CANTIDAD_MAX, Math.max(CANTIDAD_MIN, cantidad));
    valor.textContent = nueva;

    const btnMenos = card.querySelector('.cantidad-menos');
    const btnMas = card.querySelector('.cantidad-mas');
    if (btnMenos) btnMenos.disabled = nueva <= CANTIDAD_MIN;
    if (btnMas) btnMas.disabled = nueva >= CANTIDAD_MAX;
}

document.querySelectorAll('.agregar-carrito-v2').forEach((btn) => {
    const card = btn.closest('.cart-item');
    if (!card || card.querySelector('.cantidad-selector')) return;

    const selector = document.createElement('div');
    selector.className = 'cantidad-selector';
    selector.innerHTML = `
        <button type="button" class="cantidad-btn cantidad-menos" aria-label="Quitar una orden">−</button>
        <span class="cantidad-valor">1</span>
        <button type="button" class="cantidad-btn cantidad-mas" aria-label="Agregar una orden">+</button>
    `;
    btn.insertAdjacentElement('beforebegin', selector);

    selector.querySelector('.cantidad-menos').addEventListener('click', () => {
        fijarCantidad(card, obtenerCantidad(card) - 1);
        actualizarPrecioMostrado(card);
    });
    selector.querySelector('.cantidad-mas').addEventListener('click', () => {
        fijarCantidad(card, obtenerCantidad(card) + 1);
        actualizarPrecioMostrado(card);
    });

    fijarCantidad(card, 1);
});

// Agregar al carrito (botones nuevos, con variantes/sabores/extras)
document.querySelectorAll('.agregar-carrito-v2').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (btn.disabled) return;

        const card = btn.closest('.cart-item');
        if (!card) return;

        const precioUnitario = calcularPrecio(card);
        if (precioUnitario === null) return; // sin precio definido todavía

        const cantidad = obtenerCantidad(card);
        const precioTotal = precioUnitario * cantidad;

        const nombreBase = card.getAttribute('data-name');
        const opciones = recolectarOpciones(card);
        let titulo = opciones.length ? `${nombreBase} (${opciones.join(' · ')})` : nombreBase;
        if (cantidad > 1) titulo += ` ×${cantidad}`;
        const imagen = card.getAttribute('data-image') || 'imagenes/logo.png';

        contadorCarrito++;

        insertarCarrito({
            imagen: imagen,
            titulo: titulo,
            precio: formatearPrecio(precioTotal),
            id: `item-${contadorCarrito}`,
            sourceId: card.id
        });

        mostrarToastAgregado(cantidad > 1 ? `${nombreBase} ×${cantidad}` : nombreBase);

        // Deja la cantidad lista en 1 para la próxima orden de este platillo
        fijarCantidad(card, 1);
        actualizarPrecioMostrado(card);
    });
});

// Muestra un pequeño aviso de confirmación y anima el ícono del carrito
// cada vez que se agrega un producto. Se reinicia siempre, aunque el
// usuario agregue varios productos seguidos uno tras otro.
const toastCarrito = document.getElementById('toast-carrito');
const toastCarritoTexto = document.getElementById('toast-carrito-texto');
const toastCarritoCheck = toastCarrito ? toastCarrito.querySelector('.toast-check') : null;
let toastCarritoTimeout;

function mostrarToastAgregado(nombreProducto){
    if (imgCarrito) {
        imgCarrito.classList.remove('cart-bounce');
        void imgCarrito.offsetWidth; // reinicia la animación si se agregan varios productos seguidos
        imgCarrito.classList.add('cart-bounce');
    }

    if (!toastCarrito) return;

    if (toastCarritoTexto) {
        toastCarritoTexto.textContent = nombreProducto ? `${nombreProducto} agregado al carrito` : 'Agregado al carrito';
    }

    clearTimeout(toastCarritoTimeout);

    // Se apaga primero y se reinicia el check para forzar que la animación
    // se vuelva a reproducir aunque el toast ya estuviera visible.
    toastCarrito.classList.remove('show');
    if (toastCarritoCheck) toastCarritoCheck.classList.remove('toast-check-anim');
    void toastCarrito.offsetWidth; // fuerza reflow

    requestAnimationFrame(() => {
        toastCarrito.classList.add('show');
        if (toastCarritoCheck) toastCarritoCheck.classList.add('toast-check-anim');
    });

    toastCarritoTimeout = setTimeout(() => {
        toastCarrito.classList.remove('show');
    }, 1800);
}

function insertarCarrito(elemento){

    const row = document.createElement('tr');
    row.setAttribute('data-source-id', elemento.sourceId || '');
    row.innerHTML = `
        <td>
            <img src ="${elemento.imagen}" width=100 />
        </td>
    
        <td>
            ${elemento.titulo}
        </td>

        <td>
            ${elemento.precio}
        </td>

        <td>
            <a href="#" class="borrar" data-id="${elemento.id}" >X</a>
        </td>
    `;
    lista.appendChild(row);
    actualizarResumenCarrito();

}

// Actualiza el total y muestra/oculta el mensaje de "carrito vacío" y el botón de enviar pedido
function actualizarResumenCarrito(){
    const filas = [...lista.querySelectorAll('tr')];
    let total = 0;

    filas.forEach((fila) => {
        const precioTexto = fila.children[2] ? fila.children[2].textContent.trim() : '';
        const precio = parseFloat(precioTexto.replace('$', ''));
        if (!isNaN(precio)) total += precio;
    });

    const totalMonto = document.getElementById('carrito-total-monto');
    if (totalMonto) totalMonto.textContent = formatearPrecio(total);

    if (carrito) carrito.classList.toggle('vacio', filas.length === 0);

    const enviarPedidoBtn = document.getElementById('enviar-pedido');
    if (enviarPedidoBtn) enviarPedidoBtn.classList.toggle('disabled', filas.length === 0);
}

function eliminarElemento(e){
    e.preventDefault();
    let elemento,
        elementoId;

    if(e.target.classList.contains('borrar')){
        e.target.parentElement.parentElement.remove();
        elemento = e.target.parentElement.parentElement;
        elementoId = elemento.querySelector('a').getAttribute('data-id');
        actualizarResumenCarrito();
    }
}

// Al hacer clic en una fila del carrito (fuera del botón X), lleva al usuario
// hasta la tarjeta del platillo para que pueda ajustar sus opciones.
lista.addEventListener('click', (e) => {
    if (e.target.classList.contains('borrar')) return; // el borrado ya lo maneja eliminarElemento

    const row = e.target.closest('tr');
    if (!row) return;

    const sourceId = row.getAttribute('data-source-id');
    if (!sourceId) return;

    const card = document.getElementById(sourceId);
    if (!card) return;

    // Si el platillo vive en una pestaña (Bebidas/Snacks/Desayunos/Comida Corrida), activa esa pestaña
    const panel = card.closest('.menu-panel');
    if (panel && !panel.classList.contains('active')) {
        const target = panel.id.replace('panel-', '');
        const tab = document.querySelector(`.menu-tab[data-target="${target}"]`);
        if (tab) tab.click();
    }

    // Si la tarjeta está oculta por la paginación de "Cargar Más", la revela
    if (card.classList.contains('box') && getComputedStyle(card).display === 'none') {
        card.style.display = 'inline-block';
    }

    // Cierra el desplegable del carrito para dejar ver la tarjeta del platillo
    if (submenuCarrito) {
        submenuCarrito.classList.remove('open');
    }

    card.scrollIntoView({ behavior: 'smooth', block: 'center' });

    card.classList.add('cart-highlight');
    setTimeout(() => card.classList.remove('cart-highlight'), 1600);
});

function vaciarCarrito(){
    while(lista.firstChild){
        lista.removeChild(lista.firstChild);
    }
    actualizarResumenCarrito();
    return false;
}

// Envía el pedido por WhatsApp a la cafetería con el detalle armado automáticamente.
// Antes de enviar, se le pregunta al usuario si es para llevar o para comer en la
// cafetería, y cómo va a pagar (efectivo o transferencia), para que el mensaje
// llegue completo y no haya que estar dando cambio en el local.
const NUMERO_WHATSAPP_PEDIDOS = '525518221646'; // 55 1822 1646

// ⚠️ DATOS BANCARIOS: reemplaza esto por la cuenta real del negocio antes de
// publicar el sitio. Esto es lo que se le muestra al cliente cuando elige
// pagar por transferencia.
// Nota: el banco "Banco Azteca" se dedujo de los 3 primeros dígitos de la
// CLABE (127 = Banco Azteca); confírmalo antes de publicar el sitio.
const DATOS_TRANSFERENCIA = {
    banco: 'Banco Azteca',
    titular: 'Pilar Novoa Garcés',
    clabe: '127180013624367113',
    tarjeta: '5487 1362 4367 11'
};

const enviarPedidoBtn = document.getElementById('enviar-pedido');

const pedidoModal = document.getElementById('pedido-modal');
const pedidoModalClose = document.getElementById('pedido-modal-close');
const pedidoModalEnviar = document.getElementById('pedido-modal-enviar');
const pedidoMontoInput = document.getElementById('pedido-monto-pago');
const pedidoMontoError = document.getElementById('pedido-monto-error');
const pedidoPagoEfectivo = document.getElementById('pedido-pago-efectivo');
const pedidoPagoTransferencia = document.getElementById('pedido-pago-transferencia');
const pedidoPagoMercadoPago = document.getElementById('pedido-pago-mercadopago');
const mercadopagoError = document.getElementById('mercadopago-error');
const pedidoModalEnviarTexto = document.getElementById('pedido-modal-enviar-texto');

// ⚠️ URL de tu función de Mercado Pago (Vercel). Reemplázala por la tuya
// cuando termines el paso de despliegue en Vercel (ver guía).
const MERCADOPAGO_API_URL = 'https://cafeteria-cultural-el-alebrije.vercel.app/api/create-preference';
const pedidoNombreTransfiereInput = document.getElementById('pedido-nombre-transfiere');
const pedidoNombreError = document.getElementById('pedido-nombre-error');
const transferenciaCopiarBtn = document.getElementById('transferencia-copiar-btn');
const pedidoFolioValorEl = document.getElementById('pedido-folio-valor');
const pedidoFolioTransferenciaEl = document.getElementById('pedido-folio-transferencia');
const pedidoConfirmoTransferenciaInput = document.getElementById('pedido-confirmo-transferencia');
const pedidoConfirmoError = document.getElementById('pedido-confirmo-error');
let pedidoFolioActual = '';

// Genera un folio corto para el pedido (ej. "EA-482913"). Sirve para que el
// cliente lo use como concepto/referencia al hacer una transferencia, así el
// negocio puede ubicar el pago directo en el banco además del comprobante.
function generarFolioPedido(){
    return 'EA-' + Date.now().toString().slice(-6);
}

// Pinta los datos bancarios en el modal a partir de DATOS_TRANSFERENCIA
const datoBancoEl = document.getElementById('dato-banco');
const datoTitularEl = document.getElementById('dato-titular');
const datoClabeEl = document.getElementById('dato-clabe');
const datoTarjetaEl = document.getElementById('dato-tarjeta');
if (datoBancoEl) datoBancoEl.textContent = DATOS_TRANSFERENCIA.banco;
if (datoTitularEl) datoTitularEl.textContent = DATOS_TRANSFERENCIA.titular;
if (datoClabeEl) datoClabeEl.textContent = DATOS_TRANSFERENCIA.clabe;
if (datoTarjetaEl) datoTarjetaEl.textContent = DATOS_TRANSFERENCIA.tarjeta;

if (transferenciaCopiarBtn) {
    transferenciaCopiarBtn.addEventListener('click', () => {
        const texto = `Banco: ${DATOS_TRANSFERENCIA.banco}\nTitular: ${DATOS_TRANSFERENCIA.titular}\nCLABE: ${DATOS_TRANSFERENCIA.clabe}\nNúmero de cuenta: ${DATOS_TRANSFERENCIA.tarjeta}`;
        const avisar = () => {
            transferenciaCopiarBtn.textContent = '✓ Copiado';
            setTimeout(() => { transferenciaCopiarBtn.textContent = 'Copiar datos'; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto).then(avisar).catch(() => {
                window.prompt('Copia estos datos manualmente:', texto);
            });
        } else {
            window.prompt('Copia estos datos manualmente:', texto);
        }
    });
}

// Alterna entre el bloque de "efectivo" (monto con el que paga) y el de
// "transferencia" (datos bancarios + nombre de quien transfiere)
document.querySelectorAll('input[name="pedido-pago"]').forEach((input) => {
    input.addEventListener('change', () => {
        if (!input.checked) return;
        const metodo = input.value;
        if (pedidoPagoEfectivo) pedidoPagoEfectivo.hidden = metodo !== 'Efectivo';
        if (pedidoPagoTransferencia) pedidoPagoTransferencia.hidden = metodo !== 'Transferencia';
        if (pedidoPagoMercadoPago) pedidoPagoMercadoPago.hidden = metodo !== 'MercadoPago';
        if (pedidoMontoError) pedidoMontoError.classList.remove('show');
        if (pedidoNombreError) pedidoNombreError.classList.remove('show');
        if (pedidoConfirmoError) pedidoConfirmoError.classList.remove('show');
        if (mercadopagoError) mercadopagoError.hidden = true;
        if (pedidoModalEnviarTexto) {
            pedidoModalEnviarTexto.textContent = metodo === 'MercadoPago'
                ? 'Pagar con Mercado Pago'
                : 'Enviar pedido por WhatsApp';
        }
    });
});

function abrirPedidoModal(){
    if (!pedidoModal) return;
    pedidoFolioActual = generarFolioPedido();
    if (pedidoFolioValorEl) pedidoFolioValorEl.textContent = pedidoFolioActual;
    if (pedidoFolioTransferenciaEl) pedidoFolioTransferenciaEl.textContent = pedidoFolioActual;
    if (pedidoConfirmoTransferenciaInput) pedidoConfirmoTransferenciaInput.checked = false;
    if (pedidoConfirmoError) pedidoConfirmoError.classList.remove('show');
    pedidoModal.classList.add('open');
    if (pedidoMontoInput) pedidoMontoInput.focus();
}

function cerrarPedidoModal(){
    if (!pedidoModal) return;
    pedidoModal.classList.remove('open');
    if (pedidoMontoError) pedidoMontoError.classList.remove('show');
    if (pedidoNombreError) pedidoNombreError.classList.remove('show');
    if (pedidoConfirmoError) pedidoConfirmoError.classList.remove('show');
}

if (enviarPedidoBtn) {
    enviarPedidoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (enviarPedidoBtn.classList.contains('disabled')) return;

        const filas = [...lista.querySelectorAll('tr')];
        if (!filas.length) return;

        abrirPedidoModal();
    });
}

if (pedidoModalClose) {
    pedidoModalClose.addEventListener('click', cerrarPedidoModal);
}
if (pedidoModal) {
    pedidoModal.addEventListener('click', (e) => {
        if (e.target === pedidoModal) cerrarPedidoModal();
    });
}
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pedidoModal && pedidoModal.classList.contains('open')) {
        cerrarPedidoModal();
    }
});

// Arma la lista de items del carrito (nombre + precio) y el cargo de "para
// llevar", y le pide a nuestra función de Mercado Pago que cree el cobro por
// el total exacto. Si todo sale bien, manda al cliente a la pantalla de pago.
async function pagarConMercadoPago(){
    const filas = [...lista.querySelectorAll('tr')];
    const tipoPedidoInput = document.querySelector('input[name="pedido-tipo"]:checked');
    const tipoPedido = tipoPedidoInput ? tipoPedidoInput.value : 'Para llevar';
    const esParaLlevar = tipoPedido === 'Para llevar';

    const items = filas.map((fila) => {
        const nombre = fila.children[1] ? fila.children[1].textContent.trim() : 'Producto';
        const precioTexto = fila.children[2] ? fila.children[2].textContent.trim() : '';
        const precio = parseFloat(precioTexto.replace('$', ''));
        return { nombre, precio: isNaN(precio) ? 0 : precio };
    });

    if (esParaLlevar) {
        items.push({ nombre: 'Para llevar', precio: 10 });
    }

    if (pedidoModalEnviar) pedidoModalEnviar.disabled = true;
    if (mercadopagoError) mercadopagoError.hidden = true;

    try {
        const respuesta = await fetch(MERCADOPAGO_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folio: pedidoFolioActual, items })
        });

        if (!respuesta.ok) throw new Error('Respuesta no válida del servidor de pagos');

        const datos = await respuesta.json();
        if (!datos.init_point) throw new Error('No se recibió el link de pago');

        vaciarCarrito();
        window.location.href = datos.init_point;
    } catch (err) {
        console.error('Error al iniciar pago con Mercado Pago:', err);
        if (mercadopagoError) mercadopagoError.hidden = false;
    } finally {
        if (pedidoModalEnviar) pedidoModalEnviar.disabled = false;
    }
}

if (pedidoModalEnviar) {
    pedidoModalEnviar.addEventListener('click', () => {
        const filas = [...lista.querySelectorAll('tr')];
        if (!filas.length) {
            cerrarPedidoModal();
            return;
        }

        const metodoPagoInput = document.querySelector('input[name="pedido-pago"]:checked');
        const metodoPago = metodoPagoInput ? metodoPagoInput.value : 'Efectivo';

        if (metodoPago === 'MercadoPago') {
            pagarConMercadoPago();
            return;
        }

        const esTransferencia = metodoPago === 'Transferencia';

        const monto = pedidoMontoInput ? pedidoMontoInput.value.trim() : '';
        const nombreTransfiere = pedidoNombreTransfiereInput ? pedidoNombreTransfiereInput.value.trim() : '';

        if (esTransferencia) {
            if (!nombreTransfiere) {
                if (pedidoNombreError) pedidoNombreError.classList.add('show');
                if (pedidoNombreTransfiereInput) pedidoNombreTransfiereInput.focus();
                return;
            }
            if (pedidoNombreError) pedidoNombreError.classList.remove('show');

            if (pedidoConfirmoTransferenciaInput && !pedidoConfirmoTransferenciaInput.checked) {
                if (pedidoConfirmoError) pedidoConfirmoError.classList.add('show');
                pedidoConfirmoTransferenciaInput.focus();
                return;
            }
            if (pedidoConfirmoError) pedidoConfirmoError.classList.remove('show');
        } else {
            if (!monto) {
                if (pedidoMontoError) pedidoMontoError.classList.add('show');
                if (pedidoMontoInput) pedidoMontoInput.focus();
                return;
            }
            if (pedidoMontoError) pedidoMontoError.classList.remove('show');
        }

        const tipoPedidoInput = document.querySelector('input[name="pedido-tipo"]:checked');
        const tipoPedido = tipoPedidoInput ? tipoPedidoInput.value : 'Para llevar';
        const esParaLlevar = tipoPedido === 'Para llevar';
        const cargoParaLlevar = esParaLlevar ? 10 : 0;

        let subtotal = 0;
        let mensaje = '¡Hola! Quiero hacer un pedido en *Café Cultural El Alebrije*\n\n';
        mensaje += `*Folio:* ${pedidoFolioActual}\n`;
        mensaje += '*Mi pedido:*\n';

        filas.forEach((fila) => {
            const nombre = fila.children[1] ? fila.children[1].textContent.trim() : '';
            const precioTexto = fila.children[2] ? fila.children[2].textContent.trim() : '';
            const precio = parseFloat(precioTexto.replace('$', ''));
            if (!isNaN(precio)) subtotal += precio;
            mensaje += `• ${nombre} — ${precioTexto}\n`;
        });

        const total = subtotal + cargoParaLlevar;

        mensaje += `\n*Subtotal:* ${formatearPrecio(subtotal)}`;
        mensaje += `\n*${tipoPedido}${esParaLlevar ? ' ($10)' : ' ($0)'}*`;
        mensaje += `\n*Total a pagar:* ${formatearPrecio(total)}`;

        if (esTransferencia) {
            mensaje += `\n\n*Forma de pago:* Transferencia bancaria`;
            mensaje += `\n*A nombre de:* ${nombreTransfiere}`;
            mensaje += `\n*Confirmo que ya hice la transferencia* con el folio ${pedidoFolioActual} como referencia.`;
            mensaje += `\nEnviaré mi comprobante de pago por este mismo chat.`;
        } else {
            const montoPago = parseFloat(monto);
            const cambio = !isNaN(montoPago) ? montoPago - total : null;
            mensaje += `\n\n*Voy a pagar con:* $${monto} (efectivo)`;
            if (cambio !== null) {
                mensaje += cambio >= 0
                    ? `\n*Cambio:* ${formatearPrecio(cambio)}`
                    : `\n*Falta:* ${formatearPrecio(Math.abs(cambio))}`;
            }
        }
        mensaje += '\n\n¡Gracias!';

        const url = `https://wa.me/${NUMERO_WHATSAPP_PEDIDOS}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank', 'noopener');

        cerrarPedidoModal();
        if (pedidoMontoInput) pedidoMontoInput.value = '';
        if (pedidoNombreTransfiereInput) pedidoNombreTransfiereInput.value = '';
        if (pedidoConfirmoTransferenciaInput) pedidoConfirmoTransferenciaInput.checked = false;
        vaciarCarrito();
        if (submenuCarrito) submenuCarrito.classList.remove('open');
    });
}

// Estado inicial (carrito vacío al cargar la página)
actualizarResumenCarrito();

// =====================================================================
// EDICIÓN DEL MENÚ (nombre, descripción y precio) desde el panel oculto
// =====================================================================
// Cada platillo/bebida tiene un "data-item-id" fijo en el HTML. Los cambios
// guardados aquí se guardan como "sobreescrituras" (overrides) en el
// servidor y se aplican encima del HTML original en cada visita.

function aplicarOverridesMenu(){
    const overrides = contenidoServidor.menu || {};
    Object.keys(overrides).forEach((itemId) => {
        const cambio = overrides[itemId];
        document.querySelectorAll(`[data-item-id="${itemId}"]`).forEach((tarjeta) => {
            if (cambio.nombre) {
                const titulo = tarjeta.querySelector('h3, .menu-item-name');
                if (titulo) titulo.textContent = cambio.nombre;
                tarjeta.setAttribute('data-name', cambio.nombre);
            }
            if (cambio.descripcion !== undefined) {
                const desc = tarjeta.querySelector('.menu-item-desc, .product-txt > p:not(.precio)');
                if (desc) desc.textContent = cambio.descripcion;
            }
            if (cambio.precio !== undefined && cambio.precio !== '') {
                const precioTxt = `$${cambio.precio}`;
                const precioEl = tarjeta.querySelector('[data-price-display]');
                if (precioEl) precioEl.textContent = precioTxt;
                tarjeta.setAttribute('data-base-price', cambio.precio);
            }
        });
    });
}

// Agrega un botón "✏️" (solo visible en modo admin) ÚNICAMENTE a los
// productos que se acaban de agregar como nuevos (menos de 30 días).
// Los productos originales del menú no se pueden editar desde aquí.
function repintarMenuNuevos(){
    document.querySelectorAll('[data-item-id^="nuevo-"]').forEach((el) => el.remove());
    pintarMenuNuevos();
    inyectarBotonesEdicionMenu();
}

function inyectarBotonesEdicionMenu(){
    document.querySelectorAll('[data-item-id]').forEach((tarjeta) => {
        if (tarjeta.querySelector('.menu-edit-btn')) return; // ya tiene botón

        const itemId = tarjeta.getAttribute('data-item-id');
        const match = itemId && itemId.match(/^nuevo-(bebidas|snacks|desayunos|corrida)-(\d+)$/);
        if (!match) return; // solo se puede editar/eliminar lo que se acaba de agregar

        const cat = match[1];
        const idx = Number(match[2]);
        const datos = obtenerMenuNuevosActual();
        const item = (datos[cat] || [])[idx];
        if (!item || !esReciente(item.fecha)) return; // ya dejó de ser "nuevo": ya no se edita aquí

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'menu-edit-btn solo-admin';
        boton.hidden = !modoAdmin;
        boton.title = 'Editar o eliminar este producto nuevo';
        boton.textContent = '✏️';
        boton.style.cssText = 'margin-left:6px;cursor:pointer;border:none;background:transparent;font-size:0.9rem;';

        boton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const nuevoNombre = window.prompt('Nombre (déjalo vacío para eliminar este producto):', item.nombre || '');
            if (nuevoNombre === null) return;

            const datosActuales = obtenerMenuNuevosActual();
            const copia = {
                bebidas: [...(datosActuales.bebidas || [])],
                snacks: [...(datosActuales.snacks || [])],
                desayunos: [...(datosActuales.desayunos || [])],
                corrida: [...(datosActuales.corrida || [])]
            };

            if (!nuevoNombre.trim()) {
                copia[cat].splice(idx, 1);
                const ok = await guardarContenidoEnServidor('menu-nuevos', copia);
                if (!ok) return;
                contenidoServidor.menuNuevos = copia;
                repintarMenuNuevos();
                alert('Producto eliminado.');
                return;
            }

            const nuevaDescripcion = window.prompt('Descripción:', item.descripcion || '');
            if (nuevaDescripcion === null) return;
            const nuevoPrecioTxt = window.prompt('Precio (solo el número):', item.precio || '');
            if (nuevoPrecioTxt === null) return;
            const nuevoPrecio = Number(nuevoPrecioTxt.trim());
            if (isNaN(nuevoPrecio)) { alert('El precio debe ser un número. No se guardó el cambio.'); return; }

            copia[cat][idx] = { ...item, nombre: nuevoNombre.trim(), descripcion: nuevaDescripcion.trim(), precio: nuevoPrecio };
            const ok = await guardarContenidoEnServidor('menu-nuevos', copia);
            if (!ok) return;
            contenidoServidor.menuNuevos = copia;
            repintarMenuNuevos();
            alert('Cambio guardado: ya se ve así para todos los visitantes.');
        });

        const encabezado = tarjeta.querySelector('h3, .menu-item-head');
        if (encabezado) encabezado.appendChild(boton);
    });
}

// Cuando llega el contenido del servidor: aplica noticias, promos y menú.
// =====================================================================
// FRASE / IMAGEN DEL DÍA (reemplaza el logo del hero, dura 24 horas)
// =====================================================================
const heroLogoImg = document.getElementById('hero-logo-img');
const LOGO_ORIGINAL_SRC = 'imagenes/comida1.png';
const fraseDiaAdminBtn = document.getElementById('frase-dia-admin-btn');
const fraseDiaModal = document.getElementById('frase-dia-modal');
const fraseDiaModalClose = document.getElementById('frase-dia-modal-close');
const fraseDiaFormArchivo = document.getElementById('frase-dia-form-archivo');
const fraseDiaFormPreview = document.getElementById('frase-dia-form-preview');
const fraseDiaFormPreviewWrap = document.getElementById('frase-dia-form-preview-wrap');
const fraseDiaModalGuardar = document.getElementById('frase-dia-modal-guardar');
const fraseDiaModalQuitar = document.getElementById('frase-dia-modal-quitar');
let fraseDiaBase64Nueva = '';

async function cargarFraseDelDia(){
    try {
        const resp = await fetch(`${API_BASE_URL}/frase-dia`);
        if (!resp.ok) return;
        const datos = await resp.json();
        if (datos.imagen && heroLogoImg) {
            heroLogoImg.src = datos.imagen;
        }
    } catch (err) {
        console.warn('No se pudo cargar la frase del día:', err);
    }
}
cargarFraseDelDia();

if (fraseDiaAdminBtn) {
    fraseDiaAdminBtn.addEventListener('click', () => {
        fraseDiaBase64Nueva = '';
        if (fraseDiaFormArchivo) fraseDiaFormArchivo.value = '';
        if (fraseDiaFormPreviewWrap) fraseDiaFormPreviewWrap.hidden = true;
        fraseDiaModal.classList.add('open');
    });
}
if (fraseDiaModalClose) fraseDiaModalClose.addEventListener('click', () => fraseDiaModal.classList.remove('open'));
if (fraseDiaModal) fraseDiaModal.addEventListener('click', (e) => { if (e.target === fraseDiaModal) fraseDiaModal.classList.remove('open'); });

if (fraseDiaFormArchivo) {
    fraseDiaFormArchivo.addEventListener('change', () => {
        const archivo = fraseDiaFormArchivo.files[0];
        if (!archivo) return;
        const lector = new FileReader();
        lector.onload = () => {
            fraseDiaBase64Nueva = lector.result;
            fraseDiaFormPreview.src = fraseDiaBase64Nueva;
            fraseDiaFormPreviewWrap.hidden = false;
        };
        lector.readAsDataURL(archivo);
    });
}

async function llamarFraseDiaAPI(metodo, body){
    let clave = obtenerClaveAdmin();
    if (!clave) {
        clave = window.prompt('Contraseña del panel:') || '';
        if (!clave) return null;
    }
    try {
        const resp = await fetch(`${API_BASE_URL}/frase-dia`, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, password: clave })
        });
        if (resp.status === 401) {
            alert('Contraseña incorrecta.');
            sessionStorage.removeItem('elalebrije-admin-clave');
            return null;
        }
        if (!resp.ok) throw new Error('Respuesta no válida');
        sessionStorage.setItem('elalebrije-admin-clave', clave);
        return true;
    } catch (err) {
        console.error('Error en frase del día:', err);
        alert('No se pudo conectar. Revisa tu internet e intenta de nuevo.');
        return null;
    }
}

if (fraseDiaModalGuardar) {
    fraseDiaModalGuardar.addEventListener('click', async () => {
        if (!fraseDiaBase64Nueva) {
            alert('Primero elige una imagen.');
            return;
        }
        fraseDiaModalGuardar.disabled = true;
        const ok = await llamarFraseDiaAPI('POST', { imagen: fraseDiaBase64Nueva });
        fraseDiaModalGuardar.disabled = false;
        if (!ok) return;
        if (heroLogoImg) heroLogoImg.src = fraseDiaBase64Nueva;
        fraseDiaModal.classList.remove('open');
        alert('Publicada: se verá para todos en el espacio del logo durante las próximas 24 horas, y después vuelve a salir el logo solo.');
    });
}

if (fraseDiaModalQuitar) {
    fraseDiaModalQuitar.addEventListener('click', async () => {
        if (!confirm('¿Quitar la imagen actual y regresar el logo para todos los visitantes?')) return;
        fraseDiaModalQuitar.disabled = true;
        const ok = await llamarFraseDiaAPI('DELETE', {});
        fraseDiaModalQuitar.disabled = false;
        if (!ok) return;
        if (heroLogoImg) heroLogoImg.src = LOGO_ORIGINAL_SRC;
        fraseDiaModal.classList.remove('open');
    });
}

cargaContenidoServidor.then(() => {
    pintarNoticias();
    pintarPromociones2();
    pintarPodcast();
    pintarVideos();
    pintarRecetas();
    aplicarOverridesInicio();
    aplicarOverridesInfo();
    aplicarOverridesMenu();
    pintarMenuNuevos();
    inyectarBotonesEdicionMenu();
    if (modoAdmin) mostrarBotonesAdmin(true);
});

// Revisa si se entró con el link secreto del panel de edición.
intentarActivarPanelSecreto();
if (modoAdmin) {
    mostrarBotonesAdmin(true);
    inyectarBotonesEdicionMenu();
}

// =====================================================================
// RECETAS
// =====================================================================
// Lista plana de recetas (con su categoría) que se muestra por defecto.
const RECETAS = [
    { categoria: 'Café', imagen: 'imagenes/capuchino.png', titulo: 'Capuchino', estelar: '⭐ Producto estelar: café de altura de Coatepec', ingredientes: ['Doble shot de espresso de grano recién molido', 'Leche entera vaporizada', 'Espuma cremosa con un toque de canela'], pasos: [] },
    { categoria: 'Café', imagen: 'imagenes/cafe-canela-miel.png', titulo: 'Café con Canela y Miel', estelar: '⭐ Un clásico reconfortante con un toque dulce y especiado', ingredientes: ['1 taza de café caliente', '½ cucharadita de canela en polvo', '1 cucharada de miel', 'Leche al gusto (opcional)'], pasos: ['Prepara tu café en moka o prensa francesa.', 'Agrega la miel y la canela directamente en la taza.', 'Revuelve bien hasta disolver todo.', 'Añade leche caliente si lo deseas.', 'Decora con un poco de canela encima.'] },
    { categoria: 'Café', imagen: 'imagenes/cafe-arabe-cardamomo.png', titulo: 'Café Árabe al Cardamomo', estelar: '⭐ Inspirado en la tradición del café árabe, aromático y especiado', ingredientes: ['1 taza de café negro', '3 vainas de cardamomo machacadas', 'Azúcar al gusto'], pasos: ['Añade el cardamomo en el agua antes de preparar el café en la moka.', 'Prepara el café normalmente.', 'Sirve caliente y endulza al gusto.', 'Puedes colar si no quieres restos de cardamomo.'] },
    { categoria: 'Café', imagen: 'imagenes/cafe-especiado-invierno.png', titulo: 'Café Especiado de Invierno', estelar: '⭐ Perfecto para los días fríos, con especias cálidas de temporada', ingredientes: ['1 taza de café', '1 pizca de canela', '1 pizca de nuez moscada', '1 pizca de clavo en polvo', 'Leche espumada'], pasos: ['Mezcla todas las especias en un recipiente.', 'Agrégalas al café recién hecho.', 'Añade leche espumada encima.', 'Espolvorea con un toque extra de canela.'] },
    { categoria: 'Café', imagen: 'imagenes/cafe-anis-estrellado.png', titulo: 'Café con Anís Estrellado', estelar: '⭐ Notas dulces y anisadas en cada sorbo', ingredientes: ['1 taza de café caliente', '1 anís estrellado', '1 cucharada de azúcar moreno'], pasos: ['Hierve el anís estrellado en un poco de agua por 2 minutos.', 'Usa esta infusión para preparar tu café.', 'Endulza con azúcar moreno y sirve caliente.'] },
    { categoria: 'Café', imagen: 'imagenes/cafe-jengibre-panela.png', titulo: 'Café Jengibre y Panela', estelar: '⭐ Picante, dulce y con el sabor natural de la panela', ingredientes: ['1 taza de café', '1 rodaja de jengibre fresco', '1 cucharada de panela rallada'], pasos: ['Hierve el jengibre en agua por 3 minutos.', 'Usa esa agua para hacer el café en la moka o prensa.', 'Disuelve la panela y sirve caliente.'] },
    { categoria: 'Café', imagen: 'imagenes/cafe-naranja-canela.png', titulo: 'Café Naranja y Canela', estelar: '⭐ Cítrico y aromático, con un toque de canela', ingredientes: ['1 taza de café', 'Cáscara de naranja (sin la parte blanca)', '½ cucharadita de canela'], pasos: ['Coloca la cáscara y la canela en el filtro de la moka o en la jarra de la prensa francesa.', 'Prepara el café normalmente.', 'Cuela si es necesario y sirve caliente.', 'Decora con un toque de cáscara fresca.'] },
    { categoria: 'Café', imagen: 'imagenes/cafe-chai-leche.png', titulo: 'Café Chai con Leche', estelar: '⭐ La fusión perfecta entre café y especias chai', ingredientes: ['½ taza de café fuerte', '½ taza de leche caliente', '¼ cucharadita de mezcla de chai (canela, jengibre, clavo, cardamomo, pimienta negra)'], pasos: ['Mezcla las especias chai con la leche caliente.', 'Deja infusionar por 2 minutos.', 'Agrega el café y revuelve bien.', 'Sirve caliente.'] },
    { categoria: 'Café', imagen: 'imagenes/cafe-pimienta-miel.png', titulo: 'Café con Pimienta Negra y Miel', estelar: '⭐ Un toque picante y dulce a la vez, ideal para sorprender', ingredientes: ['1 taza de café', '1 pizca de pimienta negra molida', '1 cucharada de miel'], pasos: ['Agrega la miel y la pimienta al café caliente.', 'Mezcla bien y sirve de inmediato.', 'Ideal para dar un toque picante y dulce.'] },
    { categoria: 'Café', imagen: 'imagenes/cafe-clavo-nuez.png', titulo: 'Café con Clavo de Olor y Nuez Moscada', estelar: '⭐ Especiado y cálido, perfecto para después de comer', ingredientes: ['1 taza de café', '1 pizca de clavo en polvo', '1 pizca de nuez moscada', 'Leche caliente (opcional)'], pasos: ['Mezcla las especias y agrégalas al café ya preparado.', 'Añade leche caliente si lo deseas.', 'Revuelve y decora con un poco más de nuez moscada.'] },
    { categoria: 'Otras recetas', imagen: 'imagenes/pozole-negro.png', titulo: 'Pozole Negro de Puerco con Chile Mulato y Chilhuacle Negro', estelar: '⭐ Como el de fonda oaxaqueña: salsa negra de chile mulato, chilhuacle negro y pasilla, frita en manteca', ingredientes: ['Para el caldo: 1 kg de espaldilla de puerco con hueso', 'Para el caldo: 500 g de codillo de puerco', 'Para el caldo: 4 litros de agua, 1 cabeza de ajo, 1 cebolla blanca, sal', 'Para la salsa negra: 6 chiles mulatos, 4 chilhuacles negros, 2 pasillas (secos, desvenados)', 'Para la salsa negra: 4 jitomates, 1/2 cebolla, 4 dientes de ajo, 1 tortilla tostada', 'Para la salsa negra: 2 cdas de manteca de puerco, orégano oaxaqueño, comino', 'Para el maíz: 800 g de maíz cacahuazintle precocido', 'Guarnición: repollo, cebolla morada, orégano, chile seco, limón, rábano, tostadas, queso fresco'], pasos: ['Cuece la carne y el maíz en agua con ajo, cebolla y sal (1h 45min aprox).', 'Tuesta y remoja los chiles 20 min; reserva agua de remojo.', 'Asa jitomates, cebolla, ajo y tortilla hasta oscurecer.', 'Licúa chiles, verduras asadas y tortilla con el agua de remojo; cuela.', 'Fríe la salsa en manteca caliente 8 min hasta que espese y oscurezca.', 'Deshebra la carne, regrésala al caldo con la salsa y el maíz; hierve 20 min más.'] }
];

function obtenerRecetasActuales(){
    return contenidoServidor.recetas || RECETAS;
}

function pintarRecetas(){
    const cont = document.getElementById('recetas-container');
    if (!cont) return;
    const recetas = obtenerRecetasActuales();
    const porCategoria = {};
    recetas.forEach((r) => {
        const cat = r.categoria || 'Recetas';
        if (!porCategoria[cat]) porCategoria[cat] = [];
        porCategoria[cat].push(r);
    });

    cont.innerHTML = '';
    Object.keys(porCategoria).forEach((cat) => {
        const catDiv = document.createElement('div');
        catDiv.className = 'menu-category';
        const grid = document.createElement('div');
        grid.className = 'receta-grid';
        porCategoria[cat].forEach((r) => {
            const art = document.createElement('article');
            art.className = 'receta-card';
            const ingredientesHtml = (r.ingredientes || []).map((i) => `<li>${i}</li>`).join('');
            const pasosHtml = (r.pasos && r.pasos.length)
                ? `<p class="receta-ingredientes-label">Preparación:</p><ol class="receta-pasos">${r.pasos.map((p) => `<li>${p}</li>`).join('')}</ol>`
                : '';
            art.innerHTML = `
                <img src="${r.imagen || ''}" alt="${r.titulo || ''}">
                <div class="receta-card-body">
                    <h5>${r.titulo || ''}</h5>
                    <span class="receta-estelar">${r.estelar || ''}</span>
                    <p class="receta-ingredientes-label">Ingredientes:</p>
                    <ul class="receta-ingredientes">${ingredientesHtml}</ul>
                    ${pasosHtml}
                </div>
            `;
            grid.appendChild(art);
        });
        catDiv.innerHTML = `<h4>${cat}</h4>`;
        catDiv.appendChild(grid);
        cont.appendChild(catDiv);
    });
}
pintarRecetas();

// Panel de administración de Recetas
const recetasAdminBtn = document.getElementById('recetas-admin-btn');
const recetasModal = document.getElementById('recetas-modal');
const recetasModalClose = document.getElementById('recetas-modal-close');
const recetasModalLista = document.getElementById('recetas-modal-lista');
const recetasModalAgregar = document.getElementById('recetas-modal-agregar');
const recetasModalGuardar = document.getElementById('recetas-modal-guardar');
let recetasFormulario = [];

function renderFormularioRecetas(){
    if (!recetasModalLista) return;
    recetasModalLista.innerHTML = '';
    recetasFormulario.forEach((r, i) => {
        const fila = document.createElement('div');
        fila.className = 'noticia-form';
        fila.innerHTML = `
            <div class="noticia-form-row">
                <div style="flex:1"><label>Categoría</label><input type="text" placeholder="Ej. Café" value="${r.categoria || ''}" data-campo="categoria" data-i="${i}"></div>
                <div style="flex:1">
                    <label>Imagen</label>
                    <input type="file" accept="image/*" data-campo-archivo="imagen" data-i="${i}">
                    ${r.imagen ? `<img src="${r.imagen}" style="max-width:100px; max-height:70px; display:block; margin-top:6px; border-radius:6px;" alt="">` : ''}
                </div>
            </div>
            <label>Título</label>
            <input type="text" placeholder="Nombre de la receta" value="${r.titulo || ''}" data-campo="titulo" data-i="${i}">
            <label style="margin-top:10px">Frase destacada (⭐)</label>
            <input type="text" placeholder="⭐ Lo que la hace especial" value="${r.estelar || ''}" data-campo="estelar" data-i="${i}">
            <label style="margin-top:10px">Ingredientes (uno por renglón)</label>
            <textarea data-campo="ingredientes" data-i="${i}">${(r.ingredientes || []).join('\n')}</textarea>
            <label style="margin-top:10px">Preparación (opcional, un paso por renglón)</label>
            <textarea data-campo="pasos" data-i="${i}">${(r.pasos || []).join('\n')}</textarea>
            <div style="margin-top:10px; text-align:right;">
                <button type="button" class="noticia-form-eliminar" data-i="${i}">🗑 Eliminar esta receta</button>
            </div>
        `;
        recetasModalLista.appendChild(fila);
    });
    recetasModalLista.querySelectorAll('input, textarea').forEach((input) => {
        input.addEventListener('input', () => {
            const i = Number(input.getAttribute('data-i'));
            const campo = input.getAttribute('data-campo');
            if (campo === 'ingredientes' || campo === 'pasos') {
                recetasFormulario[i][campo] = input.value.split('\n').map((s) => s.trim()).filter(Boolean);
            } else {
                recetasFormulario[i][campo] = input.value;
            }
        });
    });
    recetasModalLista.querySelectorAll('input[type="file"][data-campo-archivo]').forEach((input) => {
        input.addEventListener('change', () => {
            const archivo = input.files[0];
            if (!archivo) return;
            const i = Number(input.getAttribute('data-i'));
            const campo = input.getAttribute('data-campo-archivo');
            const lector = new FileReader();
            lector.onload = () => {
                recetasFormulario[i][campo] = lector.result;
                renderFormularioRecetas();
            };
            lector.readAsDataURL(archivo);
        });
    });
    recetasModalLista.querySelectorAll('.noticia-form-eliminar').forEach((btn) => {
        btn.addEventListener('click', () => {
            const i = Number(btn.getAttribute('data-i'));
            recetasFormulario.splice(i, 1);
            renderFormularioRecetas();
        });
    });
}

if (recetasAdminBtn) {
    recetasAdminBtn.addEventListener('click', () => {
        recetasFormulario = JSON.parse(JSON.stringify(obtenerRecetasActuales()));
        renderFormularioRecetas();
        recetasModal.classList.add('open');
    });
}
if (recetasModalClose) recetasModalClose.addEventListener('click', () => recetasModal.classList.remove('open'));
if (recetasModal) recetasModal.addEventListener('click', (e) => { if (e.target === recetasModal) recetasModal.classList.remove('open'); });
if (recetasModalAgregar) {
    recetasModalAgregar.addEventListener('click', () => {
        recetasFormulario.push({ categoria: '', imagen: '', titulo: '', estelar: '', ingredientes: [], pasos: [] });
        renderFormularioRecetas();
    });
}
if (recetasModalGuardar) {
    recetasModalGuardar.addEventListener('click', async () => {
        recetasModalGuardar.disabled = true;
        const ok = await guardarContenidoEnServidor('recetas', recetasFormulario);
        recetasModalGuardar.disabled = false;
        if (!ok) return;
        contenidoServidor.recetas = recetasFormulario;
        pintarRecetas();
        recetasModal.classList.remove('open');
        alert('Recetas actualizadas: ya se ven así para todos los visitantes.');
    });
}

// =====================================================================
// INICIO (hero)
// =====================================================================
const INICIO_DEFAULT = {
    titulo: '¡Bienvenida/o a El Alebrije, tu café cultural!',
    parrafo: 'Un rincón para desayunar rico, tomar el mejor café y disfrutar de la vibra, música y buenas pláticas. Aquí cada taza cuenta una historia.',
    botonTexto: 'Conócenos'
};

function obtenerInicioActual(){
    return contenidoServidor.inicio || INICIO_DEFAULT;
}

function aplicarOverridesInicio(){
    // Solo toca el título/párrafo/botón si el admin de verdad guardó un
    // cambio desde el panel — así el texto original (con su color naranja)
    // se queda intacto mientras nadie lo edite.
    const datos = contenidoServidor.inicio;
    if (!datos) return;
    const tituloEl = document.getElementById('hero-titulo');
    const parrafoEl = document.getElementById('hero-parrafo');
    const botonEl = document.getElementById('hero-boton');
    if (tituloEl && datos.titulo) tituloEl.textContent = datos.titulo;
    if (parrafoEl && datos.parrafo) parrafoEl.textContent = datos.parrafo;
    if (botonEl && datos.botonTexto) botonEl.textContent = datos.botonTexto;
}

const inicioAdminBtn = document.getElementById('inicio-admin-btn');
const inicioModal = document.getElementById('inicio-modal');
const inicioModalClose = document.getElementById('inicio-modal-close');
const inicioModalGuardar = document.getElementById('inicio-modal-guardar');
const inicioFormTitulo = document.getElementById('inicio-form-titulo');
const inicioFormParrafo = document.getElementById('inicio-form-parrafo');
const inicioFormBotonTexto = document.getElementById('inicio-form-boton-texto');

if (inicioAdminBtn) {
    inicioAdminBtn.addEventListener('click', () => {
        const datos = obtenerInicioActual();
        if (inicioFormTitulo) inicioFormTitulo.value = datos.titulo || '';
        if (inicioFormParrafo) inicioFormParrafo.value = datos.parrafo || '';
        if (inicioFormBotonTexto) inicioFormBotonTexto.value = datos.botonTexto || '';
        inicioModal.classList.add('open');
    });
}
if (inicioModalClose) inicioModalClose.addEventListener('click', () => inicioModal.classList.remove('open'));
if (inicioModal) inicioModal.addEventListener('click', (e) => { if (e.target === inicioModal) inicioModal.classList.remove('open'); });
if (inicioModalGuardar) {
    inicioModalGuardar.addEventListener('click', async () => {
        const nuevo = {
            titulo: inicioFormTitulo ? inicioFormTitulo.value.trim() : '',
            parrafo: inicioFormParrafo ? inicioFormParrafo.value.trim() : '',
            botonTexto: inicioFormBotonTexto ? inicioFormBotonTexto.value.trim() : ''
        };
        inicioModalGuardar.disabled = true;
        const ok = await guardarContenidoEnServidor('inicio', nuevo);
        inicioModalGuardar.disabled = false;
        if (!ok) return;
        contenidoServidor.inicio = nuevo;
        aplicarOverridesInicio();
        inicioModal.classList.remove('open');
        alert('Inicio actualizado: ya se ve así para todos los visitantes.');
    });
}
// =====================================================================
// INFORMACIÓN (Ubicación: horario, teléfono, correo, link del mapa)
// =====================================================================
function aplicarOverridesInfo(){
    const datos = contenidoServidor.info;
    if (!datos) return;
    const horarioEl = document.getElementById('info-horario');
    const telefonoEl = document.getElementById('info-telefono');
    const correoEl = document.getElementById('info-correo');
    const mapaEl = document.getElementById('info-mapa-link');
    if (horarioEl && datos.horario) horarioEl.textContent = datos.horario;
    if (telefonoEl && datos.telefono) telefonoEl.textContent = datos.telefono;
    if (correoEl && datos.correo) correoEl.textContent = datos.correo;
    if (mapaEl && datos.mapa) mapaEl.href = datos.mapa;
}

const infoAdminBtn = document.getElementById('info-admin-btn');
const infoModal = document.getElementById('info-modal');
const infoModalClose = document.getElementById('info-modal-close');
const infoModalGuardar = document.getElementById('info-modal-guardar');
const infoFormHorario = document.getElementById('info-form-horario');
const infoFormTelefono = document.getElementById('info-form-telefono');
const infoFormCorreo = document.getElementById('info-form-correo');
const infoFormMapa = document.getElementById('info-form-mapa');

if (infoAdminBtn) {
    infoAdminBtn.addEventListener('click', () => {
        const horarioEl = document.getElementById('info-horario');
        const telefonoEl = document.getElementById('info-telefono');
        const correoEl = document.getElementById('info-correo');
        const mapaEl = document.getElementById('info-mapa-link');
        if (infoFormHorario) infoFormHorario.value = horarioEl ? horarioEl.textContent.trim() : '';
        if (infoFormTelefono) infoFormTelefono.value = telefonoEl ? telefonoEl.textContent.trim() : '';
        if (infoFormCorreo) infoFormCorreo.value = correoEl ? correoEl.textContent.trim() : '';
        if (infoFormMapa) infoFormMapa.value = mapaEl ? mapaEl.getAttribute('href') : '';
        infoModal.classList.add('open');
    });
}
if (infoModalClose) infoModalClose.addEventListener('click', () => infoModal.classList.remove('open'));
if (infoModal) infoModal.addEventListener('click', (e) => { if (e.target === infoModal) infoModal.classList.remove('open'); });
if (infoModalGuardar) {
    infoModalGuardar.addEventListener('click', async () => {
        const nuevo = {
            horario: infoFormHorario ? infoFormHorario.value.trim() : '',
            telefono: infoFormTelefono ? infoFormTelefono.value.trim() : '',
            correo: infoFormCorreo ? infoFormCorreo.value.trim() : '',
            mapa: infoFormMapa ? infoFormMapa.value.trim() : ''
        };
        infoModalGuardar.disabled = true;
        const ok = await guardarContenidoEnServidor('info', nuevo);
        infoModalGuardar.disabled = false;
        if (!ok) return;
        contenidoServidor.info = nuevo;
        aplicarOverridesInfo();
        infoModal.classList.remove('open');
        alert('Información actualizada: ya se ve así para todos los visitantes.');
    });
}

// =====================================================================
// MENÚ MÓVIL: cerrar al elegir una sección + resaltar la tocada
// =====================================================================
const menuToggleCheckbox = document.getElementById('menu-toggle');
document.querySelectorAll('.navbar a').forEach((link) => {
    link.addEventListener('click', () => {
        link.classList.add('nav-link-tocado');
        setTimeout(() => link.classList.remove('nav-link-tocado'), 500);
        if (menuToggleCheckbox && menuToggleCheckbox.checked) {
            setTimeout(() => { menuToggleCheckbox.checked = false; }, 180);
        }
    });
});

// =====================================================================
// AGREGAR PRODUCTOS NUEVOS (Bebidas, Snacks, Desayunos, Comida Corrida)
// =====================================================================
const CATEGORIAS_MENU = ['bebidas', 'snacks', 'desayunos', 'corrida'];
const DIAS_NUEVO = 1; // cuánto dura resaltado un producto/sabor como "Nuevo" (1 día completo)

const NOMBRE_CATEGORIA_TAB = {
    bebidas: 'bebida', snacks: 'snack', desayunos: 'desayuno', corrida: 'comida corrida'
};

// Dónde (dentro de la pestaña de Bebidas) va cada subcategoría al agregar
// un producto nuevo. El selector busca el <h4>/<h5> correspondiente.
const SUBCATEGORIAS_BEBIDAS = {
    'cafe-caliente-tradicionales': { h4: 'Café Caliente', h5: 'Tradicionales' },
    'cafe-caliente-culturales': { h4: 'Café Caliente', h5: 'Culturales' },
    'cafe-frio': { h4: 'Café Frío', h5: null },
    'frappe': { h4: 'Frappé', h5: null },
    'te': { h4: 'Té', h5: null }
};

function esReciente(fechaIso){
    if (!fechaIso) return false;
    const dias = (Date.now() - new Date(fechaIso).getTime()) / (1000 * 60 * 60 * 24);
    return dias >= 0 && dias <= DIAS_NUEVO;
}

function fechaCortaHoy(){
    try {
        return new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch (err) { return 'Hoy'; }
}

// Publica automáticamente una noticia cuando se agrega algo nuevo al menú.
// Se marca con "automatica" + fecha real para que se borre sola en 1 día.
async function publicarNoticiaAutomatica(etiqueta, titulo, descripcion){
    try {
        const actuales = [...obtenerNoticiasActuales()];
        actuales.unshift({ fecha: fechaCortaHoy(), etiqueta, titulo, descripcion, automatica: true, creadaEn: new Date().toISOString() });
        const ok = await guardarContenidoEnServidor('noticias', actuales);
        if (ok) {
            contenidoServidor.noticias = actuales;
            pintarNoticias();
        }
    } catch (err) { /* si falla la noticia, no bloquea el guardado del producto */ }
}

// Busca dentro del panel de Bebidas el <div class="menu-sub"> que corresponde
// a la subcategoría elegida, para insertar ahí el producto nuevo.
function buscarContenedorSubcategoria(subKey){
    const def = SUBCATEGORIAS_BEBIDAS[subKey];
    if (!def) return null;
    const panel = document.getElementById('panel-bebidas');
    if (!panel) return null;
    const categorias = [...panel.querySelectorAll('.menu-category')];
    const categoria = categorias.find((c) => {
        const h4 = c.querySelector('h4');
        return h4 && h4.textContent.trim() === def.h4;
    });
    if (!categoria) return null;
    if (!def.h5) return categoria.querySelector('.menu-sub');
    const subs = [...categoria.querySelectorAll('.menu-sub')];
    return subs.find((s) => {
        const h5 = s.querySelector('h5');
        return h5 && h5.textContent.trim() === def.h5;
    }) || null;
}

function obtenerMenuNuevosActual(){
    return contenidoServidor.menuNuevos || { bebidas: [], snacks: [], desayunos: [], corrida: [] };
}

// Crea una tarjeta de producto sencilla (un solo precio, sin variantes) con
// exactamente la misma estructura que las tarjetas ya existentes, para que
// el carrito la reconozca automáticamente.
function crearTarjetaMenuSimple(item, itemId){
    const div = document.createElement('div');
    div.className = 'menu-item cart-item';
    div.setAttribute('data-name', item.nombre || '');
    div.setAttribute('data-base-price', item.precio);
    div.setAttribute('data-image', item.imagen || 'imagenes/logo.png');
    div.setAttribute('data-item-id', itemId);
    const badge = esReciente(item.fecha) ? '<span class="badge-nuevo">Nuevo</span>' : '';
    div.innerHTML = `
        <img class="menu-item-thumb" src="${item.imagen || 'imagenes/logo.png'}" alt="">
        <div class="menu-item-head"><span class="menu-item-name">${item.nombre || ''}${badge}</span><span class="menu-item-price" data-price-display>$${item.precio}</span></div>
        <p class="menu-item-desc">${item.descripcion || ''}</p>
        <button type="button" class="agregar-carrito-v2 btn-3">Agregar al carrito</button>
    `;
    return div;
}

// Le da a una tarjeta creada dinámicamente el mismo comportamiento
// (selector de cantidad + agregar al carrito) que ya tienen las demás.
function configurarNuevaTarjetaCarrito(card){
    if (!card.id) card.id = `cart-source-nuevo-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const btn = card.querySelector('.agregar-carrito-v2');
    if (!btn || card.querySelector('.cantidad-selector')) return;

    const selector = document.createElement('div');
    selector.className = 'cantidad-selector';
    selector.innerHTML = `
        <button type="button" class="cantidad-btn cantidad-menos" aria-label="Quitar una orden">−</button>
        <span class="cantidad-valor">1</span>
        <button type="button" class="cantidad-btn cantidad-mas" aria-label="Agregar una orden">+</button>
    `;
    btn.insertAdjacentElement('beforebegin', selector);
    selector.querySelector('.cantidad-menos').addEventListener('click', () => fijarCantidad(card, obtenerCantidad(card) - 1));
    selector.querySelector('.cantidad-mas').addEventListener('click', () => fijarCantidad(card, obtenerCantidad(card) + 1));
    fijarCantidad(card, 1);

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const precioUnitario = calcularPrecio(card);
        if (precioUnitario === null) return;
        const cantidad = obtenerCantidad(card);
        const precioTotal = precioUnitario * cantidad;
        const nombreBase = card.getAttribute('data-name');
        let titulo = nombreBase;
        if (cantidad > 1) titulo += ` ×${cantidad}`;
        const imagen = card.getAttribute('data-image') || 'imagenes/logo.png';

        contadorCarrito++;
        insertarCarrito({
            imagen: imagen,
            titulo: titulo,
            precio: formatearPrecio(precioTotal),
            id: `item-${contadorCarrito}`,
            sourceId: card.id
        });
        mostrarToastAgregado(cantidad > 1 ? `${nombreBase} ×${cantidad}` : nombreBase);
        fijarCantidad(card, 1);
    });
}

function pintarMenuNuevos(){
    const datos = obtenerMenuNuevosActual();
    CATEGORIAS_MENU.forEach((cat) => {
        const wrap = document.getElementById(`agregar-${cat}-wrap`);
        if (!wrap) return;
        (datos[cat] || []).forEach((item, i) => {
            const itemId = `nuevo-${cat}-${i}`;
            if (document.querySelector(`[data-item-id="${itemId}"]`)) return; // ya está pintado
            const card = crearTarjetaMenuSimple(item, itemId);
            const contenedorSub = cat === 'bebidas' ? buscarContenedorSubcategoria(item.subcategoria) : null;
            if (contenedorSub) {
                contenedorSub.appendChild(card);
            } else {
                wrap.insertAdjacentElement('beforebegin', card);
            }
            configurarNuevaTarjetaCarrito(card);
        });
    });
}

// Modal compartido para agregar un producto nuevo en cualquiera de las 4 pestañas.
const nuevoProductoModal = document.getElementById('nuevo-producto-modal');
const nuevoProductoModalClose = document.getElementById('nuevo-producto-modal-close');
const nuevoProductoNombre = document.getElementById('nuevo-producto-nombre');
const nuevoProductoDescripcion = document.getElementById('nuevo-producto-descripcion');
const nuevoProductoPrecio = document.getElementById('nuevo-producto-precio');
const nuevoProductoImagen = document.getElementById('nuevo-producto-imagen');
const nuevoProductoPreview = document.getElementById('nuevo-producto-preview');
const nuevoProductoPreviewWrap = document.getElementById('nuevo-producto-preview-wrap');
const nuevoProductoGuardar = document.getElementById('nuevo-producto-guardar');
const nuevoProductoSubcategoria = document.getElementById('nuevo-producto-subcategoria');
const nuevoProductoSubcategoriaLabel = document.getElementById('nuevo-producto-subcategoria-label');
let nuevoProductoCategoriaActual = null;
let nuevoProductoImagenBase64 = '';

CATEGORIAS_MENU.forEach((cat) => {
    const btn = document.getElementById(`agregar-${cat}-btn`);
    if (!btn) return;
    btn.addEventListener('click', () => {
        nuevoProductoCategoriaActual = cat;
        nuevoProductoImagenBase64 = '';
        if (nuevoProductoNombre) nuevoProductoNombre.value = '';
        if (nuevoProductoDescripcion) nuevoProductoDescripcion.value = '';
        if (nuevoProductoPrecio) nuevoProductoPrecio.value = '';
        if (nuevoProductoImagen) nuevoProductoImagen.value = '';
        if (nuevoProductoPreviewWrap) nuevoProductoPreviewWrap.hidden = true;
        const esBebida = cat === 'bebidas';
        if (nuevoProductoSubcategoria) nuevoProductoSubcategoria.hidden = !esBebida;
        if (nuevoProductoSubcategoriaLabel) nuevoProductoSubcategoriaLabel.hidden = !esBebida;
        nuevoProductoModal.classList.add('open');
    });
});

if (nuevoProductoImagen) {
    nuevoProductoImagen.addEventListener('change', () => {
        const archivo = nuevoProductoImagen.files[0];
        if (!archivo) return;
        const lector = new FileReader();
        lector.onload = () => {
            nuevoProductoImagenBase64 = lector.result;
            nuevoProductoPreview.src = nuevoProductoImagenBase64;
            nuevoProductoPreviewWrap.hidden = false;
        };
        lector.readAsDataURL(archivo);
    });
}

if (nuevoProductoModalClose) nuevoProductoModalClose.addEventListener('click', () => nuevoProductoModal.classList.remove('open'));
if (nuevoProductoModal) nuevoProductoModal.addEventListener('click', (e) => { if (e.target === nuevoProductoModal) nuevoProductoModal.classList.remove('open'); });

if (nuevoProductoGuardar) {
    nuevoProductoGuardar.addEventListener('click', async () => {
        const nombre = nuevoProductoNombre.value.trim();
        const precio = Number(nuevoProductoPrecio.value.trim());
        if (!nombre || !nuevoProductoPrecio.value.trim() || isNaN(precio)) {
            alert('Escribe al menos el nombre y un precio válido (solo el número).');
            return;
        }
        const nuevoItem = {
            nombre,
            descripcion: nuevoProductoDescripcion.value.trim(),
            precio,
            imagen: nuevoProductoImagenBase64,
            fecha: new Date().toISOString(),
            subcategoria: nuevoProductoCategoriaActual === 'bebidas' && nuevoProductoSubcategoria ? nuevoProductoSubcategoria.value : null
        };

        const datosActuales = obtenerMenuNuevosActual();
        const copia = {
            bebidas: [...(datosActuales.bebidas || [])],
            snacks: [...(datosActuales.snacks || [])],
            desayunos: [...(datosActuales.desayunos || [])],
            corrida: [...(datosActuales.corrida || [])]
        };
        copia[nuevoProductoCategoriaActual].push(nuevoItem);

        nuevoProductoGuardar.disabled = true;
        const ok = await guardarContenidoEnServidor('menu-nuevos', copia);
        nuevoProductoGuardar.disabled = false;
        if (!ok) return;

        contenidoServidor.menuNuevos = copia;
        pintarMenuNuevos();
        nuevoProductoModal.classList.remove('open');
        const etiquetaTab = NOMBRE_CATEGORIA_TAB[nuevoProductoCategoriaActual] || 'producto';
        publicarNoticiaAutomatica('Nuevo', `Nuevo en el menú: ${nombre}`, `Ya puedes pedir ${nombre}, nuestra nueva ${etiquetaTab}. ${nuevoItem.descripcion || ''}`.trim());
        alert('Producto agregado: ya se ve para todos los visitantes.');
    });
}

// =====================================================================
// AGREGAR SABOR NUEVO a una bebida ya existente (Frappé, Té, Atole, Capuchino, etc.)
// =====================================================================
const SABORES_ITEMS = [
    { id: 'capuchino', nombre: 'Capuchino' },
    { id: 'capuchino-frio', nombre: 'Capuchino Frío' },
    { id: 'latte', nombre: 'Latte' },
    { id: 'latte-frio', nombre: 'Latte Frío' },
    { id: 'atole', nombre: 'Atole' },
    { id: 'frappe', nombre: 'Frappé' },
    { id: 'te', nombre: 'Té' }
];

// Lee las opciones actuales de un producto (de lo guardado, o si nunca se
// ha tocado, de lo que ya está pintado en el HTML original).
function obtenerOpcionesDeItem(itemId){
    const overrides = contenidoServidor.menu || {};
    if (overrides[itemId] && overrides[itemId].opciones) return overrides[itemId].opciones;
    const tarjeta = document.querySelector(`[data-item-id="${itemId}"]`);
    const grupo = tarjeta ? tarjeta.querySelector('.item-options .option-group') : null;
    if (!grupo) return [];
    return [...grupo.querySelectorAll('.option-pill')].map((pill) => {
        const input = pill.querySelector('input');
        const span = pill.querySelector('span');
        const texto = span ? span.textContent.replace(/\s*·\s*\$\d+(\.\d+)?/, '').trim() : '';
        const p = input && input.getAttribute('data-price') ? Number(input.getAttribute('data-price')) : null;
        return { texto, precio: p, fecha: pill.getAttribute('data-fecha') || undefined };
    });
}

// =====================================================================
// ADMINISTRAR SABORES NUEVOS (modal interactivo: editar/eliminar/agregar)
// Solo se pueden tocar aquí los sabores agregados hace menos de 30 días.
// =====================================================================
const agregarSaborBtn = document.getElementById('agregar-sabor-btn');
const nuevoSaborModal = document.getElementById('nuevo-sabor-modal');
const nuevoSaborModalClose = document.getElementById('nuevo-sabor-modal-close');
const nuevoSaborCancelar = document.getElementById('nuevo-sabor-cancelar');
const nuevoSaborProducto = document.getElementById('nuevo-sabor-producto');
const nuevoSaborNombre = document.getElementById('nuevo-sabor-nombre');
const nuevoSaborPrecio = document.getElementById('nuevo-sabor-precio');
const nuevoSaborGuardar = document.getElementById('nuevo-sabor-guardar');
const nuevoSaborLista = document.getElementById('nuevo-sabor-lista');

let saboresFormulario = [];

function construirSaboresFormulario(){
    saboresFormulario = [];
    SABORES_ITEMS.forEach((it) => {
        obtenerOpcionesDeItem(it.id).filter((op) => esReciente(op.fecha)).forEach((op) => {
            saboresFormulario.push({ itemId: it.id, itemNombre: it.nombre, texto: op.texto, precio: op.precio, fecha: op.fecha, esNuevoEnSesion: false });
        });
    });
}

function pintarSaboresFormulario(){
    if (!nuevoSaborLista) return;
    nuevoSaborLista.innerHTML = '';
    if (!saboresFormulario.length) {
        nuevoSaborLista.innerHTML = '<p style="opacity:.7;margin:6px 0 14px;">Todavía no hay sabores nuevos (de menos de 30 días).</p>';
        return;
    }
    saboresFormulario.forEach((s, i) => {
        const fila = document.createElement('div');
        fila.className = 'noticia-form';
        fila.style.marginBottom = '10px';
        fila.innerHTML = `
            <label>${s.itemNombre}</label>
            <input type="text" data-campo="texto" placeholder="Nombre del sabor" value="${(s.texto || '').replace(/"/g, '&quot;')}">
            <input type="text" data-campo="precio" placeholder="Precio (vacío = no cambia)" value="${s.precio !== null && s.precio !== undefined ? s.precio : ''}" style="margin-top:8px">
            <button type="button" class="noticia-form-eliminar" style="margin-top:8px">🗑 Eliminar</button>
        `;
        fila.querySelector('[data-campo="texto"]').addEventListener('input', (e) => { saboresFormulario[i].texto = e.target.value; });
        fila.querySelector('[data-campo="precio"]').addEventListener('input', (e) => {
            saboresFormulario[i].precio = e.target.value.trim() === '' ? null : Number(e.target.value.trim());
        });
        fila.querySelector('.noticia-form-eliminar').addEventListener('click', () => {
            saboresFormulario.splice(i, 1);
            pintarSaboresFormulario();
        });
        nuevoSaborLista.appendChild(fila);
    });
}

function cerrarModalSabor(){
    if (nuevoSaborModal) nuevoSaborModal.classList.remove('open');
}

if (agregarSaborBtn) {
    agregarSaborBtn.addEventListener('click', () => {
        if (nuevoSaborNombre) nuevoSaborNombre.value = '';
        if (nuevoSaborPrecio) nuevoSaborPrecio.value = '';
        if (nuevoSaborProducto) nuevoSaborProducto.selectedIndex = 0;
        construirSaboresFormulario();
        pintarSaboresFormulario();
        if (nuevoSaborModal) nuevoSaborModal.classList.add('open');
    });
}
if (nuevoSaborModalClose) nuevoSaborModalClose.addEventListener('click', cerrarModalSabor);
if (nuevoSaborCancelar) nuevoSaborCancelar.addEventListener('click', cerrarModalSabor);
if (nuevoSaborModal) nuevoSaborModal.addEventListener('click', (e) => { if (e.target === nuevoSaborModal) cerrarModalSabor(); });

// Botón "Agregar a la lista": solo agrega el renglón dentro del modal
// (todavía no se guarda hasta darle "Guardar cambios").
const nuevoSaborAgregarLista = document.getElementById('nuevo-sabor-agregar-lista');
if (nuevoSaborAgregarLista) {
    nuevoSaborAgregarLista.addEventListener('click', () => {
        const itemId = nuevoSaborProducto.value;
        const itemNombre = nuevoSaborProducto.options[nuevoSaborProducto.selectedIndex].textContent;
        const sabor = nuevoSaborNombre.value.trim();
        if (!sabor) { alert('Escribe el nombre del sabor nuevo.'); return; }
        const precioTxt = nuevoSaborPrecio.value.trim();
        let precio = null;
        if (precioTxt) {
            precio = Number(precioTxt);
            if (isNaN(precio)) { alert('El precio debe ser un número, o déjalo vacío.'); return; }
        }
        saboresFormulario.push({ itemId, itemNombre, texto: sabor, precio, fecha: new Date().toISOString(), esNuevoEnSesion: true });
        nuevoSaborNombre.value = '';
        nuevoSaborPrecio.value = '';
        pintarSaboresFormulario();
    });
}

if (nuevoSaborGuardar) {
    nuevoSaborGuardar.addEventListener('click', async () => {
        const overrides = { ...(contenidoServidor.menu || {}) };
        SABORES_ITEMS.forEach((it) => {
            const viejas = obtenerOpcionesDeItem(it.id).filter((op) => !esReciente(op.fecha));
            const nuevasEditadas = saboresFormulario
                .filter((s) => s.itemId === it.id && s.texto.trim())
                .map((s) => ({ texto: s.texto.trim(), precio: s.precio, fecha: s.fecha }));
            const opcionesFinales = viejas.concat(nuevasEditadas);
            const opcionesConPrecio = (overrides[it.id] && overrides[it.id].opcionesConPrecio) || opcionesFinales.some((o) => o.precio !== null && o.precio !== undefined);
            overrides[it.id] = { ...(overrides[it.id] || {}), opciones: opcionesFinales, opcionesConPrecio };
        });

        nuevoSaborGuardar.disabled = true;
        const ok = await guardarContenidoEnServidor('menu', overrides);
        nuevoSaborGuardar.disabled = false;
        if (!ok) return;

        contenidoServidor.menu = overrides;
        aplicarOverridesMenu();
        cerrarModalSabor();

        const agregadosEnSesion = saboresFormulario.filter((s) => s.esNuevoEnSesion && s.texto.trim());
        for (const s of agregadosEnSesion) {
            await publicarNoticiaAutomatica('Nuevo sabor', `Nuevo sabor de ${s.itemNombre}: ${s.texto.trim()}`, `Ya puedes pedir tu ${s.itemNombre} en sabor ${s.texto.trim()}.`);
        }
        alert('Cambios guardados: ya se ven así para todos los visitantes.');
    });
}

// Reconstruye por completo el grupo de opciones de un producto a partir de
// lo guardado (permite reflejar ediciones, borrados y opciones nuevas).
const _aplicarOverridesMenuOriginal = aplicarOverridesMenu;
function aplicarOverridesMenuConOpciones(){
    _aplicarOverridesMenuOriginal();
    const overrides = contenidoServidor.menu || {};
    Object.keys(overrides).forEach((itemId) => {
        const cambio = overrides[itemId];
        if (!cambio.opciones) return;
        document.querySelectorAll(`[data-item-id="${itemId}"]`).forEach((tarjeta) => {
            let opcionesWrap = tarjeta.querySelector('.item-options');
            let grupo = tarjeta.querySelector('.item-options .option-group');
            if (!opcionesWrap) {
                opcionesWrap = document.createElement('div');
                opcionesWrap.className = 'item-options';
                const desc = tarjeta.querySelector('.menu-item-desc');
                (desc || tarjeta.querySelector('.menu-item-head')).insertAdjacentElement('afterend', opcionesWrap);
            }
            if (!grupo) {
                grupo = document.createElement('div');
                grupo.className = 'option-group';
                opcionesWrap.appendChild(grupo);
            }
            if (cambio.opcionesConPrecio) grupo.setAttribute('data-affects-price', 'true');
            else grupo.removeAttribute('data-affects-price');

            const nombreGrupo = `${itemId}-sabor`;
            grupo.innerHTML = '';
            cambio.opciones.forEach((op, i) => {
                const label = document.createElement('label');
                label.className = 'option-pill' + (esReciente(op.fecha) ? ' sabor-nuevo' : '');
                if (op.fecha) label.setAttribute('data-fecha', op.fecha);
                const badgeHtml = esReciente(op.fecha) ? '<span class="pill-badge-new">Nuevo</span>' : '';
                const marcado = i === 0 ? ' checked' : '';
                if (cambio.opcionesConPrecio && op.precio !== null && op.precio !== undefined) {
                    label.innerHTML = `<input type="radio" name="${nombreGrupo}" value="${op.texto}" data-price="${op.precio}"${marcado}><span>${op.texto} · $${op.precio}</span>${badgeHtml}`;
                } else {
                    label.innerHTML = `<input type="radio" name="${nombreGrupo}" value="${op.texto}"${marcado}><span>${op.texto}</span>${badgeHtml}`;
                }
                grupo.appendChild(label);
            });
        });
    });
}
aplicarOverridesMenu = aplicarOverridesMenuConOpciones;
