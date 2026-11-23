// Integración Nequi «Adapter».
// Adapta el puerto IPasarelaPago (lo que espera el negocio) a la API REST de
// Nequi (lo que ofrece el sistema externo): traduce DatosNequi al cuerpo de
// la petición HTTPS y la respuesta de Nequi a { exito, referencia, mensaje }.
//
// Sin NEQUI_API_URL configurada trabaja en modo simulado para poder usar el
// sistema sin credenciales (el celular 3000000000 simula un rechazo).
// shortcut: el cuerpo y los códigos de respuesta siguen la estructura general
// de la API de Nequi; ajustarlos al contrato oficial al obtener credenciales.
const crypto = require('crypto');
const IPasarelaPago = require('../../dominio/puertos/IPasarelaPago');

const CELULAR_RECHAZO_SIMULADO = '3000000000';
const CODIGO_EXITO = '0';
const TIMEOUT_MS = 15000;

class NequiAdapter extends IPasarelaPago {
    constructor({ urlApi = null, apiKey = null, clientId = null, http = globalThis.fetch } = {}) {
        super();
        this.urlApi = urlApi;
        this.apiKey = apiKey;
        this.clientId = clientId;
        this.http = http;
    }

    static desdeEntorno(env) {
        return new NequiAdapter({
            urlApi: env.NEQUI_API_URL || null,
            apiKey: env.NEQUI_API_KEY || null,
            clientId: env.NEQUI_CLIENT_ID || null
        });
    }

    get simulado() {
        return !this.urlApi;
    }

    async procesarPago(datosNequi) {
        if (this.simulado) {
            return this.simular(datosNequi);
        }

        try {
            const respuesta = await this.http(this.urlApi, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey },
                body: JSON.stringify(this.aPeticionNequi(datosNequi)),
                signal: AbortSignal.timeout(TIMEOUT_MS)
            });

            return this.desdeRespuestaNequi(await respuesta.json());
        } catch (error) {
            console.error('Error al comunicarse con Nequi:', error.message);
            return { exito: false, mensaje: 'No se pudo comunicar con Nequi' };
        }
    }

    // DatosNequi (dominio) -> formato de la API de Nequi.
    aPeticionNequi(datos) {
        return {
            RequestMessage: {
                RequestHeader: {
                    Channel: 'PNP04-C001',
                    RequestDate: new Date().toISOString(),
                    MessageID: crypto.randomUUID().replace(/-/g, '').slice(0, 10),
                    ClientID: this.clientId,
                    Destination: {
                        ServiceName: 'PaymentsService',
                        ServiceOperation: 'unregisteredPayment',
                        ServiceRegion: 'C001',
                        ServiceVersion: '1.2.0'
                    }
                },
                RequestBody: {
                    any: {
                        unregisteredPaymentRQ: {
                            phoneNumber: datos.numeroCelular,
                            value: String(datos.monto),
                            reference1: datos.referencia,
                            reference2: datos.descripcion
                        }
                    }
                }
            }
        };
    }

    // Respuesta de Nequi -> resultado del puerto.
    desdeRespuestaNequi(cuerpo) {
        const estado = cuerpo?.ResponseMessage?.ResponseHeader?.Status || {};
        const exito = String(estado.StatusCode) === CODIGO_EXITO;
        const transaccion = cuerpo?.ResponseMessage?.ResponseBody?.any
            ?.unregisteredPaymentRS?.transactionId;

        return exito
            ? { exito: true, referencia: transaccion || null }
            : { exito: false, mensaje: estado.StatusDesc || 'Nequi rechazó el pago' };
    }

    simular(datos) {
        if (datos.numeroCelular === CELULAR_RECHAZO_SIMULADO) {
            return { exito: false, mensaje: 'Pago rechazado por Nequi (simulado)' };
        }

        return { exito: true, referencia: `SIM-${crypto.randomUUID().slice(0, 8)}` };
    }
}

module.exports = { NequiAdapter };
