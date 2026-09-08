// api/frase-dia.js
//
// GET  -> devuelve la imagen del día si sigue vigente (o null si ya pasaron
//         las 24 horas, o si nunca se publicó una).
// POST -> guarda una nueva imagen (protegida con contraseña). Se guarda con
//         un "TTL" (tiempo de vida) de 24 horas exactas: pasado ese tiempo,
//         el propio servidor la borra solo, sin que nadie tenga que hacer
//         nada. No hace falta "quitarla" a mano.

import { kv } from '@vercel/kv';

const SEGUNDOS_24H = 24 * 60 * 60;

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
            const datos = await kv.get('contenido:frase-dia');
            res.status(200).json({ imagen: datos || null });
        } catch (err) {
            console.error('Error leyendo frase del día:', err);
            res.status(500).json({ error: 'No se pudo leer' });
        }
        return;
    }

    if (req.method === 'POST') {
        try {
            const { imagen, password } = req.body || {};
            if (password !== process.env.ADMIN_PASSWORD) {
                res.status(401).json({ error: 'Contraseña incorrecta' });
                return;
            }
            if (!imagen) {
                res.status(400).json({ error: 'Falta la imagen' });
                return;
            }
            await kv.set('contenido:frase-dia', imagen, { ex: SEGUNDOS_24H });
            res.status(200).json({ ok: true });
        } catch (err) {
            console.error('Error guardando frase del día:', err);
            res.status(500).json({ error: 'No se pudo guardar' });
        }
        return;
    }

    if (req.method === 'DELETE') {
        try {
            const { password } = req.body || {};
            if (password !== process.env.ADMIN_PASSWORD) {
                res.status(401).json({ error: 'Contraseña incorrecta' });
                return;
            }
            await kv.del('contenido:frase-dia');
            res.status(200).json({ ok: true });
        } catch (err) {
            console.error('Error quitando frase del día:', err);
            res.status(500).json({ error: 'No se pudo quitar' });
        }
        return;
    }

    res.status(405).json({ error: 'Método no permitido' });
}
