import { NextRequest, NextResponse } from 'next/server';
import { getAfip } from '@/lib/afip';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const puntoVenta = parseInt(searchParams.get('puntoVenta') || '2');
    const tipoComprobante = parseInt(searchParams.get('tipoComprobante') || '11');
    const ultimo = await getAfip().ElectronicBilling.getLastVoucher(puntoVenta, tipoComprobante);
    return NextResponse.json({ ultimoNumero: ultimo });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
