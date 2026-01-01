// Estructura jerárquica de ubicaciones de Chile
export interface Location {
  id: string;
  name: string;
  children?: Location[];
}

export const chileLocations: Location[] = [
  {
    id: 'arica-parinacota',
    name: 'Arica y Parinacota',
    children: [
      {
        id: 'arica',
        name: 'Arica',
        children: [
          { id: 'arica-city', name: 'Arica' },
          { id: 'camarones', name: 'Camarones' },
        ],
      },
      {
        id: 'parinacota',
        name: 'Parinacota',
        children: [
          { id: 'putre', name: 'Putre' },
          { id: 'general-lagos', name: 'General Lagos' },
        ],
      },
    ],
  },
  {
    id: 'tarapaca',
    name: 'Tarapacá',
    children: [
      {
        id: 'iquique',
        name: 'Iquique',
        children: [
          { id: 'iquique-city', name: 'Iquique' },
          { id: 'alto-hospicio', name: 'Alto Hospicio' },
        ],
      },
      {
        id: 'tamarugal',
        name: 'Tamarugal',
        children: [
          { id: 'pica', name: 'Pica' },
          { id: 'huara', name: 'Huara' },
        ],
      },
    ],
  },
  {
    id: 'antofagasta',
    name: 'Antofagasta',
    children: [
      {
        id: 'antofagasta-prov',
        name: 'Antofagasta',
        children: [
          { id: 'antofagasta-city', name: 'Antofagasta' },
          { id: 'mejillones', name: 'Mejillones' },
          { id: 'sierra-gorda', name: 'Sierra Gorda' },
        ],
      },
      {
        id: 'el-loa',
        name: 'El Loa',
        children: [
          { id: 'calama', name: 'Calama' },
          { id: 'ollague', name: 'Ollagüe' },
        ],
      },
    ],
  },
  {
    id: 'atacama',
    name: 'Atacama',
    children: [
      {
        id: 'copiapo',
        name: 'Copiapó',
        children: [
          { id: 'copiapo-city', name: 'Copiapó' },
          { id: 'caldera', name: 'Caldera' },
        ],
      },
      {
        id: 'chanaral',
        name: 'Chañaral',
        children: [
          { id: 'chanaral-city', name: 'Chañaral' },
          { id: 'diego-de-almagro', name: 'Diego de Almagro' },
        ],
      },
    ],
  },
  {
    id: 'coquimbo',
    name: 'Coquimbo',
    children: [
      {
        id: 'elqui',
        name: 'Elqui',
        children: [
          { id: 'la-serena', name: 'La Serena' },
          { id: 'coquimbo-city', name: 'Coquimbo' },
          { id: 'vicuna', name: 'Vicuña' },
        ],
      },
      {
        id: 'limari',
        name: 'Limarí',
        children: [
          { id: 'ovalle', name: 'Ovalle' },
          { id: 'combarbala', name: 'Combarbalá' },
        ],
      },
    ],
  },
  {
    id: 'valparaiso',
    name: 'Valparaíso',
    children: [
      {
        id: 'valparaiso-prov',
        name: 'Valparaíso',
        children: [
          { id: 'valparaiso-city', name: 'Valparaíso' },
          { id: 'vina-del-mar', name: 'Viña del Mar' },
          { id: 'concon', name: 'Concón' },
          { id: 'quintero', name: 'Quintero' },
        ],
      },
      {
        id: 'san-antonio',
        name: 'San Antonio',
        children: [
          { id: 'san-antonio-city', name: 'San Antonio' },
          { id: 'cartagena', name: 'Cartagena' },
        ],
      },
    ],
  },
  {
    id: 'metropolitana',
    name: 'Región Metropolitana',
    children: [
      {
        id: 'santiago',
        name: 'Santiago',
        children: [
          { id: 'santiago-centro', name: 'Santiago' },
          { id: 'providencia', name: 'Providencia' },
          { id: 'las-condes', name: 'Las Condes' },
          { id: 'nunoa', name: 'Ñuñoa' },
          { id: 'maipu', name: 'Maipú' },
          { id: 'san-miguel', name: 'San Miguel' },
          { id: 'la-florida', name: 'La Florida' },
          { id: 'puente-alto', name: 'Puente Alto' },
          { id: 'san-bernardo', name: 'San Bernardo' },
          { id: 'recoleta', name: 'Recoleta' },
          { id: 'independencia', name: 'Independencia' },
          { id: 'estacion-central', name: 'Estación Central' },
        ],
      },
      {
        id: 'cordillera',
        name: 'Cordillera',
        children: [
          { id: 'puente-alto-prov', name: 'Puente Alto' },
          { id: 'pirque', name: 'Pirque' },
        ],
      },
    ],
  },
  {
    id: 'ohiggins',
    name: "O'Higgins",
    children: [
      {
        id: 'cachapoal',
        name: 'Cachapoal',
        children: [
          { id: 'rancagua', name: 'Rancagua' },
          { id: 'codegua', name: 'Codegua' },
        ],
      },
      {
        id: 'colchagua',
        name: 'Colchagua',
        children: [
          { id: 'san-fernando', name: 'San Fernando' },
          { id: 'chimbarongo', name: 'Chimbarongo' },
        ],
      },
    ],
  },
  {
    id: 'maule',
    name: 'Maule',
    children: [
      {
        id: 'talca',
        name: 'Talca',
        children: [
          { id: 'talca-city', name: 'Talca' },
          { id: 'curico', name: 'Curicó' },
        ],
      },
      {
        id: 'linares',
        name: 'Linares',
        children: [
          { id: 'linares-city', name: 'Linares' },
          { id: 'longavi', name: 'Longaví' },
        ],
      },
    ],
  },
  {
    id: 'biobio',
    name: 'Biobío',
    children: [
      {
        id: 'concepcion',
        name: 'Concepción',
        children: [
          { id: 'concepcion-city', name: 'Concepción' },
          { id: 'talcahuano', name: 'Talcahuano' },
          { id: 'san-pedro', name: 'San Pedro de la Paz' },
        ],
      },
      {
        id: 'arauco',
        name: 'Arauco',
        children: [
          { id: 'lebu', name: 'Lebu' },
          { id: 'cañete', name: 'Cañete' },
        ],
      },
    ],
  },
  {
    id: 'araucania',
    name: 'La Araucanía',
    children: [
      {
        id: 'cautin',
        name: 'Cautín',
        children: [
          { id: 'temuco', name: 'Temuco' },
          { id: 'villarrica', name: 'Villarrica' },
        ],
      },
      {
        id: 'malleco',
        name: 'Malleco',
        children: [
          { id: 'angol', name: 'Angol' },
          { id: 'collipulli', name: 'Collipulli' },
        ],
      },
    ],
  },
  {
    id: 'los-rios',
    name: 'Los Ríos',
    children: [
      {
        id: 'valdivia',
        name: 'Valdivia',
        children: [
          { id: 'valdivia-city', name: 'Valdivia' },
          { id: 'corral', name: 'Corral' },
        ],
      },
    ],
  },
  {
    id: 'los-lagos',
    name: 'Los Lagos',
    children: [
      {
        id: 'llanquihue',
        name: 'Llanquihue',
        children: [
          { id: 'puerto-montt', name: 'Puerto Montt' },
          { id: 'puerto-varas', name: 'Puerto Varas' },
        ],
      },
    ],
  },
  {
    id: 'aysen',
    name: 'Aysén',
    children: [
      {
        id: 'coyhaique',
        name: 'Coyhaique',
        children: [
          { id: 'coyhaique-city', name: 'Coyhaique' },
          { id: 'aysen', name: 'Aysén' },
        ],
      },
    ],
  },
  {
    id: 'magallanes',
    name: 'Magallanes',
    children: [
      {
        id: 'magallanes-prov',
        name: 'Magallanes',
        children: [
          { id: 'punta-arenas', name: 'Punta Arenas' },
          { id: 'puerto-natales', name: 'Puerto Natales' },
        ],
      },
    ],
  },
];

