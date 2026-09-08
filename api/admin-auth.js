// api/admin-auth.js
//
// Revisa la contraseña que se escribe al entrar al panel oculto de edición.
// La contraseña real vive en Vercel (variable ADMIN_PASSWORD), nunca en el
// código del sitio, para que nadie pueda leerla mirando el código fuente.

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método no permitido' });
        return;
    }

    const { password } = req.body || {};
    const claveReal = process.env.ADMIN_PASSWORD;

    if (!claveReal) {
        res.status(500).json({ error: 'Falta configurar ADMIN_PASSWORD en Vercel' });
        return;
    }

    if (password === claveReal) {
        res.status(200).json({ ok: true });
    } else {
        // Pequeña espera para dificultar intentos automáticos de adivinar la clave.
        await new Promise((r) => setTimeout(r, 800));
        res.status(401).json({ ok: false });
    }
}
