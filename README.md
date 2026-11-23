# Reveniu · Pruebas con usuarios

Al abrir el link aparece un **menú con los 3 flujos**. Cada uno es una prueba aparte, con su propio tiempo:

- **1 · Onboarding y personalización** (`#alta`): del registro a la cuenta lista; al final puede seguir con la validación.
- **2 · Verificación de empresa** (`#validacion`): parte con una cuenta ya creada y va del SII a la empresa aprobada.
- **3 · Productos y planes** (`#planes`): crear un plan, publicar su link con UTM y archivar en el catálogo.

En **Ver resultados** (`#moderador`) se elige el flujo arriba y se descargan sus tiempos por separado.

## Prueba 2 · Productos y planes (`#planes`)

1. Abre el prototipo con `#planes` al final (o desde el enlace de la primera pantalla) y escribe el código de la persona.
2. La tarea aparece abajo a la izquierda: crear el plan «Inglés B2 · 2027» (matrícula + 10 cuotas, regla propia para el segmento VIP y link con UTM para Instagram).
3. Después de publicar, la segunda tarea pide archivar «Mensual flexible» y dejar la lista mostrando solo los archivados. Al lograrlo aparece **Terminar**.
4. Se mide en tres partes: **Crear el plan** (del catálogo a «Publicar plan»), **Link y rastreo** (del link a publicado) y **Tareas en el catálogo** (archivar y filtrar).

Incluye: catálogo con filtros, archivados al final y atenuados, menú ⋯ con duplicar, pausar y archivar (con confirmación y «Deshacer»); asistente del plan con plantillas, productos (y crear uno nuevo), cobros, fechas y matrícula (incluido «Que el cliente elija»), qué incluye, descuentos y prueba gratis, permanencia, reglas si un cobro falla (estándar, editar aquí, desde cero o para un segmento), avisos y cancelación; revisión con «Editar» por sección; link editable con UTM y meta tags; celebración al publicar. En **Ver resultados** se elige el flujo arriba y se descargan los tiempos por separado.

---

# Prueba 1 · Alta y validación

Prototipo en código de los flujos **1 · Onboarding y personalización** y **2 · Verificación de empresa** de Reveniu, para pruebas con usuarios. Mide cuánto se demora cada persona en cada pantalla, con el tiempo del alta y el de la validación por separado.

## Cómo se usa

1. Abre el prototipo publicado (GitHub Pages) o córrelo localmente (abajo).
2. En la primera pantalla escribe un código para la persona (ej: `P01`) y pulsa **Comenzar prueba**.
3. La persona hace el registro, verifica su correo (el código llega como notificación en pantalla) y responde el alta.
4. En la pantalla de celebración elige **Validar mi empresa ahora** y sigue la validación hasta ver su empresa aprobada en Inicio. Para el RUT sirve cualquier RUT con dígito verificador correcto, por ejemplo `76.543.210-3`; la clave tributaria puede ser cualquiera.
5. Al terminar, entra a **Ver resultados** (o agrega `#moderador` a la URL) para ver el tiempo del alta, el de la validación, el total, el tiempo por pantalla de cada parte, las veces que volvió atrás, si abrió «¿Dudas?», y descargar todo en CSV o JSON.

Los resultados se guardan en el navegador donde se hizo la prueba. Descárgalos antes de borrar el historial.

## Qué incluye

- Registro, código de verificación y bienvenida.
- Las 11 preguntas del alta en tres etapas (Tu empresa, Tu cobro, Tu realidad), con campos donde se puede escribir de verdad, validaciones, «Otro» con su campo de texto y el tope de 3 en «¿Qué te complica?».
- Desvíos: «Otro país» → aviso, «Solo redes sociales» / «No tengo ninguno», «Revisar y corregir» lo leído del sitio.
- «¿Dudas?»: asistente con preguntas frecuentes y agenda de videollamada (simulada, como sería con Calendly).
- «Guardar y salir» → pantalla para retomar donde quedó.
- Carga animada de la ficha, ficha de la empresa armada con las respuestas (se puede editar cada dato) y pantalla de celebración.
- Validación de empresa: conexión con el SII (RUT con dígito verificador y clave tributaria), lectura animada de documentos, datos encontrados, representante legal (verificación de identidad simulada o invitación a otra persona), cuenta bancaria, revisión y empresa aprobada en Inicio.
- Desvíos de la validación: «Prefiero subir los documentos yo» (subida simulada de los 5 PDF, con un error de archivo ilegible en «Inicio de actividades» para probar «Reintentar») y «Algo no calza: corregir» (no es mi empresa → volver a escribir el RUT; datos que cambiaron → corrección enviada).
- Guías «Ver cómo descargarlos» y «Ver cómo hacerlo»: panel lateral en desktop y hoja desde abajo en mobile, con link a sii.cl.

## Mobile

El prototipo se adapta solo al abrirlo en un celular (o en una ventana de hasta 900 px de ancho), con el mismo diseño que la página «10 · Mobile» de Figma: pantalla completa, botones fijos abajo, una columna, pills a su ancho natural, «¿Dudas?» como botón de ícono, la lista de documentos del SII plegada («Ver cuáles») y las ayudas como hojas que suben desde abajo. Los resultados guardan si la prueba se hizo en Mobile o Desktop (columna `dispositivo`) y el tamaño de la pantalla.

## Cómo se mide

- **Alta:** desde que empieza el registro hasta que la persona deja la pantalla de celebración.
- **Validación:** desde «Conecta tu empresa con el SII» hasta que ve su empresa aprobada en Inicio.
- Si elige «Lo hago después» en la celebración, la prueba termina solo con el tiempo del alta.
- El CSV trae una fila por pantalla con la columna `fase` y los tiempos `alta_segundos`, `validacion_segundos` y `total_segundos`.

## Correr localmente

```bash
npm install
npm run dev
```

## Publicar

Cada push a `main` publica en GitHub Pages con la acción `.github/workflows/pages.yml`. La primera vez hay que activar Pages en **Settings → Pages → Source: GitHub Actions**.
