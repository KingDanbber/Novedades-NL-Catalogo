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
  - `products` → `id`, `category_id`, `name`, `brand`, `model`, `description`, `stock`, `sale_price`, `image_url`, `created_at`, `tags`, `units_per_package`
- Se consulta la **REST API** con `fetch` y la clave publishable/anon.
- Solo se muestran productos con `stock > 0`.
- Precio público: `sale_price`.
- Imagen: `image_url` (URLs de Cloudinary ya guardadas).

Si no hay productos en la base, se muestra un estado vacío amigable. Al agregar productos desde tu sistema de administración aparecerán automáticamente.

### Cloudinary

Las imágenes ya están alojadas en Cloudinary (`cloud name: dzh0gjzet`). El catálogo solo muestra las URLs que vienen en `products.image_url`. No sube ni modifica imágenes.

### WhatsApp

Al finalizar la compra el cliente llena:
- Nombre
- Área / Colonia
- Vendedor (Luis Arturo o Norma Padilla)

El botón **“Continuar compra por WhatsApp”** abre el chat del vendedor seleccionado con el mensaje del pedido prellenado (incluye paquetes si aplica).

## Características

- Diseño único moderno (sin tema oscuro/toggle).
- 100 % responsive, mobile-first.
- Animaciones sutiles (entrada, hover, carrito, modales).
- Filtro por categorías + filtro por etiquetas (`tags`) + búsqueda por nombre.
- Muestra “Paquete de X unidades” cuando `units_per_package > 1`.
- Detalle de producto en modal.
- Carrito con persistencia en `localStorage` y datos del cliente.
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
