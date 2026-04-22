/**
 * Consulta código postal en México vía Zippopotam (sin API key).
 * Los datos no siempre incluyen municipio separado; el usuario puede corregirlos.
 */
export type PostalLookupResult = {
  estado: string;
  municipio: string;
  localidad: string;
  colonias: string[];
};

export async function lookupMexicanPostalCode(
  cp: string,
): Promise<PostalLookupResult | null> {
  const digits = cp.replace(/\D/g, '').slice(0, 5);
  if (digits.length !== 5) {
    return null;
  }
  try {
    const res = await fetch(`https://api.zippopotam.us/mx/${digits}`);
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as {
      places?: Array<{
        'place name'?: string;
        state?: string;
        latitude?: string;
        longitude?: string;
      }>;
    };
    const places = data.places || [];
    if (places.length === 0) {
      return null;
    }
    const colonias = [
      ...new Set(
        places
          .map((p) => (p['place name'] || '').trim())
          .filter(Boolean),
      ),
    ];
    const estado = (places[0].state || '').trim();
    const firstCol = colonias[0] || '';
    return {
      estado,
      municipio: firstCol,
      localidad: firstCol,
      colonias,
    };
  } catch {
    return null;
  }
}
