/* Mejoras progresivas compartidas: el contenido sigue disponible sin JavaScript. */
(() => {
    'use strict';
    const cuerpo = document.querySelector('.guide-body');
    if (!cuerpo) return;

    const progreso = document.createElement('div');
    progreso.className = 'guide-progress';
    progreso.setAttribute('aria-hidden', 'true');
    progreso.append(document.createElement('span'));
    document.body.prepend(progreso);
    let pendiente = false;
    function actualizarProgreso() {
        const altura = document.documentElement.scrollHeight - window.innerHeight;
        progreso.style.setProperty('--reading-progress', String(altura > 0 ? Math.min(1, Math.max(0, window.scrollY / altura)) : 1));
        pendiente = false;
    }
    window.addEventListener('scroll', () => {
        if (!pendiente) { pendiente = true; requestAnimationFrame(actualizarProgreso); }
    }, { passive: true });
    window.addEventListener('resize', actualizarProgreso, { passive: true });
    window.addEventListener('load', actualizarProgreso, { once: true });
    actualizarProgreso();

    // Añade índice a las guías que todavía no disponían de uno.
    if (!cuerpo.querySelector('.cat-nav, .rank-nav')) {
        const titulos = [...cuerpo.querySelectorAll('.section-header .section-title, :scope > .section-title')];
        if (titulos.length > 1) {
            const nav = document.createElement('nav');
            nav.className = 'guide-chapters';
            nav.setAttribute('aria-label', 'Secciones de esta guía');
            titulos.forEach((titulo, indice) => {
                const seccion = titulo.closest('.vote-section, .marry-section') || titulo;
                if (!seccion.id) seccion.id = 'seccion-guia-' + (indice + 1);
                const enlace = document.createElement('a');
                enlace.href = '#' + seccion.id;
                enlace.textContent = titulo.textContent.trim();
                nav.append(enlace);
            });
            const volver = cuerpo.querySelector('.back-btn');
            if (volver) volver.after(nav); else cuerpo.prepend(nav);
        }
    }

    const enlaces = [...cuerpo.querySelectorAll('.cat-nav a, .rank-nav a, .guide-chapters a')];
    const secciones = enlaces.map(enlace => ({ enlace, elemento: document.getElementById(enlace.hash.slice(1)) })).filter(s => s.elemento);
    if (secciones.length && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entradas => {
            const entrada = entradas.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
            if (!entrada) return;
            secciones.forEach(({ enlace, elemento }) => {
                const activo = elemento === entrada.target;
                enlace.classList.toggle('active', activo);
                if (activo) enlace.setAttribute('aria-current', 'location'); else enlace.removeAttribute('aria-current');
            });
        }, { rootMargin: '-155px 0px -55% 0px', threshold: 0 });
        secciones.forEach(s => observer.observe(s.elemento));
    }

    const aviso = document.createElement('div');
    aviso.className = 'guide-copy-status';
    aviso.setAttribute('role', 'status');
    aviso.setAttribute('aria-live', 'polite');
    document.body.append(aviso);
    let cierreAviso;
    cuerpo.querySelectorAll('.cmd-code, .code').forEach(codigo => {
        const texto = codigo.textContent.trim();
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'copy-command';
        boton.textContent = '⧉';
        boton.setAttribute('aria-label', 'Copiar ' + texto);
        boton.title = 'Copiar';
        boton.addEventListener('click', async () => {
            try {
                if (!navigator.clipboard?.writeText) throw new Error('Clipboard no disponible');
                let limite;
                try {
                    await Promise.race([
                        navigator.clipboard.writeText(texto),
                        new Promise((_, rechazar) => { limite = window.setTimeout(() => rechazar(new Error('Permiso de copia no disponible')), 1500); })
                    ]);
                } finally { window.clearTimeout(limite); }
                boton.textContent = '✓';
                boton.classList.add('is-copied');
                aviso.textContent = 'Copiado: ' + texto;
                window.setTimeout(() => { boton.textContent = '⧉'; boton.classList.remove('is-copied'); }, 1800);
            } catch {
                // La copia puede estar restringida al abrir el HTML localmente.
                const seleccion = window.getSelection();
                if (seleccion && codigo.firstChild) {
                    const rango = document.createRange();
                    rango.selectNode(codigo.firstChild);
                    seleccion.removeAllRanges(); seleccion.addRange(rango);
                }
                aviso.textContent = 'Texto seleccionado: cópialo con Ctrl+C o desde el menú de tu dispositivo.';
            }
            window.clearTimeout(cierreAviso);
            cierreAviso = window.setTimeout(() => { aviso.textContent = ''; }, 3000);
        });
        codigo.append(boton);
    });

    const guias = [
        ['guia-conexion.html', '🗺️ Conexión'], ['guia-comandos.html', '⌨️ Comandos'],
        ['guia-rangos.html', '💎 Rangos'], ['guia-misiones.html', '📜 Misiones'],
        ['guia-clanes.html', '⚔️ Clanes'], ['guia-matrimonio.html', '💍 Matrimonio'],
        ['guia-economia.html', '💰 Economía'], ['guia-votacion.html', '🗳️ Votación']
    ];
    const relacionadas = document.createElement('nav');
    relacionadas.className = 'guide-related';
    relacionadas.setAttribute('aria-label', 'Más guías de Arcanis');
    const encabezado = document.createElement('h2');
    encabezado.textContent = 'Sigue explorando Arcanis';
    const listado = document.createElement('div');
    listado.className = 'guide-related-links';
    const actual = location.pathname.split('/').pop();
    guias.filter(([archivo]) => archivo !== actual).forEach(([archivo, nombre]) => {
        const enlace = document.createElement('a'); enlace.href = archivo; enlace.textContent = nombre; listado.append(enlace);
    });
    relacionadas.append(encabezado, listado); cuerpo.append(relacionadas);
})();
