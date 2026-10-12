# IntegroLabs — Landing Page

Sitio de una sola página, sin build ni frameworks (HTML + CSS + JS).

```
integrolabs-landing/
├── index.html          ← contenido y estructura (texto, secciones)
├── legal.html          ← política de datos y cookies (enlazada en el pie)
├── assets/
│   ├── logo-integrolabs.png   ← logo (menú, pie y favicon)
│   └── team/                  ← fotos del equipo (recortadas en cuadrado)
├── css/
│   ├── styles.css      ← tokens, botones, menú, hero, formulario, pie
│   └── sections.css    ← bloques (franja, comparador, soluciones, equipo, chat) y tema claro
└── js/
    ├── main.js         ← menú, scroll, formulario, selector de versión clara/oscura
    ├── sections.js     ← franja, comparador, stepper, carrusel, equipo, chat
    ├── icons.js        ← íconos Lucide incrustados
    └── integrolabs-weave.js  ← animación "Tejido" del hero (no modificar)
```

## Cómo editar texto o secciones

Todo el copy vive en `index.html`, en español, dentro de etiquetas normales.
Busca la frase y edítala directamente.

## Hero

El texto va centrado y la animación "Tejido" se dibuja a ambos costados:
hay **dos** `<canvas data-weave>` (`.hero-weave--r` y `.hero-weave--l`). La
izquierda es la misma animación girada 180° por CSS. En móvil solo se usa una,
en la mitad inferior. El ancho de la columna de texto es `--hero-text`
(`css/styles.css`, bloque `.hero`).

## Soluciones de Inteligencia Artificial

Bloque `#soluciones`: Chatbots, Creación de páginas web, Manejo de Ads y
Edición de videos con IA (tarjeta destacada de ancho completo, con un mock animado de
editor). Los mini-visuales son solo CSS.

## Versión clara / oscura

Selector fijo en la esquina inferior derecha (`#themeSwitch`). La versión clara es la
oficial (predeterminada); la elección se guarda en `localStorage` (`il-theme`). El tema
claro es un bloque `html[data-theme="light"]` al final de `css/sections.css`
que redefine las variables de color. La animación del hero solo lee sus
colores al montarse, por eso `main.js` la vuelve a montar al cambiar de tema.

## Equipo

Las fotos se configuran al inicio de `js/sections.js` (`PHOTO_JM`, `PHOTO_JL`)
y se muestran en un círculo. Si una foto no carga, se ven las iniciales. Los
perfiles de LinkedIn van en `LINKEDIN_JM` / `LINKEDIN_JL` (vacío = sin ícono).

## Ver los cambios localmente

```bash
npx serve integrolabs-landing
```

y abrir la URL que indique la terminal.

## Desplegar

Sitio 100 % estático: Netlify, Vercel o GitHub Pages, sin variables de entorno.

## Formulario de calificación

No envía datos a ningún servidor: arma un mensaje de WhatsApp con las
respuestas y abre `https://wa.me/...`. El número vive en la constante
`WHATSAPP_NUMBER` al inicio de `js/main.js`.

## Sistema de diseño

Colores, tipografía y espaciados están como variables CSS en `:root`
(`css/styles.css`). El acento de marca es `--color-accent`; el tema claro lo
redefine en `html[data-theme="light"]`. Los botones son redondos (`999px`).
