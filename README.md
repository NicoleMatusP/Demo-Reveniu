# Reveniu · Prueba del alta y la validación

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