// Normalizar texto: quitar acentos, convertir a minúsculas, quitar espacios extra
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/\s+/g, ' ') // Normalizar espacios
    .replace(/[^\w\s]/g, '') // Quitar caracteres especiales excepto espacios
    .trim();
}

// Función helper para encontrar una comuna por nombre (normalizado con búsqueda inteligente)
export function findCommuneByName(communeName: string): { region: string; province: string; commune: string } | null {
  if (!communeName || !communeName.trim()) return null;
  
  const normalized = normalizeText(communeName);
  
  // Primero intentar búsqueda exacta
  for (const region of chileLocations) {
    if (!region.children) continue;
    for (const province of region.children) {
      if (!province.children) continue;
      for (const commune of province.children) {
        const communeNormalized = normalizeText(commune.name);
        if (communeNormalized === normalized) {
          return {
            region: region.name,
            province: province.name,
            commune: commune.name,
          };
        }
      }
    }
  }
  
  // Si no hay coincidencia exacta, intentar búsqueda parcial (contiene)
  for (const region of chileLocations) {
    if (!region.children) continue;
    for (const province of region.children) {
      if (!province.children) continue;
      for (const commune of province.children) {
        const communeNormalized = normalizeText(commune.name);
        // Búsqueda parcial: la comuna contiene el texto buscado o viceversa
        if (
          communeNormalized.includes(normalized) ||
          normalized.includes(communeNormalized)
        ) {
          return {
            region: region.name,
            province: province.name,
            commune: commune.name,
          };
        }
      }
    }
  }
  
  // Si aún no hay coincidencia, intentar búsqueda por palabras clave comunes
  const commonMappings: Record<string, { region: string; province: string; commune: string }> = {
    'santiago': { region: 'Región Metropolitana', province: 'Santiago', commune: 'Santiago' },
    'providencia': { region: 'Región Metropolitana', province: 'Santiago', commune: 'Providencia' },
    'las condes': { region: 'Región Metropolitana', province: 'Santiago', commune: 'Las Condes' },
    'nuñoa': { region: 'Región Metropolitana', province: 'Santiago', commune: 'Ñuñoa' },
    'nunoa': { region: 'Región Metropolitana', province: 'Santiago', commune: 'Ñuñoa' },
    'maipu': { region: 'Región Metropolitana', province: 'Santiago', commune: 'Maipú' },
    'maipú': { region: 'Región Metropolitana', province: 'Santiago', commune: 'Maipú' },
    'valparaiso': { region: 'Valparaíso', province: 'Valparaíso', commune: 'Valparaíso' },
    'valparaíso': { region: 'Valparaíso', province: 'Valparaíso', commune: 'Valparaíso' },
    'vina del mar': { region: 'Valparaíso', province: 'Valparaíso', commune: 'Viña del Mar' },
    'viña del mar': { region: 'Valparaíso', province: 'Valparaíso', commune: 'Viña del Mar' },
    'concepcion': { region: 'Biobío', province: 'Concepción', commune: 'Concepción' },
    'concepción': { region: 'Biobío', province: 'Concepción', commune: 'Concepción' },
  };
  
  const mapping = commonMappings[normalized];
  if (mapping) {
    return mapping;
  }
  
  return null;
}

// Función para obtener todas las comunas
export function getAllCommunes(): Array<{ id: string; name: string; region: string; province: string }> {
  const communes: Array<{ id: string; name: string; region: string; province: string }> = [];
  
  for (const region of chileLocations) {
    if (!region.children) continue;
    for (const province of region.children) {
      if (!province.children) continue;
      for (const commune of province.children) {
        communes.push({
          id: commune.id,
          name: commune.name,
          region: region.name,
          province: province.name,
        });
      }
    }
  }
  
  return communes;
}

