# Reveniu · Prueba del alta

Prototipo en código del flujo **1 · Onboarding y personalización** de Reveniu, para pruebas con usuarios. Mide cuánto se demora cada persona en cada pregunta.

## Cómo se usa

1. Abre el prototipo publicado (GitHub Pages) o córrelo localmente (abajo).
2. En la primera pantalla escribe un código para la persona (ej: `P01`) y pulsa **Comenzar prueba**.
3. La persona hace el registro, verifica su correo (el código llega como notificación en pantalla) y responde el alta.
4. Al terminar, entra a **Ver resultados** (o agrega `#moderador` a la URL) para ver el tiempo total, el tiempo por pregunta, las veces que volvió atrás, si abrió «¿Dudas?», y descargar todo en CSV o JSON.

Los resultados se guardan en el navegador donde se hizo la prueba. Descárgalos antes de borrar el historial.

## Qué incluye

- Registro, código de verificación y bienvenida.
- Las 11 preguntas del alta en tres etapas (Tu empresa, Tu cobro, Tu realidad), con campos donde se puede escribir de verdad, validaciones, «Otro» con su campo de texto y el tope de 3 en «¿Qué te complica?».
- Desvíos: «Otro país» → aviso, «Solo redes sociales» / «No tengo ninguno», «Revisar y corregir» lo leído del sitio.
- «¿Dudas?»: asistente con preguntas frecuentes y agenda de videollamada (simulada, como sería con Calendly).
- «Guardar y salir» → pantalla para retomar donde quedó.
- Carga animada de la ficha, ficha de la empresa armada con las respuestas (se puede editar cada dato) y pantalla de celebración.

## Correr localmente

```bash
npm install
npm run dev
```

## Publicar

Cada push a `main` publica en GitHub Pages con la acción `.github/workflows/pages.yml`. La primera vez hay que activar Pages en **Settings → Pages → Source: GitHub Actions**.
