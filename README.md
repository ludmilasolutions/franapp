# franapp (starter tipo franapp)

Estructura:
- `index.html` + `styles.css` + `app.js`: Home con header sticky, búsqueda, carrusel de categorías, tarjetas de locales y skeleton shimmer.
- `index.json`: Datos mock de categorías y 5 locales.
- `local.html` + `local.js`: Pantalla del local con hero, tabs por categoría, lista de productos, carrito básico y barra de checkout.
- `menus.json`: Productos de ejemplo por local.
- `assets/logo-franapp.svg`: Logo simple.

## Uso
Abrí `index.html` en un navegador (doble click). No requiere server, pero si activás CORS estrictos, podés correr un server local:

Python 3:
```
cd franapp
python3 -m http.server 8000
```
Luego visitá http://localhost:8000

¡A justar estilos y datos a gusto!
