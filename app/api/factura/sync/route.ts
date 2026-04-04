import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAfip } from '@/lib/afip';

export async function POST(req: NextRequest) {
  try {
    const { user_id, puntoVenta = 2, tipoComprobante = 11 } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: 'Falta user_id' }, { status: 400 });
    }

    // 1. Obtener el último número emitido en AFIP
    const ultimoAfip = await getAfip().ElectronicBilling.getLastVoucher(puntoVenta, tipoComprobante);
    
    if (ultimoAfip === 0) {
      return NextResponse.json({ ok: true, message: 'No hay facturas en AFIP para sincronizar.', count: 0 });
    }

    // 2. Obtener la última factura de este usuario en Supabase (para saber hasta dónde retroceder)
    const { data: facturasLocales } = await supabase
      .from('facturas')
      .select('numero')
      .eq('user_id', user_id)
      .eq('punto_venta', puntoVenta)
      .order('numero', { ascending: false });

    // Armamos un Set para no duplicar si AFIP nos trae algo que ya tenemos
    const numerosLocales = new Set(facturasLocales?.map(f => f.numero) || []);

    const facturasAAgregar = [];
    
    // 3. Loop desde el ultimoAfip hacia atrás. 
    // Para no hacer un loop infinito y volar la RAM/Servidor, limitamos a buscar como máximo las últimas 50 facturas.
    const maxIteraciones = 50; 
    let iteracion = 0;

    for (let numero = ultimoAfip; numero > 0; numero--) {
      if (iteracion >= maxIteraciones) break;
      
      // Si ya la tenemos en Supabase, pasamos a la anterior 
      // (Opcional: Si asumimos que todas las facturas anteriores existen, podríamos hacer un break directamente aquí.
      // Pero iteramos por las dudas haya gaps de BD vacíos).
      if (numerosLocales.has(numero)) {
         continue; 
      }

      iteracion++;

      try {
        // Pedimos info técnica de la factura vieja
        const vInfo = await getAfip().ElectronicBilling.getVoucherInfo(numero, puntoVenta, tipoComprobante);
        if (!vInfo) continue;

        // Formatear Fecha (Viene como 'YYYYMMDD') -> 'YYYY-MM-DD'
        const rawFch = String(vInfo.CbteFch);
        const fechaEmision = rawFch.length === 8 
          ? `${rawFch.slice(0, 4)}-${rawFch.slice(4, 6)}-${rawFch.slice(6, 8)}` 
          : new Date().toISOString().slice(0, 10);
        
        let clienteNombre = 'Consumidor Final';
        
        // Si no es consumidor final (ej. si DOC tipo es CUIT=80 y doc distinto de cero)
        if (vInfo.DocTipo === 80 && vInfo.DocNro && vInfo.DocNro !== 0) {
           try {
             // Tratamos de adivinar el nombre usando Padrón Alcance 13
             const persona = await getAfip().RegisterScopeThirteen.getTaxpayerDetails(vInfo.DocNro);
             if (persona && persona.razonSocial) {
                clienteNombre = persona.razonSocial;
             } else if (persona?.apellido && persona?.nombre) {
                clienteNombre = `${persona.apellido} ${persona.nombre}`;
             } else {
                clienteNombre = `CUIT ${vInfo.DocNro}`;
             }
           } catch (e) {
             console.log('No se pudo encontrar CUIT histórico', vInfo.DocNro);
             clienteNombre = `CUIT ${vInfo.DocNro}`;
           }
        }

        facturasAAgregar.push({
          user_id,
          cliente_nombre: clienteNombre,
          numero: numero,
          punto_venta: puntoVenta,
          tipo: 'Factura C',
          concepto: 'Productos y servicios', // Genérico, ya que AFIP no devuelve la cadena de concepto
          descripcion: 'Sincronizado vía AFIP',
          monto: vInfo.ImpTotal,
          fecha_emision: fechaEmision,
          periodo_desde: null,
          periodo_hasta: null,
          cae: vInfo.CodAutorizacion,
          cae_vencimiento: null, // Podríamos formatear vInfo.FchVto, pero lo ignoramos para display simple
          estado: 'emitida'
        });

      } catch (err) {
        console.error(`Error trayendo comprobante ${numero} de AFIP:`, err);
        // Continuamos buscando las demás a pesar del error
      }
    }

    if (facturasAAgregar.length > 0) {
      const { error } = await supabase.from('facturas').insert(facturasAAgregar);
      if (error) {
         throw error;
      }
    }

    return NextResponse.json({ 
      ok: true, 
      syncedCount: facturasAAgregar.length,
      message: `Se sincronizaron ${facturasAAgregar.length} facturas anteriores de AFIP.` 
    });

  } catch (err: any) {
    console.error('Error sincronizando facturas:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
