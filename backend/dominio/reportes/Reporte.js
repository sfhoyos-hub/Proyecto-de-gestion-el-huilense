// Reporte: resultado de una consulta de gestión, con sus filas y totales.
class Reporte {
    constructor({ titulo, filtros = {}, filas = [], totales = [] }) {
        this.titulo = titulo;
        this.filtros = filtros;
        this.filas = filas;
        this.camposTotales = totales;
        this.generadoEn = new Date().toISOString();
    }

    total(campo) {
        return this.filas.reduce((suma, fila) => suma + Number(fila[campo] || 0), 0);
    }

    toJSON() {
        return {
            titulo: this.titulo,
            filtros: this.filtros,
            generado_en: this.generadoEn,
            cantidad: this.filas.length,
            totales: Object.fromEntries(
                this.camposTotales.map((campo) => [campo, this.total(campo)])
            ),
            filas: this.filas
        };
    }
}

module.exports = Reporte;
