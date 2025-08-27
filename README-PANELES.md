
# Franapp · Registro y Paneles

Este parche agrega:
- `/registro.html` → Form público de **alta de locales** (valida y pega a Netlify Function).
- `/panel-local.html` → Editor sencillo del JSON de cada local (dueños).
- `/panel-admin.html` → Listado/inspección de locales para admins.
- `/.netlify/functions/submit-local` → función que crea **PR en GitHub** si hay credenciales.

## Flujo (tu sugerencia)
1) Usuario completa **/registro.html**.
2) **Netlify Function** valida, crea branch `alta/{slug}-{id}` y sube `/locales/{slug}.json`.
3) Abre **Pull Request** a la rama `main` para revisión y merge manual.
4) Tras merge, el local se publica.

### Variables de entorno (Netlify)
- `GITHUB_TOKEN` → token con permisos repo.
- `GITHUB_REPO` → `usuario/repositorio`
- `GITHUB_BASE` → rama base (default `main`).

### Opcional
- Crear `/locales/index.json` con un array de locales para que el **panel admin** los liste sin backend.

---

**Importante:** Esto es estático; para edición persistente desde el panel necesitarías una API o GitHub write desde el browser (no recomendado). El editor actual te permite **descargar** el JSON ya validado para subirlo al repo o adjuntarlo al PR.
