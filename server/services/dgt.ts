/**
 * Servicio para calcular etiquetas ambientales DGT
 * Basado en las normativas de la Dirección General de Tráfico de España
 * 
 * Etiquetas:
 * - CERO EMISIONES (Azul): Eléctricos puros (BEV) e híbridos enchufables con autonomía >40km
 * - ECO (Verde/Azul): Híbridos no enchufables, GNC, GLP
 * - C (Verde): Gasolina Euro 4/5/6 (desde 2006), Diésel Euro 6 (desde 2014)
 * - B (Amarilla): Gasolina Euro 3 (2001-2005), Diésel Euro 4/5 (2006-2013)
 * - SIN DISTINTIVO: Resto (más contaminantes)
 */

export type EtiquetaDGT = 'CERO' | 'ECO' | 'C' | 'B' | 'SIN_DISTINTIVO';

interface VehicleData {
  año?: number | null;
  combustible?: string | null;
  // Campos opcionales para mayor precisión
  normaEuro?: string | null;
  hibridoEnchufable?: boolean;
  autonomiaElectrica?: number; // km
}

export class DGTService {
  /**
   * Calcula la etiqueta ambiental DGT de un vehículo
   */
  static calcularEtiqueta(vehiculo: VehicleData): EtiquetaDGT {
    const { año, combustible } = vehiculo;

    // Si no hay datos suficientes, no se puede determinar
    if (!año || !combustible) {
      return 'SIN_DISTINTIVO';
    }

    const combustibleNorm = combustible.toLowerCase().trim();

    // CERO EMISIONES: Eléctricos puros
    if (this.isElectricoPuro(combustibleNorm)) {
      return 'CERO';
    }

    // CERO EMISIONES: Híbridos enchufables con autonomía >40km
    if (vehiculo.hibridoEnchufable && vehiculo.autonomiaElectrica && vehiculo.autonomiaElectrica > 40) {
      return 'CERO';
    }

    // ECO: Híbridos enchufables con autonomía ≤40km
    if (vehiculo.hibridoEnchufable) {
      return 'ECO';
    }

    // ECO: Híbridos no enchufables
    if (this.isHibrido(combustibleNorm)) {
      return 'ECO';
    }

    // ECO: GNC (Gas Natural Comprimido) o GLP (Gas Licuado del Petróleo)
    if (this.isGNC_GLP(combustibleNorm)) {
      return 'ECO';
    }

    // GASOLINA
    if (this.isGasolina(combustibleNorm)) {
      if (año >= 2006) {
        return 'C'; // Euro 4/5/6
      } else if (año >= 2001) {
        return 'B'; // Euro 3
      } else {
        return 'SIN_DISTINTIVO'; // Euro 0/1/2
      }
    }

    // DIÉSEL
    if (this.isDiesel(combustibleNorm)) {
      if (año >= 2014) {
        return 'C'; // Euro 6
      } else if (año >= 2006) {
        return 'B'; // Euro 4/5
      } else {
        return 'SIN_DISTINTIVO'; // Euro 0/1/2/3
      }
    }

    // Por defecto: sin distintivo
    return 'SIN_DISTINTIVO';
  }

  /**
   * Retorna información descriptiva de la etiqueta
   */
  static getEtiquetaInfo(etiqueta: EtiquetaDGT): {
    nombre: string;
    color: string;
    descripcion: string;
  } {
    switch (etiqueta) {
      case 'CERO':
        return {
          nombre: 'CERO EMISIONES',
          color: 'blue',
          descripcion: 'Vehículo eléctrico puro o híbrido enchufable con autonomía >40km',
        };
      case 'ECO':
        return {
          nombre: 'ECO',
          color: 'eco', // Verde/azul distintivo dual
          descripcion: 'Vehículo híbrido, GNC o GLP',
        };
      case 'C':
        return {
          nombre: 'C',
          color: 'green', // Solo verde
          descripcion: 'Gasolina desde 2006 o diésel desde 2014',
        };
      case 'B':
        return {
          nombre: 'B',
          color: 'yellow',
          descripcion: 'Gasolina 2001-2005 o diésel 2006-2013',
        };
      case 'SIN_DISTINTIVO':
      default:
        return {
          nombre: 'SIN DISTINTIVO',
          color: 'gray',
          descripcion: 'Vehículo sin etiqueta ambiental',
        };
    }
  }

  // Helpers para detectar tipo de combustible
  private static isElectricoPuro(combustible: string): boolean {
    return combustible.includes('eléctrico') || 
           combustible.includes('electrico') ||
           combustible === 'bev' ||
           combustible === 'ev';
  }

  private static isHibrido(combustible: string): boolean {
    return combustible.includes('híbrido') || 
           combustible.includes('hibrido') ||
           combustible.includes('hybrid') ||
           combustible.includes('hev') ||
           combustible.includes('phev');
  }

  private static isGNC_GLP(combustible: string): boolean {
    return combustible.includes('gnc') || 
           combustible.includes('glp') ||
           combustible.includes('gas natural') ||
           combustible.includes('gas licuado');
  }

  private static isGasolina(combustible: string): boolean {
    return combustible.includes('gasolina') ||
           combustible.includes('gasoline') ||
           combustible.includes('petrol');
  }

  private static isDiesel(combustible: string): boolean {
    return combustible.includes('diésel') ||
           combustible.includes('diesel') ||
           combustible.includes('gasoil') ||
           combustible.includes('gasóleo');
  }
}
