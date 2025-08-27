# Franapp — Alta de locales (con PR)

Este paquete agrega:

- `/registro.html` + `registro.js`: formulario público con validaciones, hCaptcha e integración a Netlify Function.
- `netlify/functions/alta-local.js`: función que verifica hCaptcha y abre un Pull Request con `locales/{slug}.json}`.
- `locales/example.json`: esquema de referencia.
- `terminos.html`: plantilla base de términos.
- `netlify.toml` y `.env.example`.

## Configuración rápida

1. **GitHub**: creá un repo y configurá variables de entorno en Netlify:
   - `GITHUB_TOKEN` (repo scope), `GITHUB_OWNER`, `GITHUB_REPO`, `TARGET_BRANCH=main`, `CONTENT_DIR=locales`.

2. **hCaptcha**: registrá tu sitio y poné:
   - `HCAPTCHA_SITEKEY` en `registro.html` (reemplazá `HCAPTCHA_SITEKEY_AQUI`).
   - `HCAPTCHA_SECRET` en las envs de Netlify.

3. **Netlify**:
   - Deployá el repo. `netlify/functions` queda automáticamente habilitado.
   - Verificá logs cuando envíes un alta.

## Flujo

- El comerciante completa `/registro.html` → la función genera rama `alta/{slug}` y crea `locales/{slug}.json}` → abre **PR** a `main`.
- El admin revisa y hace **merge**.
- El sitio lee `/locales/*.json` en build y publica el local.

## JSON del local (resumen)

```jsonc
{
  "slug": "lomo-king-remedios",
  "name": "Lomo King",
  "category": "rotiseria",
  "bio": "…",
  "images": { "logo": "…", "banner": "…" },
  "address": { "line": "…", "mapUrl": "…", "geo": { "lat": -32.9, "lng": -60.68 } },
  "whatsapp": "+549…",
  "hours": [ { "day": "lun-vie", "open": "11:30", "close": "23:30" } ],
  "delivery": { "model": "zones", "zones": [ { "name": "Centro", "price": 900 } ] },
  "methods": { "delivery": ["retiro","envio"], "payment": ["efectivo","mp","tarjeta"] },
  "social": { "instagram": "…", "facebook": "", "web": "" },
  "weight": 50,
  "status": "pending",
  "createdAt": "ISO-8601"
}
```

## Notas

- Imágenes: mínimo 800×450 y &lt;400KB (se valida el formato/URL del lado del cliente; optimización recomendada en el lado del proveedor).
- El costo de envío se calcula por **zona** (tabla).
- Productos se cargan luego desde el **panel del local** (siguiente etapa).
