// api/create-preference.js
//
// Esta función vive en Vercel (NO en GitHub Pages) porque necesita usar tu
// clave secreta de Mercado Pago (MP_ACCESS_TOKEN), y esa clave nunca debe
// quedar visible en el código del sitio (cualquiera podría copiarla y
// cobrar a nombre tuyo).
//
// Recibe: { folio, items: [{ nombre, precio }, ...] }
// Devuelve: { init_point } -> el link al que se manda al cliente para pagar.

export default async function handler(req, res) {
    // Permite que tu sitio en GitHub Pages (otro dominio) llame a esta función.
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

    try {
        const { folio, items } = req.body || {};

        if (!Array.isArray(items) || items.length === 0) {
            res.status(400).json({ error: 'El carrito está vacío' });
            return;
        }

        // Convierte cada renglón del carrito al formato que pide Mercado Pago.
        const itemsMP = items.map((item) => ({
            title: String(item.nombre || 'Producto').slice(0, 250),
            quantity: 1,
            unit_price: Number(item.precio) || 0,
            currency_id: 'MXN'
        }));

        const accessToken = process.env.MP_ACCESS_TOKEN;
        if (!accessToken) {
            res.status(500).json({ error: 'Falta configurar MP_ACCESS_TOKEN en Vercel' });
            return;
        }

        const respuestaMP = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                items: itemsMP,
                external_reference: folio || undefined,
                back_urls: {
                    success: process.env.SITE_URL || 'https://tu-usuario.github.io/cafe-el-alebrije/',
                    failure: process.env.SITE_URL || 'https://tu-usuario.github.io/cafe-el-alebrije/',
                    pending: process.env.SITE_URL || 'https://tu-usuario.github.io/cafe-el-alebrije/'
                },
                auto_return: 'approved'
            })
        });

        const datosMP = await respuestaMP.json();

        if (!respuestaMP.ok) {
            console.error('Error de Mercado Pago:', datosMP);
            res.status(502).json({ error: 'Mercado Pago rechazó la solicitud' });
            return;
        }

        res.status(200).json({ init_point: datosMP.init_point });
    } catch (err) {
        console.error('Error en create-preference:', err);
        res.status(500).json({ error: 'Error interno al crear el pago' });
    }
}
