// api/content.js
//
// GET  -> cualquiera puede leer el contenido actual (así lo ve la página).
// POST -> solo con la contraseña correcta se puede guardar un cambio; ese
//         cambio se guarda en Vercel KV y se ve de inmediato para TODOS los
//         visitantes del sitio, sin tocar código ni volver a publicar nada.
//
// Tipos de contenido soportados: 'noticias', 'promociones', 'menu'

import { kv } from '@vercel/kv';

const TIPOS_VALIDOS = ['noticias', 'promociones', 'menu'];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        try {
            const [noticias, promociones, menu] = await Promise.all([
                kv.get('contenido:noticias'),
                kv.get('contenido:promociones'),
                kv.get('contenido:menu')
            ]);
            res.status(200).json({
                noticias: noticias || null,
                promociones: promociones || null,
                menu: menu || {}
            });
        } catch (err) {
            console.error('Error leyendo contenido:', err);
            res.status(500).json({ error: 'No se pudo leer el contenido' });
        }
        return;
    }

    if (req.method === 'POST') {
        try {
            const { tipo, datos, password } = req.body || {};

            if (password !== process.env.ADMIN_PASSWORD) {
                res.status(401).json({ error: 'Contraseña incorrecta' });
                return;
            }

            if (!TIPOS_VALIDOS.includes(tipo)) {
                res.status(400).json({ error: 'Tipo de contenido no válido' });
                return;
            }

            await kv.set(`contenido:${tipo}`, datos);
            res.status(200).json({ ok: true });
        } catch (err) {
            console.error('Error guardando contenido:', err);
            res.status(500).json({ error: 'No se pudo guardar el cambio' });
        }
        return;
    }

    res.status(405).json({ error: 'Método no permitido' });
}
