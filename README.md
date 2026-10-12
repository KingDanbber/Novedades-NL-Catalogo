# Novedades N&L — Catálogo Digital

Catálogo web mobile-first para el emprendimiento **Novedades N&L**. Los clientes exploran productos, agregan al carrito y continúan la compra por el grupo de WhatsApp.

## Cómo abrir

1. Descomprime el ZIP.
2. Abre `index.html` en el navegador (doble clic o arrastra al navegador).
3. O sirve la carpeta con cualquier servidor estático local:

```bash
# Ejemplo con Python
python -m http.server 8080
# Luego visita http://localhost:8080
```

No requiere build ni instalación de dependencias.

## Conexión a datos

### Supabase (productos y categorías)

- **URL**: `https://wehscgjwcarditwoymut.supabase.co`
- **Tablas usadas**:
  - `categories` → `id`, `name`
  - `products` → `id`, `category_id`, `name`, `brand`, `model`, `description`, `stock`, `sale_price`, `image_url`, `created_at`
- Se consulta la **REST API** con `fetch` y la clave publishable/anon.
- Solo se muestran productos con `stock > 0`.
- Precio público: `sale_price`.
- Imagen: `image_url` (URLs de Cloudinary ya guardadas).

Si no hay productos en la base, se muestra un estado vacío amigable. Al agregar productos desde tu sistema de administración aparecerán automáticamente.

### Cloudinary

Las imágenes ya están alojadas en Cloudinary (`cloud name: dzh0gjzet`). El catálogo solo muestra las URLs que vienen en `products.image_url`. No sube ni modifica imágenes.

### WhatsApp

Botón **“Continuar compra por WhatsApp”**:

1. Copia al portapapeles un resumen del pedido (productos, cantidades y total).
2. Abre el grupo:  
   `https://chat.whatsapp.com/FoCLYnqe8ux5YZIjE0BXWK?s=cl&p=a&mlu=4&ilr=4`

El administrador del grupo ve el pedido de un vistazo al pegar el mensaje.

## Características

- Diseño único moderno (sin tema oscuro/toggle).
- 100 % responsive, mobile-first.
- Animaciones sutiles (entrada, hover, carrito, modales).
- Filtro por categorías + búsqueda por nombre.
- Detalle de producto en modal.
- Carrito con persistencia en `localStorage`.
- Skeleton loading y estados de error / vacío.
- Badge “Nuevo” en productos recientes (≤ 14 días).

## Estructura de archivos

```
novedades-nl/
├── index.html
├── css/
│   ├── main.css        # Design system, variables, reset, animaciones
│   ├── layout.css      # Header, hero, grid, footer, drawers
│   ├── components.css  # Cards, botones, carrito, modal
│   └── utilities.css
├── js/
│   ├── main.js         # Entrada y lógica de UI
│   └── modules/
│       ├── supabase.js # Cliente REST Supabase
│       ├── cart.js     # Carrito + localStorage
│       └── ui.js       # Toasts, modales, iconos SVG
└── README.md
```

## Notas

- La clave usada es la **publishable/anon** pública. Asegúrate de que las políticas RLS de Supabase permitan lectura pública de `categories` y `products` (o al menos de las filas con stock).
- Si en el futuro necesitas la JWT anon clásica, se puede sustituir en `js/modules/supabase.js`.
