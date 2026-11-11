// api/resenas.js
//
// Reseñas del café (platillos, atención, ambiente...).
//
// GET    -> cualquiera puede leer las reseñas publicadas.
// POST   -> CUALQUIER persona puede dejar una reseña (sin contraseña), con
//           calificación de 1 a 5 estrellas. Se valida y limpia todo lo que
//           llega, y hay un límite de reseñas por persona/hora contra spam.
// DELETE -> solo el administrador (con la contraseña) puede borrar una
//           reseña inapropiada.
//
// Las reseñas se guardan en Vercel KV en un "hash" (una reseña por campo),
// así dos personas escribiendo al mismo tiempo nunca se pisan entre sí.

import { kv } from '@vercel/kv';

const CLAVE = 'resenas';
const CATEGORIAS = ['platillos', 'atencion', 'ambiente', 'general'];
const MAX_NOMBRE = 40;
const MAX_COMENTARIO = 500;
const MAX_POR_HORA = 3;     // reseñas permitidas por persona (IP) cada hora
const MAX_DEVUELTAS = 200;  // tope de reseñas que se mandan al sitio

function limpiarTexto(valor, max) {
    return String(valor == null ? '' : valor)
        .replace(/[\u0000-\u001F\u007F]/g, ' ')   // caracteres de control
        .replace(/[<>]/g, '')                       // sin etiquetas HTML
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max);
}

function ipDelVisitante(req) {
    const xff = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(xff) ? xff[0] : (xff || '')).split(',')[0].trim();
    return ip || (req.socket && req.socket.remoteAddress) || 'desconocida';
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        try {
            const todas = (await kv.hgetall(CLAVE)) || {};
            const resenas = Object.values(todas)
                .map((r) => (typeof r === 'string' ? JSON.parse(r) : r))
                .filter((r) => r && r.id && r.estrellas)
                .sort((a, b) => (b.fecha || 0) - (a.fecha || 0))
                .slice(0, MAX_DEVUELTAS);
            res.status(200).json({ resenas });
        } catch (err) {
            console.error('Error leyendo reseñas:', err);
            res.status(500).json({ error: 'No se pudieron leer las reseñas' });
        }
        return;
    }

    if (req.method === 'POST') {
        try {
            const { nombre, estrellas, categoria, comentario, sitioWeb } = req.body || {};

            // Campo trampa: las personas no lo ven ni lo llenan, los bots sí.
            // Se responde "ok" para no darle pistas al bot, pero no se guarda.
            if (sitioWeb) {
                res.status(200).json({ ok: true });
                return;
            }

            const nEstrellas = Number(estrellas);
            if (!Number.isInteger(nEstrellas) || nEstrellas < 1 || nEstrellas > 5) {
                res.status(400).json({ error: 'Elige de 1 a 5 estrellas.' });
                return;
            }

            const textoNombre = limpiarTexto(nombre, MAX_NOMBRE);
            const textoComentario = limpiarTexto(comentario, MAX_COMENTARIO);
            if (!textoNombre) {
                res.status(400).json({ error: 'Escribe tu nombre.' });
                return;
            }
            if (textoComentario.length < 3) {
                res.status(400).json({ error: 'Cuéntanos un poco más en tu comentario.' });
                return;
            }

            // Límite de reseñas por persona para evitar spam.
            const claveLimite = `resenas-limite:${ipDelVisitante(req)}`;
            const usadas = await kv.incr(claveLimite);
            if (usadas === 1) await kv.expire(claveLimite, 60 * 60);
            if (usadas > MAX_POR_HORA) {
                res.status(429).json({ error: 'Ya enviaste varias reseñas. Intenta de nuevo más tarde.' });
                return;
            }

            const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
            const resena = {
                id,
                nombre: textoNombre,
                estrellas: nEstrellas,
                categoria: CATEGORIAS.includes(categoria) ? categoria : 'general',
                comentario: textoComentario,
                fecha: Date.now()
            };
            await kv.hset(CLAVE, { [id]: resena });
            res.status(200).json({ ok: true, resena });
        } catch (err) {
            console.error('Error guardando reseña:', err);
            res.status(500).json({ error: 'No se pudo guardar tu reseña. Intenta de nuevo.' });
        }
        return;
    }

    if (req.method === 'DELETE') {
        try {
            const { id, password } = req.body || {};
            if (!password || password !== process.env.ADMIN_PASSWORD) {
                res.status(401).json({ error: 'Contraseña incorrecta' });
                return;
            }
            if (!id) {
                res.status(400).json({ error: 'Falta el id de la reseña' });
                return;
            }
            await kv.hdel(CLAVE, String(id));
            res.status(200).json({ ok: true });
        } catch (err) {
            console.error('Error borrando reseña:', err);
            res.status(500).json({ error: 'No se pudo borrar la reseña' });
        }
        return;
    }

    res.status(405).json({ error: 'Método no permitido' });
}
