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

    const persona = await getAfip().RegisterScopeFour.getTaxpayerDetails(cuit);

    if (!persona) {
      return NextResponse.json({ error: 'CUIT no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      cuit: persona.idPersona,
      razonSocial: persona.razonSocial || `${persona.apellido || ''} ${persona.nombre || ''}`.trim(),
      condicionIva: persona.estadoClave || '',
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
