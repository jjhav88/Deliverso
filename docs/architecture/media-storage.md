# Media Storage

Bucket público: `deliverso-public-media`.

Lectura: pública.
Escritura: solo backend Admin con service role. Nunca en el navegador.

## Setup

```
pnpm storage:setup
```

Idempotente. Crea el bucket si falta. No borra archivos ni imprime secretos.

## Tipos y tamaño

JPEG, PNG, WebP, AVIF. Máximo 10 MB.

Se valida MIME declarado y firma mágica. SVG no se acepta.

## objectPath

`media/YYYY/MM/<uuid>.<ext>`

No se usa el filename original como path. `originalFilename` es metadata opcional.

La URL pública se deriva:

`{SUPABASE_URL}/storage/v1/object/public/{bucket}/{objectPath}`

No se guarda la URL como fuente de verdad.

## Upload

requireAdmin → validar → Storage upload → MediaAsset + translations → audit `MEDIA_UPLOADED`.

Si Storage ok y DB falla: se elimina el objeto recién subido.

Si Storage falla: no se crea MediaAsset.

## Delete

Si hay `ProductMedia` o `HomeHeroShowcaseItem`: bloqueado.

Si no: Storage remove → MediaAsset delete (cascade translations) → `MEDIA_DELETED`.

## ProductMedia

El modelo ya existe. Esta biblioteca es la fuente de assets para productos futuros.

## Runtime

El proyecto apunta a Node 22 LTS. El upload/delete de Storage sigue por REST server-only (`src/server/supabase/storage.ts`) porque es estable; no se reescribió al cambiar de Node 20.

El warning de `@supabase/supabase-js` sobre Node 20 desaparece en Node 22.
