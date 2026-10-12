export type EditablePlan = {
  name: string
  eyebrow: string
  price: number
  unit: string
  description: string
  featured: boolean
  kind: 'overnight' | 'day'
}

export type EditableGalleryItem = {
  title: string
  category: string
  image: string
}

export type EditableAmenity = {
  icon: string
  title: string
  description: string
}

export type EditablePolicy = {
  title: string
  description: string
}

export type EditableBreakfast = {
  title: string
  description: string
}

export type SiteContent = {
  businessName: string
  logoUrl: string
  heroImage: string
  experienceImage: string
  heroEyebrow: string
  heroTitle: string
  heroSubtitle: string
  experienceTitle: string
  experienceDescription: string
  whatsappPhone: string
  contactEmail: string
  contactAddress: string
  instagramUrl: string
  facebookUrl: string
  locationUrl: string
  mapEmbedUrl: string
  plans: EditablePlan[]
  gallery: EditableGalleryItem[]
  amenities: EditableAmenity[]
  breakfastTitle: string
  breakfastDescription: string
  breakfastImage: string
  breakfasts: EditableBreakfast[]
  policies: EditablePolicy[]
}

export const defaultSiteContent: SiteContent = {
  businessName: 'Cedro Alto Glamping',
  logoUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-6FdQXDvKYx4uwSQQxkQphIj93qWWUA.jpg',
  heroImage: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-06%20at%2019.46.32%20%282%29-ioIIFxhqtujsbbPD1YGcIdwmre4jbU.jpeg',
  experienceImage: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/compartir-REbtPKY7qfiDCHOUQAEAeBSYMYIyhW.jpeg',
  heroEyebrow: 'Glamping boutique & desconexión natural',
  heroTitle: 'Cerca de la ciudad, lejos del mundo',
  heroSubtitle: 'Exclusividad, calma y confort de lujo inmerso en la serenidad de la montaña.',
  experienceTitle: 'El encanto de descansar en las alturas',
  experienceDescription: 'Diseñado para reconectar con lo esencial: sumérgete en un jacuzzi climatizado con hidromasaje privado, disfruta de la zona BBQ, y despierta con el canto de aves nativas como el barranquero.',
  whatsappPhone: '573012547427',
  contactEmail: '',
  contactAddress: 'San Antonio de Prado, Medellín, Antioquia',
  instagramUrl: 'https://www.instagram.com/luxury_cedro_alto?igsh=Mjd3eDVodW1obWUy',
  facebookUrl: 'https://www.facebook.com/search/pages/?q=Luxury%20Cedro%20Alto%20Glamping',
  locationUrl: 'https://www.google.com/maps?kgmid=/g/11mkxqnc1w&hl=es-419&shem=dlvs1,epsd1,rimspwouoe&shndl=17&kgs=bde20b200c53c860&um=1&ie=UTF-8&fb=1&gl=co&sa=X&geocode=KfNKSkUAgUaOMa9RjikRmmld&daddr=San+Antonio+de+Prado,+Medell%C3%ADn,+San+Antonio+de+Prado,+Medell%C3%ADn,+Antioquia',
  mapEmbedUrl: 'https://www.google.com/maps?q=San+Antonio+de+Prado,+Medell%C3%ADn,+Antioquia&output=embed',
  plans: [
    { name: 'Escapada entre semana', eyebrow: 'Domingo a jueves', price: 399000, unit: 'por noche', description: 'Check-in 3:00 PM · Check-out 12:00 PM', featured: false, kind: 'overnight' },
    { name: 'Fin de semana & festivos', eyebrow: 'Viernes a domingo y festivos', price: 499000, unit: 'por noche', description: 'Check-in 3:00 PM · Check-out 12:00 PM', featured: true, kind: 'overnight' },
    { name: 'Plan Pasadía Express', eyebrow: 'Estancia de 6 horas', price: 150000, unit: 'por pasadía', description: 'Incluye jacuzzi & sauna. No incluye desayuno ni botella de vino.', featured: false, kind: 'day' },
  ],
  gallery: [
    { title: 'Detalle personalizado', category: 'Detalles de bienvenida', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/detalle-kCyYZW0trHH4BTBMZOS1WU51mEaVOw.jpeg' },
    { title: 'Desayuno para compartir', category: 'Gastronomía', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/desayuno-3w89hsOf7oYrAL7ADMgP5btZmsQaHb.jpeg' },
    { title: 'Balcón con vista verde', category: 'Vistas & Paisaje', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-06%20at%2019.46.32%20%282%29-ioIIFxhqtujsbbPD1YGcIdwmre4jbU.jpeg' },
    { title: 'Jacuzzi con iluminación', category: 'Jacuzzi & Terraza', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-06%20at%2019.46.31%20%283%29-HohuJhz2xBXXYUPuzdSBzhBDLAGoCb.jpeg' },
    { title: 'Sauna en madera', category: 'Jacuzzi & Terraza', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-06%20at%2019.46.32%20%281%29-vqDO2cODmlnxLxzvZN7XDiFL0ry832.jpeg' },
    { title: 'Habitación', category: 'Habitación', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/habitacion-hOIHGLtvoPCjX1qoe8puT9NVi93rp9.jpeg' },
    { title: 'Sala para descansar', category: 'Habitación', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-06%20at%2019.46.31-fpuEZZgwUshARGlUJKGXFXy2iA7UsF.jpeg' },
  ],
  amenities: [
    { icon: 'BedDouble', title: 'Confort & Descanso', description: 'Habitación principal con cama doble, segunda habitación con sofá cama y sala amplia.' },
    { icon: 'Sparkles', title: 'Bienestar Exclusivo', description: 'Jacuzzi climatizado y sauna de uso 100% privado.' },
    { icon: 'Wifi', title: 'Entretenimiento & Conexión', description: 'TV de 65 pulgadas, Wi-Fi de fibra óptica y bafle de sonido.' },
    { icon: 'Home', title: 'Espacios & Asados', description: 'Cocina dotada, baño completo, balcón con barra y zona BBQ.' },
    { icon: 'Coffee', title: 'Kit de Desayuno', description: 'Sabores artesanales y frescos para comenzar la mañana sin afanes.' },
    { icon: 'ShieldCheck', title: 'Detalle de bienvenida', description: 'Detalle personalizado con los nombres de nuestros huéspedes.' },
  ],
  breakfastTitle: 'Sabores de origen en tu estadía',
  breakfastDescription: 'Dos opciones con ingredientes frescos para empezar el día con calma.',
  breakfastImage: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/desayuno-3w89hsOf7oYrAL7ADMgP5btZmsQaHb.jpeg',
  breakfasts: [
    { title: 'Desayuno 1', description: 'Arepa blanca · Chorizo · Huevo · Porción de fruta · Chocolate / café' },
    { title: 'Desayuno 2', description: 'Arepa de chocolo · Quesito · Croissant · Porción de fruta · Chocolate o café' },
  ],
  policies: [
    { title: 'Clima y ropa recomendada', description: 'Días templados (20°C - 23°C) y noches frescas de montaña (12°C - 15°C). Sugerimos abrigo térmico, chaqueta cortavientos y zapatos cómodos.' },
    { title: 'Política pet friendly', description: 'Mascotas bienvenidas bajo reserva previa. Exigimos correa en zonas comunes y kit de aseo propio.' },
    { title: 'Políticas de cancelación y pago', description: 'Aceptamos pagos electrónicos vía transferencia bancaria (Bancolombia, Nequi, PSE). Cancelaciones sin costo hasta 7 días antes de la fecha reservada.' },
  ],
}
