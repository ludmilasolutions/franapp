# Patch: Registro de Locales (Self‑Service)

Este parche agrega:
- `/registro.html` formulario público
- `/.netlify/functions/create-local` Function para crear PR en GitHub con el JSON del local
- `shared/local.schema.json` y `shared/products.schema.json`
- `data/locales/ejemplo-local.json` (de ejemplo)

## Variables de entorno (Netlify)
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_DEFAULT_BRANCH` = `main`
- `GITHUB_TOKEN` (PAT con permisos: Contents RW, Pull Requests RW)
- `ADMIN_REVIEWER` (opcional: usuario GitHub para asignar y pedir review)
- `HCAPTCHA_SECRET` (opcional si activás hCaptcha invisible en el form)

## Cómo probar
1. Copiá estos archivos en tu repo base (mgv-main).
2. Deploy en Netlify.
3. Abrí `/registro.html`, completá y enviá.
4. Verás un PR abierto en tu repo. Al hacer **merge**, el local aparecerá.

## Notas
- Costos por zona se editan luego desde el panel.
- Orden por defecto = 100 (editable por admin).

