# Configuración de Cedro Alto

## Configuración local completa

### 1. Crear Neon y preparar la base de datos

1. Entra en [Neon Console](https://console.neon.tech/) y crea una cuenta o inicia sesión.
2. Pulsa **New Project**, ponle un nombre (por ejemplo, `cedroalto`) y selecciona la región más cercana a tus usuarios. Neon crea una base de datos y un usuario para el proyecto.
3. En la vista del proyecto pulsa **Connect**. Selecciona la rama y la base de datos creadas, activa **Pooled connection** y copia la cadena de conexión. Debe ser una URL PostgreSQL y usar SSL (`sslmode=require`). Trátala como contraseña: no la compartas ni la publiques.
4. Abre el **SQL Editor** del proyecto Neon. En el repositorio abre `db/migrations/0001_reservation_holds.sql`, copia todo su contenido y ejecútalo. Después repite con `db/migrations/0002_admin_content.sql`, en ese orden. Espera a que cada migración termine correctamente antes de ejecutar la siguiente. No es necesario crear las tablas manualmente.

La primera migración conserva las fechas reservadas que existieran en la tabla anterior. Las solicitudes web bloquean cada noche del rango y permanecen pendientes hasta que el administrador las confirme o cancele desde el panel. La base de datos impide solapamientos simultáneos.

### 2. Configurar variables locales

1. En la raíz del proyecto, crea un archivo llamado `.env.local` (está excluido de Git) con este formato:

   ```dotenv
   DATABASE_URL=pega_aqui_la_url_de_Neon
   ADMIN_USERNAME=elige_un_usuario
   ADMIN_PASSWORD=elige_una_contrasena_larga_y_unica
   ADMIN_SESSION_SECRET=pega_aqui_un_secreto_aleatorio
   BLOB_READ_WRITE_TOKEN=
   ```

2. Genera un secreto para la sesión del administrador desde PowerShell, en una terminal con Node.js instalado:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Copia el resultado en `ADMIN_SESSION_SECRET`. Debe tener al menos 32 caracteres. No uses esa cadena generada como contraseña de administrador.
3. Guarda `.env.local` y reinicia el servidor local (`Ctrl+C` y luego `npm run dev`, o `pnpm dev`). Next.js solo lee estas variables al iniciar.

### 3. Probar reservas y panel de administración

1. Abre `http://localhost:3000`. La disponibilidad se consulta en `http://localhost:3000/api/reservations`; una respuesta `200` con `{ "dates": [] }` significa que la API está conectada y no hay fechas ocupadas.
2. Prueba un rango desde **Tarifas y disponibilidad** y envía la solicitud. La página debe crear la reserva pendiente en Neon y abrir WhatsApp con sus detalles.
3. Abre `http://localhost:3000/admin` e inicia sesión con `ADMIN_USERNAME` y `ADMIN_PASSWORD`. Desde el panel puedes confirmar o cancelar solicitudes y modificar el contenido del sitio. La sesión se guarda en una cookie HTTP-only firmada y dura 8 horas.

### 4. Reseñas de huéspedes

Las cinco reseñas compartidas se sirven desde `lib/reviews.ts`, una por una, sin llamadas a Google ni credenciales de API. El enlace **Ver más opiniones en Google** abre el perfil compartido. Para añadir o corregir una reseña, actualiza allí el nombre, texto, calificación y antigüedad; publica solo opiniones autorizadas.

### 5. Publicar en producción (Vercel)

1. Asegúrate de que el proyecto compila localmente con `npm run build`.
2. Sube el código a un repositorio privado de GitHub. No incluyas `.env.local`; confirma que Git no lo esté siguiendo antes de hacer push.
3. En [Vercel](https://vercel.com/), elige **Add New → Project**, importa el repositorio `andBuiDev/cedroalto` y deja que Vercel detecte Next.js. Usa el comando de build predeterminado (`npm run build`).
4. Antes de desplegar, abre **Project → Settings → Environment Variables** y crea estas variables para **Production** (y también **Preview** si usarás los despliegues de prueba):
   - `DATABASE_URL`: cadena de Neon de producción con SSL.
   - `ADMIN_USERNAME`: el usuario elegido para el panel.
   - `ADMIN_PASSWORD`: la contraseña fuerte del panel.
   - `ADMIN_SESSION_SECRET`: secreto aleatorio de al menos 32 caracteres, distinto de la contraseña.
   - `BLOB_READ_WRITE_TOKEN`: solo si se cargarán imágenes desde el panel.
5. Comprueba que ejecutaste las dos migraciones SQL en la base de datos de Neon que corresponde a esa `DATABASE_URL`. No vuelvas a ejecutarlas sobre una base que ya fue migrada.
6. Pulsa **Deploy**. Cuando termine, abre la URL `*.vercel.app` asignada al proyecto.
7. Verifica `https://TU-DOMINIO/api/reservations`: debe responder `200` y JSON con `dates`. Abre `https://TU-DOMINIO/admin`, inicia sesión y confirma que el panel carga las reservas. Haz una solicitud de prueba con fechas cercanas; cancélala después desde admin si no es una reserva real.
8. Cada cambio posterior se publica haciendo `git push` a la rama conectada. Vercel construye un nuevo despliegue; si cambias variables de entorno, también debes redeplegar.

Las reseñas mostradas por el sitio son estáticas y no requieren variables de Google. Si el inicio de sesión o la API de disponibilidad falla, revisa en **Vercel → Deployments → Functions/Logs** que las variables estén presentes en el entorno Production y que la base de datos haya recibido las migraciones.

## Acceso de administración

El acceso requiere `ADMIN_USERNAME`, `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` configurados como se indica arriba. Hay una sola cuenta de administración; para cambiar sus credenciales, actualiza las variables y reinicia o redespliega la aplicación. El panel permite editar textos, contacto y ubicación, planes, galería, comodidades, desayunos y políticas; también permite confirmar/cancelar reservas y administrar bloqueos manuales.

Hay una sola cuenta de administración configurada por variables de entorno; para cambiar sus credenciales se actualizan las variables y se reinicia o redespliega la aplicación. El panel no guarda nombres, correos ni teléfonos de los clientes; WhatsApp recibe los detalles y la página guarda solo plan, fechas y estado de la reserva.

Las páginas incluyen una política de seguridad de contenido con nonce por solicitud, protección contra framing, MIME sniffing y políticas restrictivas para navegador. En producción se activa HSTS. La compilación también valida los tipos de TypeScript.

## Carga de imágenes con Vercel Blob

1. Crea un almacén **Vercel Blob** y conecta el proyecto.
2. Asegúrate de que `BLOB_READ_WRITE_TOKEN` esté disponible en el entorno local y de despliegue.
3. En el panel, selecciona JPG, PNG, WebP o AVIF de hasta 5 MB. Las imágenes se almacenan como archivos públicos en Blob; guarda los cambios del sitio para publicar sus URL.

## Reseñas

Las reseñas que se muestran localmente y el enlace para abrir más opiniones en Google están definidos en `lib/reviews.ts`. No requieren claves ni llamadas facturables a Google.

Consulta `.env.example` para la lista de variables.
