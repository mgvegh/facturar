import { NextRequest, NextResponse } from 'next/server';
import { getAfip } from '@/lib/afip';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      puntoVenta = 2,
      tipoComprobante = 11,
      docTipo = 80,
      docNro,
      importeTotal,
      concepto = 2,
      fechaDesde,
      fechaHasta,
      fechaVtoPago,
    } = body;

    const ultimoNro = await getAfip().ElectronicBilling.getLastVoucher(puntoVenta, tipoComprobante);
    const nuevoNro = ultimoNro + 1;

    const hoy = new Date();
    const fechaHoy = parseInt(hoy.toISOString().slice(0, 10).replace(/-/g, ''));
    const esConsumidorFinal = !docNro || docNro === '0';

    const datosFactura: any = {
      CantReg: 1,
      PtoVta: puntoVenta,
      CbteTipo: tipoComprobante,
      Concepto: concepto,
      DocTipo: esConsumidorFinal ? 99 : docTipo,
      DocNro: esConsumidorFinal ? 0 : parseInt(String(docNro).replace(/-/g, '')),
      CbteDesde: nuevoNro,
      CbteHasta: nuevoNro,
      CbteFch: fechaHoy,
      ImpTotal: parseFloat(importeTotal),
      ImpTotConc: 0,
      ImpNeto: parseFloat(importeTotal),
      ImpOpEx: 0,
      ImpIVA: 0,
      ImpTrib: 0,
      MonId: 'PES',
      MonCotiz: 1,
      CondicionIVAReceptorId: 5,
    };

    if (concepto === 2 || concepto === 3) {
      const desde = fechaDesde ? parseInt(String(fechaDesde).replace(/-/g, '')) : fechaHoy;
      const hasta = fechaHasta ? parseInt(String(fechaHasta).replace(/-/g, '')) : fechaHoy;
      const vtoPagoRaw = fechaVtoPago ? parseInt(String(fechaVtoPago).replace(/-/g, '')) : fechaHoy;
      // AFIP exige que FchVtoPago no sea anterior a la fecha del comprobante (error 10036)
      const vtoPago = Math.max(vtoPagoRaw, fechaHoy);
      datosFactura.FchServDesde = desde;
      datosFactura.FchServHasta = hasta;
      datosFactura.FchVtoPago = vtoPago;
    }

    const resultado = await getAfip().ElectronicBilling.createVoucher(datosFactura);

    return NextResponse.json({
      ok: true,
      numero: nuevoNro,
      cae: resultado.CAE,
      vencimientoCAE: resultado.CAEFchVto,
      puntoVenta,
      tipoComprobante,
    });
  } catch (err: any) {
    console.error('Error emitir:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
