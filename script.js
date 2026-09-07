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
// NOTICIAS Y EVENTOS
// =====================================================================
// Esta es la lista de noticias/eventos que se muestran en la sección
// "Noticias" del inicio. Para agregar, editar o quitar una noticia SIN
// tocar nada más del código, edita esta lista:
//
//   { fecha: "Sáb 14 sep", etiqueta: "Evento", titulo: "...", descripcion: "..." }
//
//   - fecha: texto corto, como se quiera mostrar (ej. "Sáb 14 sep", "Todo septiembre").
//   - etiqueta: una palabra para clasificarla (ej. "Evento", "Aviso", "Exposición").
//   - titulo / descripcion: el texto de la tarjeta.
//
// Copia un bloque como los de abajo (con llaves { } y coma al final) para
// agregar una noticia nueva. Se muestran en el mismo orden en que están aquí.
//
// TIP: el sitio también trae un botón "✏️ Administrar noticias" (arriba de
// la sección Noticias) para agregar/editar/borrar sin tocar código, con un
// PIN de acceso (NOTICIAS_PIN, aquí abajo). OJO: esos cambios solo se ven en
// el navegador donde se hicieron. Para que se vean igual para TODAS las
// personas que visiten el sitio, hay que usar el botón "Copiar código para
// el sitio" de ese panel y pegar el resultado aquí, reemplazando esta lista.
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

    const noticias = obtenerNoticiasActuales();
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
        if (!noticiasDesbloqueadas) {
            const intento = window.prompt('Escribe el PIN para administrar las noticias:');
            if (intento === null) return;
            if (intento !== NOTICIAS_PIN) {
                alert('PIN incorrecto.');
                return;
            }
            noticiasDesbloqueadas = true;
        }
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
    noticiasModalGuardar.addEventListener('click', () => {
        const nuevas = leerFormularioNoticias();
        try {
            localStorage.setItem(NOTICIAS_STORAGE_KEY, JSON.stringify(nuevas));
        } catch (err) { /* almacenamiento no disponible en este navegador */ }
        pintarNoticias();
        cerrarNoticiasModal();
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
        if (!promos2Desbloqueadas) {
            const intento = window.prompt('Escribe el PIN para administrar las promociones:');
            if (intento === null) return;
            if (intento !== PROMOCIONES2_PIN) {
                alert('PIN incorrecto.');
                return;
            }
            promos2Desbloqueadas = true;
        }
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
    promo2ModalGuardar.addEventListener('click', () => {
        const nuevas = leerFormularioPromos2();
        try {
            localStorage.setItem(PROMOCIONES2_STORAGE_KEY, JSON.stringify(nuevas));
        } catch (err) { /* almacenamiento no disponible en este navegador */ }
        pintarPromociones2();
        cerrarPromo2Modal();
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
const videoCards = document.querySelectorAll('.video-card');

videoCards.forEach((card) => {
    card.addEventListener('click', () => {
        const videoId = card.getAttribute('data-video');
        const title = card.getAttribute('data-title') || 'Video';

        if (!videoId) {
            // Aún no se ha conectado un video real para esta tarjeta.
            videoModalFrame.innerHTML = `<p style="color:#fff;padding:40px;text-align:center;">
                Todavía no se ha agregado el video de "${title}".<br>
                Edita el atributo data-video de esta tarjeta en inicio.html.
            </p>`;
        } else {
            videoModalFrame.innerHTML = `<iframe
                src="https://www.youtube.com/embed/${videoId}"
                title="${title}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen></iframe>`;
        }
        videoModal.classList.add('open');
    });
});

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
        const esTransferencia = input.value === 'Transferencia' && input.checked;
        if (!input.checked) return;
        if (pedidoPagoEfectivo) pedidoPagoEfectivo.hidden = esTransferencia;
        if (pedidoPagoTransferencia) pedidoPagoTransferencia.hidden = !esTransferencia;
        if (pedidoMontoError) pedidoMontoError.classList.remove('show');
        if (pedidoNombreError) pedidoNombreError.classList.remove('show');
        if (pedidoConfirmoError) pedidoConfirmoError.classList.remove('show');
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

if (pedidoModalEnviar) {
    pedidoModalEnviar.addEventListener('click', () => {
        const filas = [...lista.querySelectorAll('tr')];
        if (!filas.length) {
            cerrarPedidoModal();
            return;
        }

        const metodoPagoInput = document.querySelector('input[name="pedido-pago"]:checked');
        const metodoPago = metodoPagoInput ? metodoPagoInput.value : 'Efectivo';
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