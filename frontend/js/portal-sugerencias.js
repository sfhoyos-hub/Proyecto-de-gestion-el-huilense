/* ==========================================================================
   El Huilense · Portal público de sugerencias (portal-sugerencias.js)
   No requiere sesión.
   ========================================================================== */
(function () {
  'use strict';

  const { peticion, Alertas } = window.Huilense;

  const formulario = document.getElementById('form-sugerencia');
  const campo = document.getElementById('contenido');
  const contador = document.getElementById('contador');
  const boton = document.getElementById('btn-enviar');

  campo.addEventListener('input', () => {
    contador.textContent = `${campo.value.length} / 1000`;
  });

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const contenido = campo.value.trim();

    if (contenido.length < 5) {
      Alertas.advertencia('Escribe al menos 5 caracteres.');
      return;
    }

    boton.disabled = true;
    try {
      const respuesta = await peticion('/sugerencias', {
        metodo: 'POST', cuerpo: { contenido }, autenticada: false
      });
      formulario.reset();
      contador.textContent = '0 / 1000';
      Alertas.exito(respuesta.mensaje);
    } catch (error) {
      Alertas.deError(error);
    } finally {
      boton.disabled = false;
    }
  });
})();
