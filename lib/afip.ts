import Afip from '@afipsdk/afip.js';
import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let afipInstance: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAfip(): any {
  if (afipInstance) return afipInstance;

  try {
    const cert = process.env.CERT
      ? Buffer.from(process.env.CERT, 'base64').toString('utf8')
      : fs.readFileSync(path.join(process.cwd(), 'public', 'certs', 'FacturAR-desarrollo.crt'), 'utf8');

    const key = process.env.KEY
      ? Buffer.from(process.env.KEY, 'base64').toString('utf8')
      : fs.readFileSync(path.join(process.cwd(), 'public', 'certs', 'FacturAR-desarrollo.key'), 'utf8');

    afipInstance = new Afip({
      cert,
      key,
      CUIT: parseInt(process.env.CUIT || '0'),
      production: process.env.PRODUCTION === 'true',
      access_token: process.env.AFIP_TOKEN || '',
      // @ts-expect-error type definitions for afip.js are usually missing this property
      res_folder: '/tmp',
    });

    return afipInstance;
  } catch (err) {
    console.error('Error inicializando AFIP SDK:', err);
    throw new Error('No se pudo conectar con AFIP — verificá las credenciales.');
  }
}

export function formatearFecha(fecha: string | undefined | null): string | undefined {
  if (!fecha) return undefined;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) return fecha;
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }
  return fecha;
}
