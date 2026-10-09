'use client'

import { useState } from 'react'
import {
  ArrowRight,
  BedDouble,
  Bird,
  CalendarDays,
  Car,
  ChevronDown,
  ChevronRight,
  Coffee,
  Home,
  MapPin,
  Menu,
  MessageCircle,
  Mountain,
  Navigation,
  ShieldCheck,
  Sparkles,
  Wifi,
  X,
} from 'lucide-react'

const logoUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-6FdQXDvKYx4uwSQQxkQphIj93qWWUA.jpg'
const whatsappUrl = 'https://api.whatsapp.com/send?phone=573012547427'

const gallery = [
  { title: 'Detalle personalizado', category: 'Detalles de bienvenida', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-06%20at%2019.44.45-awk7iwnxrwIuTxqWvpCm0Fp9muMu8Y.jpeg', large: true },
  { title: 'Cena para compartir', category: 'Gastronomía', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-06%20at%2019.46.31%20%282%29-8iejXvwJaFBgEvcEkkdciZl5kITUr9.jpeg' },
  { title: 'Balcón con vista verde', category: 'Vistas & Paisaje', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-06%20at%2019.46.31%20%281%29-qaGuoL0Kmijh6gEkkqeT4Gs9xqgKDu.jpeg' },
  { title: 'Jacuzzi con iluminación', category: 'Jacuzzi & Terraza', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-06%20at%2019.46.31%20%283%29-HohuJhz2xBXXYUPuzdSBzhBDLAGoCb.jpeg' },
  { title: 'Sauna en madera', category: 'Jacuzzi & Terraza', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-06%20at%2019.46.32%20%281%29-vqDO2cODmlnxLxzvZN7XDiFL0ry832.jpeg' },
  { title: 'Sala para descansar', category: 'Habitación', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-06%20at%2019.46.31-fpuEZZgwUshARGlUJKGXFXy2iA7UsF.jpeg' },
]

const amenities = [
  [BedDouble, 'Confort & Descanso', 'Habitación principal con cama doble, segunda habitación con sofá cama y sala amplia.'],
  [Sparkles, 'Bienestar Exclusivo', 'Jacuzzi climatizado y sauna de uso 100% privado.'],
  [Wifi, 'Entretenimiento & Conexión', 'TV de 65 pulgadas, Wi-Fi de fibra óptica y bafle de sonido.'],
  [Home, 'Espacios & Asados', 'Cocina dotada, baño completo, balcón con barra y zona BBQ.'],
  [Coffee, 'Kit de Desayuno', 'Sabores artesanales y frescos para comenzar la mañana sin afanes.'],
  [ShieldCheck, 'Detalle de bienvenida', 'Detalle personalizado con los nombres de nuestros huéspedes.'],
]

const foods = [
  ['OPCIÓN 01', 'Arepa, huevos y chorizo', 'Ingredientes incluidos: arepa, chorizo, huevos, porción de fruta —2 frutas por persona— y café o chocolate. Puedes preparar tu desayuno a tu gusto.', '/desayuno-arepa-huevos.png'],
  ['OPCIÓN 02', 'Croissant con fruta y bebida caliente', 'Ingredientes incluidos: croissant, porción de fruta —2 frutas por persona— y café o chocolate para disfrutar una mañana tranquila.', '/desayuno-croissant-fruta.png'],
]

const testimonials = [
  ['“La vista desde el jacuzzi al atardecer no tiene comparación. La comida y el café deliciosos.”', 'Camila & Juan'],
  ['“Poder llevar a nuestra mascota y sentirnos tan cerca de la ciudad pero totalmente desconectados fue increíble.”', 'Daniel S.'],
  ['“La atención al detalle, la cama cómoda y la zona BBQ hicieron la noche inolvidable.”', 'Marcela G.'],
]

function SectionIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return <div className="section-intro"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{copy && <p>{copy}</p>}</div>
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [filter, setFilter] = useState('Todo')
  const [openInfo, setOpenInfo] = useState(0)
  const [mapOpen, setMapOpen] = useState(false)
  const locationUrl = 'https://www.google.com/maps?kgmid=/g/11mkxqnc1w&hl=es-419&shem=dlvs1,epsd1,rimspwouoe&shndl=17&kgs=bde20b200c53c860&um=1&ie=UTF-8&fb=1&gl=co&sa=X&geocode=KfNKSkUAgUaOMa9RjikRmmld&daddr=San+Antonio+de+Prado,+Medell%C3%ADn,+San+Antonio+de+Prado,+Medell%C3%ADn,+Antioquia'
  const mapEmbedUrl = 'https://www.google.com/maps?q=San+Antonio+de+Prado,+Medell%C3%ADn,+Antioquia&output=embed'
  const filteredGallery = filter === 'Todo' ? gallery : gallery.filter((item) => item.category === filter)
  const filters = ['Todo', 'Habitación', 'Jacuzzi & Terraza', 'Vistas & Paisaje', 'Gastronomía']

  return (
    <main>
      <header className="site-header">
        <a href="#inicio" className="brand"><img src={logoUrl} alt="Cedro Alto — Cerca de la ciudad, lejos del mundo" /></a>
        <nav className={menuOpen ? 'main-nav open' : 'main-nav'} aria-label="Navegación principal">
          {['Experiencia', 'Galería', 'Qué incluye', 'Gastronomía', 'Tarifas', 'Ubicación', 'Información'].map((item) => <a key={item} href={`#${item.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setMenuOpen(false)}>{item}</a>)}
        </nav>
        <div className="header-actions"><a className="whatsapp-icon" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Escribir por WhatsApp"><MessageCircle size={18} /></a><a href={`${whatsappUrl}&text=Hola%20Cedro%20Alto%2C%20quiero%20reservar%20una%20estad%C3%ADa.`} target="_blank" rel="noreferrer" className="button button-dark">Reservar ahora <ArrowRight size={15} /></a></div>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-overlay" />
        <div className="hero-content"><span className="pill pill-light">Glamping boutique & desconexión natural</span><h1>Cerca de la ciudad,<br /><em>lejos del mundo</em></h1><p>Exclusividad, calma y confort de lujo inmerso en la serenidad de la montaña.</p><a href="#reservar" className="hero-link">Descubre la experiencia <ArrowRight size={16} /></a></div>
        <div className="booking-card" id="reservar"><div className="booking-field"><CalendarDays size={17} /><label>Llegada<input type="date" aria-label="Fecha de llegada" /></label></div><div className="booking-field"><CalendarDays size={17} /><label>Salida<input type="date" aria-label="Fecha de salida" /></label></div><div className="booking-field"><Bird size={17} /><label>Huéspedes<select aria-label="Número de huéspedes"><option>2 Adultos</option><option>2 Adultos, 1 niño</option><option>4 Adultos</option></select></label></div><a className="button button-dark booking-button" href={`${whatsappUrl}&text=Hola%20Cedro%20Alto%2C%20quiero%20consultar%20disponibilidad%20para%20mi%20estad%C3%ADa.`} target="_blank" rel="noreferrer">Consultar disponibilidad <ArrowRight size={15} /></a></div>
      </section>

      <section className="experience section-shell" id="experiencia"><div className="experience-image image-card"><img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-06%20at%2019.46.31%20%282%29-8iejXvwJaFBgEvcEkkdciZl5kITUr9.jpeg" alt="Cena servida en la estancia Cedro Alto" /><span className="image-note">Una pausa que se queda contigo</span></div><div className="experience-copy"><SectionIntro eyebrow="La experiencia" title="El encanto de descansar en las alturas" copy="Diseñado para reconectar con lo esencial: sumérgete en un jacuzzi climatizado con hidromasaje privado, disfruta de la zona BBQ, y despierta con el canto de aves nativas como el barranquero." /><div className="feature-list"><div><span>01</span><strong>Jacuzzi hidromasaje privado</strong></div><div><span>02</span><strong>Zona BBQ para compartir</strong></div><div><span>03</span><strong>Avistamiento de aves nativas</strong></div></div><a href="#incluye" className="text-link">Conoce todas las comodidades <ArrowRight size={15} /></a></div></section>

      <section className="gallery-section section-shell" id="galería"><SectionIntro eyebrow="Un lugar para mirar despacio" title="Momentos que se quedan" /><div className="filter-tabs">{filters.map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="gallery-grid">{filteredGallery.map((item) => <figure key={item.title} className={item.large && filteredGallery.length > 3 ? 'gallery-item large' : 'gallery-item'}><img src={item.image} alt={item.title} /><figcaption><span>{item.category}</span><strong>{item.title}</strong></figcaption></figure>)}</div></section>

      <section className="amenities-section section-shell" id="qué-incluye"><SectionIntro eyebrow="Todo pensado para ti" title="Comodidades exclusivas incluidas en tu estadía" /><div className="amenities-grid">{amenities.map(([Icon, title, copy]) => <div className="amenity-card" key={title as string}><Icon size={24} strokeWidth={1.3} /><h3>{title as string}</h3><p>{copy as string}</p></div>)}</div></section>

      <section className="food-section" id="gastronomía"><div className="section-shell"><SectionIntro eyebrow="Desayuno incluido" title="Sabores de origen en tu estadía" copy="Comienza la mañana con un desayuno artesanal, fresco y preparado para disfrutar sin afanes." /><div className="food-grid">{foods.map(([badge, title, copy, image]) => <article className="food-card" key={title}><img src={image} alt={title} /><div className="food-card-body"><span className="food-badge">{badge}</span><h3>{title}</h3><p>{copy}</p><a href="#contacto" className="text-link">Conocer más <ArrowRight size={15} /></a></div></article>)}</div></div></section>

      <section className="rates-section section-shell" id="tarifas"><SectionIntro eyebrow="Planifica tu pausa" title="Tarifas y disponibilidad" copy="Elige tus fechas y déjanos preparar una estadía inolvidable." /><div className="rates-layout"><div className="calendar-card"><div className="calendar-head"><button aria-label="Mes anterior"><ChevronRight className="rotate-180" size={17} /></button><strong>Octubre 2026</strong><button aria-label="Mes siguiente"><ChevronRight size={17} /></button></div><div className="weekdays">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{Array.from({ length: 31 }, (_, i) => <button key={i} className={i === 16 ? 'selected' : i % 7 === 4 || i % 7 === 5 ? 'busy' : ''}>{i + 1}</button>)}</div><div className="calendar-legend"><span><i className="available" />Disponible</span><span><i className="busy-dot" />Ocupado</span><span><i className="selected-dot" />Seleccionado</span></div></div><div className="price-cards"><article className="price-card"><span className="eyebrow">Domingo a jueves</span><h3>Escapada entre semana</h3><strong className="price">$399.000 <small>COP / noche</small></strong><div className="check-times"><span>Check-in <b>3:00 PM</b></span><span>Check-out <b>12:00 PM</b></span></div><a className="button button-outline" href={`${whatsappUrl}&text=Hola%20Cedro%20Alto%2C%20quiero%20consultar%20disponibilidad%20y%20tarifas.`} target="_blank" rel="noreferrer">Seleccionar fechas <ArrowRight size={15} /></a></article><article className="price-card featured"><span className="popular">Experiencia completa</span><span className="eyebrow">Viernes a domingo y festivos</span><h3>Fin de semana & festivos</h3><strong className="price">$499.000 <small>COP / noche</small></strong><div className="check-times"><span>Check-in <b>3:00 PM</b></span><span>Check-out <b>12:00 PM</b></span></div><a className="button button-light" href={`${whatsappUrl}&text=Hola%20Cedro%20Alto%2C%20quiero%20reservar%20el%20plan%20de%20fin%20de%20semana.`} target="_blank" rel="noreferrer">Seleccionar fechas <ArrowRight size={15} /></a></article><article className="price-card"><span className="popular">Desconexión rápida</span><span className="eyebrow">Estancia de 6 horas</span><h3>Plan Pasadía Express</h3><strong className="price">$150.000 <small>COP</small></strong><div className="check-times"><span>Uso <b>6 horas</b></span><span>Incluye <b>Jacuzzi & sauna</b></span></div><p className="price-note">No incluye kit de desayuno ni botella de vino.</p><a className="button button-outline" href={`${whatsappUrl}&text=Hola%20Cedro%20Alto%2C%20quiero%20reservar%20el%20Plan%20Pasad%C3%ADa%20Express.`} target="_blank" rel="noreferrer">Reservar 6 horas <ArrowRight size={15} /></a></article></div></div><p className="payment-note">Garantiza tu estadía con un anticipo del 50%. El saldo se liquida al ingreso.</p></section>

      <section className="location-section" id="ubicación"><div className="section-shell"><SectionIntro eyebrow="La ruta hacia tu refugio" title="Cómo llegar a Cedro Alto" /><div className="location-grid"><div className="map-card">{mapOpen ? <iframe className="map-embed" src={mapEmbedUrl} title="Mapa de ubicación de Cedro Alto" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : <button className="map-art map-trigger" type="button" onClick={() => setMapOpen(true)} aria-label="Abrir mapa con la ruta hacia Cedro Alto"><div className="map-pin"><MapPin size={24} /></div><span className="map-label">Cedro Alto</span><div className="map-road road-one" /><div className="map-road road-two" /><span className="map-open-label">Abrir mapa y ruta</span></button>}<div className="map-footer"><span><Navigation size={15} /> Ubicación exacta</span><a href={locationUrl} target="_blank" rel="noreferrer">Abrir ruta en Google Maps <ArrowRight size={14} /></a></div></div><div className="location-facts"><div className="fact"><Mountain size={22} /><h3>Distancias clave</h3><p>A solo 15 minutos del parque principal de San Antonio de Prado.</p></div><div className="fact"><Car size={22} /><h3>Tipo de vehículo</h3><p>Vía pavimentada hasta el acceso. Apto para cualquier tipo de vehículo.</p></div><div className="fact"><Navigation size={22} /><h3>Navegación asistida</h3><div className="nav-buttons"><a href={locationUrl} target="_blank" rel="noreferrer">Google Maps <ArrowRight size={13} /></a><a href="https://www.waze.com/ul?q=Cedro%20Alto" target="_blank" rel="noreferrer">Waze <ArrowRight size={13} /></a></div></div></div></div></div></section>

      <section className="info-section section-shell" id="información"><div className="info-heading"><SectionIntro eyebrow="Antes de tu llegada" title="Información importante & normas del lugar" /></div><div className="accordion-list">{[['Clima y ropa recomendada', 'Días templados (20°C - 23°C) y noches frescas de montaña (12°C - 15°C). Sugerimos abrigo térmico, chaqueta cortavientos y zapatos cómodos.'], ['Política pet friendly', 'Mascotas bienvenidas bajo reserva previa. Exigimos correa en zonas comunes y kit de aseo propio.'], ['Políticas de cancelación y pago', 'Aceptamos pagos electrónicos vía transferencia bancaria (Bancolombia, Nequi, PSE). Cancelaciones sin costo hasta 7 días antes de la fecha reservada.']].map(([title, copy], i) => <div className={`accordion ${openInfo === i ? 'open' : ''}`} key={title}><button onClick={() => setOpenInfo(openInfo === i ? -1 : i)}><span>{title}</span><ChevronDown size={18} /></button>{openInfo === i && <p>{copy}</p>}</div>)}</div></section>

      <section className="reviews-section"><div className="section-shell"><SectionIntro eyebrow="Palabras que inspiran" title="La experiencia de nuestros visitantes" /><div className="rating"><span>4.9 / 5.0</span><span className="stars">★★★★★</span><small>Huéspedes satisfechos</small></div><div className="reviews-grid">{testimonials.map(([quote, name]) => <blockquote key={name}><div className="quote-mark">“</div><p>{quote}</p><footer><span>{name}</span><span className="stars">★★★★★</span></footer></blockquote>)}</div></div></section>

      <footer className="site-footer" id="contacto"><div className="section-shell footer-grid"><div className="contact-copy"><span className="eyebrow">Hablemos de tu escapada</span><h2>¿Listo para bajar el ritmo?</h2><p>Escríbenos y déjanos ayudarte a encontrar las fechas perfectas para tu refugio en la montaña.</p><a className="button button-dark" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos a WhatsApp <MessageCircle size={16} /></a><div className="social-links"><a href="https://www.instagram.com/luxury_cedro_alto?igsh=Mjd3eDVodW1obWUy" target="_blank" rel="noreferrer" aria-label="Instagram de Luxury Cedro Alto"><span className="instagram-mark" aria-hidden="true"><i /></span> <span>@luxury_cedro_alto</span></a><a href="https://www.facebook.com/search/pages/?q=Luxury%20Cedro%20Alto%20Glamping" target="_blank" rel="noreferrer" aria-label="Facebook de Luxury Cedro Alto"><span className="facebook-mark" aria-hidden="true">f</span> <span>Luxury Cedro Alto Glamping</span></a></div></div><form className="contact-form" onSubmit={(event) => event.preventDefault()}><input type="text" placeholder="Nombre completo" aria-label="Nombre completo" /><input type="email" placeholder="Correo electrónico" aria-label="Correo electrónico" /><input type="tel" placeholder="Teléfono / WhatsApp" aria-label="Teléfono o WhatsApp" /><textarea placeholder="Mensaje" aria-label="Mensaje" rows={4} /><button type="submit" className="button button-dark">Enviar consulta <ArrowRight size={15} /></button></form></div><div className="footer-brand"><img src={logoUrl} alt="Cedro Alto" /><p>Cerca de la ciudad, lejos del mundo</p><small>© 2026 Cedro Alto. Todos los derechos reservados.</small></div></footer>
      <a className="floating-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={21} /><span>¿Preguntas? Chatea con nosotros</span></a>
    </main>
  )
}
