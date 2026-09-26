# IntegroLabs — Landing Page

Sitio de una sola página, sin build ni frameworks. Tres archivos hacen todo el trabajo:

```
integrolabs-landing/
├── index.html   ← todo el contenido y la estructura (texto, secciones)
├── css/
│   └── styles.css  ← colores, tipografía, layout, animaciones
└── js/
    └── main.js     ← menú móvil, animaciones al hacer scroll, el wizard del formulario
```

## Cómo editar texto o secciones

Todo el copy vive en `index.html`, en español, dentro de etiquetas normales
(`<h1>`, `<p>`, etc.). Para cambiar cualquier texto, busca la frase en ese
archivo y edítala directamente — no hace falta tocar CSS ni JS ni instalar nada.

## Cómo ver los cambios localmente

No hay build. Basta con abrir `index.html` con un servidor local simple
(abrirlo directo como archivo funciona para ver el texto, pero el navegador
puede bloquear algunas rutas relativas — mejor usar un servidor):

```bash
npx serve integrolabs-landing
```

o, si tienen Python instalado:

```bash
python -m http.server --directory integrolabs-landing 8080
```

Y abren `http://localhost:3000` (o el puerto que indique la terminal) en el navegador.

## Cómo desplegar

Es un sitio 100% estático — se puede arrastrar la carpeta completa a:

- **Netlify** (drag & drop en app.netlify.com/drop)
- **Vercel** (`vercel --prod` desde dentro de la carpeta, sin build step)
- **GitHub Pages** (subir el contenido a un repo y activar Pages)

No hay variables de entorno ni backend que configurar.

## El logo

El logo actual (círculo con gradiente azul + ícono geométrico blanco) es un
**placeholder hecho en SVG inline**, inspirado en la descripción del brief —
**no es el logo real de IntegroLabs** porque no se adjuntó ningún archivo de
imagen en la conversación donde se generó este sitio.

Para poner el logo real:
1. Guarda el archivo del logo (idealmente `.svg` o `.png` con fondo
   transparente) en una carpeta `assets/` dentro de `integrolabs-landing/`.
2. En `index.html`, reemplaza los dos bloques `<span class="logo-mark">…</span>`
   (uno en el nav, otro en el footer) por una etiqueta `<img>` apuntando a
   `assets/tu-logo.svg`.

## El formulario de calificación (wizard)

No envía datos a ningún servidor. Al terminar los 3 pasos, arma un mensaje de
WhatsApp con todas las respuestas y lo manda directo a
**+58 422-014-0873** vía un link `https://wa.me/...`. El usuario solo tiene
que confirmar el envío desde su propio WhatsApp.

Si en el futuro quieren capturar los leads en una base de datos además de
(o en vez de) WhatsApp, el lugar exacto para conectar eso está marcado con
un comentario en `js/main.js`, dentro de la función `buildWhatsAppMessage()`.

Si el número de WhatsApp cambia, solo hay que editar la constante
`WHATSAPP_NUMBER` al inicio de `js/main.js` (se usa tanto en el wizard como
en el footer).

## Sistema de diseño

Los colores, tipografía y espaciados están centralizados como variables CSS
al inicio de `css/styles.css` (bloque `:root`). Cambiar un color en un solo
lugar (por ejemplo `--accent-1` o `--accent-2`) lo actualiza en todo el sitio.
