import type { Product } from './lib'

/** Catálogo embebido para el deploy estático (Netlify) cuando no hay backend. */
export const catalog: Product[] = [
  {
    slug: 'raiz',
    name: 'Raíz',
    category: 'Premium',
    kind: 'urna',
    priceCents: 8_600_000,
    stock: 12,
    blurb: 'Urna de fibra y semilla nativa. Pensada para jardín o bosque, con un árbol que continúa el nombre.',
    material: 'Fibra vegetal y arcilla',
    seed: 'Cebil o jacarandá, según región',
  },
  {
    slug: 'bruma',
    name: 'Bruma',
    category: 'Esencial',
    kind: 'urna',
    priceCents: 6_400_000,
    stock: 20,
    blurb: 'Forma suave, tono piedra. Para una ceremonia serena, sin ornamento de más.',
    material: 'Papel de algodón y tierra',
    seed: 'Lavanda y romero',
  },
  {
    slug: 'cauce',
    name: 'Cauce',
    category: 'Premium',
    kind: 'urna',
    priceCents: 9_100_000,
    stock: 8,
    blurb: 'Para despedidas junto al agua. Se disuelve con respeto y deja un recuerdo vegetal.',
    material: 'Sal compactada y algas',
    seed: 'Ceibo',
  },
  {
    slug: 'carton',
    name: 'Arena',
    category: 'Esencial',
    kind: 'urna',
    priceCents: 5_200_000,
    stock: 22,
    blurb: 'Tono arena, forma limpia. Una pieza quieta que se desarma con la humedad y vuelve a ser tierra.',
    material: 'Fibra vegetal y celulosa',
    seed: 'Girasol',
  },
  {
    slug: 'combo',
    name: 'Combo sereno',
    category: 'Combo',
    kind: 'urna',
    priceCents: 11_800_000,
    stock: 10,
    blurb: 'Urna Bruma, semilla, carta impresa y coordinación de siembra en predio aliado.',
    material: 'Según urna',
    seed: 'A elección',
  },
  {
    slug: 'rosa-eterna',
    name: 'Rosa eterna',
    category: 'Flor premium',
    kind: 'planta',
    priceCents: 1_800_000,
    stock: 30,
    blurb: 'Una rosa para sembrar con la urna. El color queda en el jardín después de la ceremonia.',
    material: 'Semilla de flor',
    seed: 'Maceta o cantero con sol.',
  },
  {
    slug: 'girasol',
    name: 'Girasol',
    category: 'Flor',
    kind: 'planta',
    priceCents: 900_000,
    stock: 40,
    blurb: 'Sigue la luz. Para una despedida al aire libre, con una flor alta y simple.',
    material: 'Semilla de flor',
    seed: 'Tierra suelta y bastante sol.',
  },
  {
    slug: 'amapola',
    name: 'Amapola',
    category: 'Flor',
    kind: 'planta',
    priceCents: 800_000,
    stock: 40,
    blurb: 'Silvestre y breve. Un gesto chico en la tierra, sin ocupar el jardín.',
    material: 'Semilla de flor',
    seed: 'Cantero silvestre.',
  },
  {
    slug: 'lavanda',
    name: 'Lavanda',
    category: 'Flor',
    kind: 'planta',
    priceCents: 1_100_000,
    stock: 36,
    blurb: 'Perfume suave para una ceremonia serena. Acompaña bien a las urnas más quietas.',
    material: 'Semilla de flor',
    seed: 'Suelo aireado, poco riego.',
  },
  {
    slug: 'jazmin',
    name: 'Jazmín',
    category: 'Flor',
    kind: 'planta',
    priceCents: 1_400_000,
    stock: 28,
    blurb: 'Florece de noche. Para una despedida íntima, de pocas personas.',
    material: 'Semilla de flor',
    seed: 'Muro, pérgola o maceta grande.',
  },
  {
    slug: 'petrea',
    name: 'Petrea',
    category: 'Flor',
    kind: 'planta',
    priceCents: 1_200_000,
    stock: 24,
    blurb: 'Racimos violetas. Una enredadera para dejar el recuerdo sobre un muro.',
    material: 'Semilla de enredadera',
    seed: 'Apoyo para trepar y sol de mañana.',
  },
  {
    slug: 'jacaranda',
    name: 'Jacarandá',
    category: 'Árbol',
    kind: 'planta',
    priceCents: 2_400_000,
    stock: 20,
    blurb: 'Árbol de sombra violeta. Pide espacio y paciencia, y después cubre el lugar de flores.',
    material: 'Semilla de árbol',
    seed: 'Jardín o vereda ancha.',
  },
  {
    slug: 'ceibo',
    name: 'Ceibo',
    category: 'Árbol',
    kind: 'planta',
    priceCents: 2_200_000,
    stock: 22,
    blurb: 'La flor nacional. Para sembrar cerca del agua o en un patio que reciba sol.',
    material: 'Semilla de árbol',
    seed: 'Suelo húmedo y sol.',
  },
  {
    slug: 'cebil',
    name: 'Cebil',
    category: 'Árbol',
    kind: 'planta',
    priceCents: 2_000_000,
    stock: 18,
    blurb: 'Nativo del norte. Crece con fuerza donde hay sol y tierra profunda.',
    material: 'Semilla de árbol',
    seed: 'Clima cálido, predio amplio.',
  },
  {
    slug: 'lapacho',
    name: 'Lapacho',
    category: 'Árbol premium',
    kind: 'planta',
    priceCents: 3_200_000,
    stock: 14,
    blurb: 'Flor rosada en primavera. Una especie de porte, para un predio que pueda sostenerla.',
    material: 'Semilla de árbol',
    seed: 'Parque o jardín grande.',
  },
  {
    slug: 'cerezo',
    name: 'Cerezo',
    category: 'Árbol premium',
    kind: 'planta',
    priceCents: 3_600_000,
    stock: 12,
    blurb: 'Floración corta y muy visible. Para quien amaba la primavera.',
    material: 'Semilla de árbol',
    seed: 'Suelo fresco y sol suave.',
  },
  {
    slug: 'cipres',
    name: 'Ciprés',
    category: 'Árbol',
    kind: 'planta',
    priceCents: 2_600_000,
    stock: 16,
    blurb: 'Vertical y sobrio. Marca el lugar sin ocupar todo el jardín.',
    material: 'Semilla de árbol',
    seed: 'Tierra drenada.',
  },
]

export function staticApi(path: string, method = 'GET'): unknown | undefined {
  if (method.toUpperCase() !== 'GET') return undefined

  const url = new URL(path, 'https://eternal.local')
  const route = url.pathname.replace(/\/+$/, '') || '/'

  if (route === '/api/products') {
    const kind = url.searchParams.get('kind')
    return catalog.filter((item) => !kind || item.kind === kind)
  }

  const productMatch = route.match(/^\/api\/products\/([^/]+)$/)
  if (productMatch) {
    return catalog.find((item) => item.slug === productMatch[1])
  }

  if (route === '/api/impact') {
    return { treesPlanted: 128, urnsDonated: 46, partnerSites: 9 }
  }

  return undefined
}
