import { NextRequest, NextResponse } from 'next/server';
import { getAfip } from '@/lib/afip';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cuit: string }> }
) {
  const { cuit: cuitParam } = await params;
  try {
    const cuit = parseInt(cuitParam.replace(/-/g, ''));

    // CUIT mágico de prueba (AFIP Homologación no tiene CUITs cargados)
    if (cuit === 11111111111) {
      return NextResponse.json({
        cuit: '11111111111',
        razonSocial: 'Empresa de Prueba S.A. (MOCK)',
        condicionIva: 'Responsable Inscripto',
        domicilio: 'Av. Siempreviva 742',
      });
    }

    const persona = await getAfip().RegisterScopeThirteen.getTaxpayerDetails(cuit);

    if (!persona) {
      return NextResponse.json({ error: 'CUIT no encontrado' }, { status: 404 });
    }

    let condicionIvaText = 'Consumidor Final';
    if (persona.impuesto) {
      const impuestos = Array.isArray(persona.impuesto) ? persona.impuesto : [persona.impuesto];
      const isMonotributista = impuestos.some((i: any) => i.idImpuesto === 20 || i.idImpuesto === 21);
      const isInscripto = impuestos.some((i: any) => i.idImpuesto === 30);
      const isExento = impuestos.some((i: any) => i.idImpuesto === 32);
      
      if (isMonotributista) condicionIvaText = 'Monotributista';
      else if (isInscripto) condicionIvaText = 'Responsable Inscripto';
      else if (isExento) condicionIvaText = 'IVA Sujeto Exento';
      else condicionIvaText = persona.estadoClave || 'Inscripto';
    } else {
      condicionIvaText = persona.estadoClave || 'Desconocido';
    }

    return NextResponse.json({
      cuit: persona.idPersona,
      razonSocial: persona.razonSocial || `${persona.apellido || ''} ${persona.nombre || ''}`.trim(),
      condicionIva: condicionIvaText,
      domicilio: persona.domicilio?.[0]?.direccion || '',
    });
  } catch (err: any) {
    if (err.message?.includes('500')) {
      return NextResponse.json(
        { error: 'El CUIT no existe o no fue encontrado en los registros de AFIP' },
        { status: 404 }
      );
    }
    const errorDetails = err.response?.data || err.message;
    console.error('Error detallado de AFIP:', errorDetails);
    
    return NextResponse.json({ error: typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails }, { status: err.response?.status || 500 });
  }
}
