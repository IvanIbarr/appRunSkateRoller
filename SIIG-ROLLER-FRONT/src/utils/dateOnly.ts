export type YMD = `${number}-${number}-${number}`;

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function ddmmyyyyToYmd(input: string): YMD | null {
  const trimmed = (input || '').trim();
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (!yyyy || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  return `${yyyy}-${pad2(mm)}-${pad2(dd)}` as YMD;
}

export function dateToYmdLocal(date: Date): YMD {
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  return `${yyyy}-${mm}-${dd}` as YMD;
}

export function eventoFechaToYmd(fecha: string | Date): YMD | null {
  if (!fecha) return null;
  if (fecha instanceof Date) return dateToYmdLocal(fecha);
  const trimmed = fecha.trim();
  // Si viene como ISO con hora, tomar solo la parte de fecha.
  const isoMatch = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (isoMatch) return isoMatch[1] as YMD;
  // Si viene como DD/MM/YYYY (inputs), convertir.
  return ddmmyyyyToYmd(trimmed);
}

export function ymdToLocalDate(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((ymd || '').trim());
  if (!m) return null;
  const yyyy = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  if (!yyyy || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  // Importante: construimos Date local (sin parsear string ISO) para evitar desfase.
  return new Date(yyyy, mm - 1, dd);
}

