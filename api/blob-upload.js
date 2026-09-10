// api/blob-upload.js
//
// Autoriza y coordina la subida de archivos grandes (audio de podcast,
// video grabado, etc.) directo desde el navegador hacia Vercel Blob.
//
// ¿Por qué no simplemente guardarlos en Vercel KV como el resto del
// contenido? Porque KV (y el límite de tamaño de las funciones de Vercel)
// solo aguanta unos pocos MB. Un mp3 o un video pesan mucho más que eso,
// así que se suben directo a Vercel Blob (almacenamiento de archivos) y
// en KV solo se guarda el LINK del archivo, que sí es chiquito.
//
// Requiere: crear un "Blob store" en Vercel (Storage → Create Database →
// Blob) y conectarlo a este proyecto. Vercel agrega automáticamente la
// variable BLOB_READ_WRITE_TOKEN al hacerlo, no hay que escribirla a mano.

import { handleUpload } from '@vercel/blob/client';

export default async function handler(request, response) {
    res_headers(response);

    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    if (request.method !== 'POST') {
        response.status(405).json({ error: 'Método no permitido' });
        return;
    }

    const body = request.body;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname, clientPayload) => {
                let payload = {};
                try { payload = clientPayload ? JSON.parse(clientPayload) : {}; } catch (err) { /* payload vacío */ }

                if (payload.password !== process.env.ADMIN_PASSWORD) {
                    throw new Error('Contraseña incorrecta');
                }

                return {
                    allowedContentTypes: ['audio/*', 'video/*', 'image/*', 'application/octet-stream'],
                    addRandomSuffix: true,
                    maximumSizeInBytes: 300 * 1024 * 1024 // tope de seguridad: 300 MB
                };
            },
            onUploadCompleted: async () => {
                // No se necesita hacer nada extra: el link ya lo guarda el
                // panel de edición dentro del contenido (podcast/videos).
            }
        });

        response.status(200).json(jsonResponse);
    } catch (err) {
        console.error('Error autorizando subida de archivo:', err);
        response.status(400).json({ error: err.message || 'No se pudo autorizar la subida' });
    }
}

function res_headers(response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
