import { NextRequest, NextResponse } from 'next/server';
import { getAfip, formatearFecha } from '@/lib/afip';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      numero,
      puntoVenta = 2,
      cae,
      caeVencimiento,
      fechaEmision,
      importeTotal,
      clienteNombre,
      clienteCuit,
      clienteCondicionIva = 'Consumidor Final',
      concepto = 2,
      descripcion,
      formaPago = 'Contado',
      periodoDesde,
      periodoHasta,
      fechaVtoPago,
    } = body;

    const data = {
      file_name: `factura_c_${puntoVenta}_${numero}.pdf`,
      template: {
        name: 'invoice-c',
        params: {
          voucher_number: numero,
          sales_point: puntoVenta,
          issue_date: formatearFecha(fechaEmision),
          cae_due_date: formatearFecha(caeVencimiento),
          issuer_cuit: parseInt(process.env.CUIT || '0'),
          cae: parseInt(cae),
          issuer_business_name: process.env.NOMBRE_EMISOR || 'Emisor',
          issuer_address: process.env.DIRECCION_EMISOR || '-',
          issuer_iva_condition: 'Monotributista',
          issuer_gross_income: process.env.INGRESOS_BRUTOS || '-',
          issuer_activity_start_date: process.env.FECHA_INICIO_ACTIVIDAD || '01/01/2020',
          receiver_name: clienteNombre || 'CONSUMIDOR FINAL',
          receiver_address: '-',
          receiver_document_type: clienteCuit ? 80 : 99,
          receiver_document_number: clienteCuit ? parseInt(String(clienteCuit).replace(/-/g, '')) : 0,
          receiver_iva_condition: clienteCondicionIva,
          sale_condition: formaPago,
          currency_id: 'ARS',
          currency_rate: 1,
          concept: concepto,
          items: [{
            code: '001',
            description: descripcion || 'Servicio profesional',
            quantity: 1,
            unit_price: parseFloat(importeTotal),
            subtotal: parseFloat(importeTotal),
          }],
          vat_amount: 0,
          tributes_amount: 0,
          total_amount: parseFloat(importeTotal),
          net_amount_taxed: 0,
          net_amount_untaxed: parseFloat(importeTotal),
          exempt_amount: 0,
          ...(concepto === 2 || concepto === 3 ? {
            billing_from: formatearFecha(periodoDesde),
            billing_to: formatearFecha(periodoHasta),
            payment_due_date: formatearFecha(fechaVtoPago || periodoHasta),
          } : {}),
        },
      },
    };

    const pdfResponse = await getAfip().ElectronicBilling.createPDF(data);
    return NextResponse.json({ ok: true, pdf: pdfResponse });
  } catch (err: any) {
    console.error('Error PDF:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
