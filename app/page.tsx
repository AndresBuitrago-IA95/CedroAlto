'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  ArrowRight,
  BedDouble,
  Bird,
  CalendarDays,
  Car,
  ChevronLeft,
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
import { defaultSiteContent, type SiteContent } from '@/lib/site-content'
import { allGoogleReviewsUrl, guestReviews } from '@/lib/reviews'
import {
  areNightsAvailable,
  getBogotaToday,
  getMinReservationDate,
  getNightsBetween,
  hasAllowedPlanReservationNights,
  isPlanReservationDate,
  isWeekdayOnlyPlan,
  isWeekendOnlyPlan,
  planReservationError,
} from '@/lib/reservation-rules'

const amenityIcons = { BedDouble, Sparkles, Wifi, Home, Coffee, ShieldCheck }
function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function displayDate(date: string) {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00.000Z`))
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}

function amenityIcon(name: string) {
  switch (name) {
    case 'BedDouble': return BedDouble
    case 'Wifi': return Wifi
    case 'Home': return Home
    case 'Coffee': return Coffee
    case 'ShieldCheck': return ShieldCheck
    default: return Sparkles
  }
}

function SectionIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return <div className="section-intro"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{copy && <p>{copy}</p>}</div>
}

export default function Page() {
  const { data: remoteContent } = useSWR<SiteContent>('/api/site-content', async (url) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Site content is unavailable.')
    return response.json()
  }, { revalidateOnFocus: true })
  const content = remoteContent ?? defaultSiteContent
  const [menuOpen, setMenuOpen] = useState(false)
  const [filter, setFilter] = useState('Todo')
  const [openInfo, setOpenInfo] = useState(0)
  const [mapOpen, setMapOpen] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [arrivalDate, setArrivalDate] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [plan, setPlan] = useState(defaultSiteContent.plans[0].name)
  const [bookingError, setBookingError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const { data: availability, mutate: refreshAvailability, error: availabilityError } = useSWR<{ dates: string[] }>('/api/reservations', async (url) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Reservation availability is unavailable.')
    return response.json()
  }, { refreshInterval: 15000 })
  const unavailableDates = new Set(availability?.dates ?? [])
  const today = getBogotaToday()
  const minArrivalDate = getMinReservationDate()
  const firstWeekday = (calendarMonth.getDay() + 6) % 7
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()
  const calendarDays = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => index < firstWeekday ? null : dateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index - firstWeekday + 1)))
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${content.whatsappPhone}`
  const locationUrl = content.locationUrl
  const mapEmbedUrl = content.mapEmbedUrl
  const selectedPlan = content.plans.find((item) => item.name === plan) ?? content.plans[0]
  const weekdayOnly = isWeekdayOnlyPlan(selectedPlan)
  const weekendOnly = isWeekendOnlyPlan(selectedPlan)
  const dateRestrictedPlan = weekdayOnly || weekendOnly
  const selectedPlanDateError = planReservationError(selectedPlan)
  const filteredGallery = (filter === 'Todo' ? content.gallery : content.gallery.filter((item) => item.category === filter))
    .map((item) => item.title === 'Balcón con vista verde' && item.image.includes('qaGu')
      ? { ...item, image: defaultSiteContent.gallery.find((galleryItem) => galleryItem.title === item.title)?.image ?? item.image }
      : item)
  const filters = ['Todo', ...new Set(content.gallery.map((item) => item.category))]
  const [heroFirstLine, heroSecondLine] = content.heroTitle.split(', ', 2)

  return (
    <main>
      <header className="site-header">
        <a href="#inicio" className="brand"><img src={content.logoUrl} alt={content.businessName} /></a>
        <nav className={menuOpen ? 'main-nav open' : 'main-nav'} aria-label="Navegación principal">
          {['Experiencia', 'Galería', 'Qué incluye', 'Gastronomía', 'Tarifas', 'Ubicación', 'Información'].map((item) => <a key={item} href={`#${item.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setMenuOpen(false)}>{item}</a>)}
        </nav>
        <div className="header-actions"><a className="whatsapp-icon" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Escribir por WhatsApp"><MessageCircle size={18} /></a><a href={`${whatsappUrl}&text=${encodeURIComponent(`Hola ${content.businessName}, quiero reservar una estadía.`)}`} target="_blank" rel="noreferrer" className="button button-dark">Reservar ahora <ArrowRight size={15} /></a></div>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <section className="hero" id="inicio" style={{ backgroundImage: `url("${content.heroImage}")` }}>
        <div className="hero-overlay" />
        <div className="hero-content"><span className="pill pill-light">{content.heroEyebrow}</span><h1>{heroFirstLine}{heroSecondLine && <><br /><em>{heroSecondLine}</em></>}</h1><p>{content.heroSubtitle}</p><a href="#reservar" className="hero-link">Descubre la experiencia <ArrowRight size={16} /></a></div>
        <form className="booking-card" id="reservar" onSubmit={async (event) => {
          event.preventDefault()
          if (isSubmitting) return
          setBookingError('')
          const effectiveDepartureDate = selectedPlan.kind === 'day' && arrivalDate ? addDays(arrivalDate, 1) : departureDate
          if (!arrivalDate || !effectiveDepartureDate || effectiveDepartureDate <= arrivalDate) {
            setBookingError('Selecciona una fecha válida para tu plan.')
            return
          }
          if (arrivalDate < minArrivalDate) {
            setBookingError('Las reservas deben realizarse con al menos un día de anticipación (no es posible reservar para el mismo día).')
            return
          }
          if (!areNightsAvailable(arrivalDate, effectiveDepartureDate, unavailableDates)) {
            setBookingError('Una o más noches en el rango seleccionado ya están ocupadas. Elige otras fechas.')
            return
          }
          if (dateRestrictedPlan && !hasAllowedPlanReservationNights(selectedPlan, arrivalDate, effectiveDepartureDate)) {
            setBookingError(selectedPlanDateError)
            return
          }
          setIsSubmitting(true)
          try {
            const response = await fetch('/api/reservations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ arrivalDate, departureDate: effectiveDepartureDate, plan }),
            })
            const result = await response.json()
            if (!response.ok) {
              setBookingError(result.error ?? 'No fue posible registrar la solicitud.')
              await refreshAvailability()
              return
            }
            const nights = Math.round((Date.parse(`${effectiveDepartureDate}T00:00:00Z`) - Date.parse(`${arrivalDate}T00:00:00Z`)) / 86400000)
            const rate = selectedPlan.price
            const total = rate * (selectedPlan.kind === 'day' ? 1 : nights)
            const message = [
              'Hola Cedro Alto, quiero consultar disponibilidad y coordinar la reserva:',
              `Plan: ${selectedPlan.name}`,
              ...(selectedPlan.kind === 'day'
                ? [`Fecha del plan: ${displayDate(arrivalDate)}`, `Tipo: ${selectedPlan.eyebrow}`, selectedPlan.description]
                : [`Llegada: ${displayDate(arrivalDate)} (3:00 p. m.)`, `Salida: ${displayDate(effectiveDepartureDate)} (12:00 p. m.)`, `Noches: ${nights}`]),
              `Tarifa publicada: ${formatCOP(rate)} ${selectedPlan.unit}`,
              `Total según tarifa publicada: ${formatCOP(total)}`,
              `Anticipo del 50%: ${formatCOP(total / 2)}. Saldo al ingreso: ${formatCOP(total / 2)}.`,
              `Código de solicitud: ${result.reservationId}`,
              'Esta solicitud queda sujeta a confirmación y pago del anticipo con el equipo de Cedro Alto.',
              'Por favor, pulsa Enviar en WhatsApp para compartir estos datos con nosotros.',
            ].join('\n')
            window.location.assign(`${whatsappUrl}&text=${encodeURIComponent(message)}`)
          } catch (error) {
            console.error('Could not start the WhatsApp reservation flow:', error)
            setBookingError('No fue posible iniciar la reserva. Verifica tu conexión e inténtalo de nuevo.')
          } finally {
            setIsSubmitting(false)
          }
        }}>
          <div className="booking-field"><CalendarDays size={17} /><label>Llegada (desde 3:00 p. m.)<input type="date" aria-label="Fecha de llegada" min={minArrivalDate} value={arrivalDate} onChange={(event) => {
            const date = event.target.value
            setArrivalDate(date)
            setDepartureDate('')
            if (!date) {
              setBookingError('')
              return
            }
            if (date.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
              const year = Number(date.slice(0, 4))
              if (year >= 2024) {
                if (date < minArrivalDate) {
                  setBookingError('Las reservas deben realizarse con al menos un día de anticipación (no es posible reservar para el mismo día).')
                } else if (dateRestrictedPlan && !isPlanReservationDate(selectedPlan, date)) {
                  setBookingError(selectedPlanDateError)
                } else {
                  setBookingError('')
                }
              }
            } else {
              setBookingError('')
            }
          }} required /></label></div>
          {selectedPlan.kind !== 'day' && <div className="booking-field"><CalendarDays size={17} /><label>Salida (hasta 12:00 m.)<input type="date" aria-label="Fecha de salida" min={arrivalDate ? addDays(arrivalDate, 1) : addDays(minArrivalDate, 1)} value={departureDate} onChange={(event) => {
            const date = event.target.value
            setDepartureDate(date)
            if (!date) {
              setBookingError('')
              return
            }
            if (date.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
              const year = Number(date.slice(0, 4))
              if (year >= 2024) {
                if (arrivalDate && date <= arrivalDate) {
                  setBookingError('La fecha de salida debe ser posterior a la fecha de llegada.')
                } else if (arrivalDate && !areNightsAvailable(arrivalDate, date, unavailableDates)) {
                  setBookingError('Una o más noches en el rango seleccionado ya están ocupadas.')
                } else if (dateRestrictedPlan && arrivalDate && !hasAllowedPlanReservationNights(selectedPlan, arrivalDate, date)) {
                  setBookingError(selectedPlanDateError)
                } else {
                  setBookingError('')
                }
              }
            } else {
              setBookingError('')
            }
          }} required /></label></div>}
          <div className="booking-field"><Bird size={17} /><label>Plan<select aria-label="Plan de estadía" value={selectedPlan.name} onChange={(event) => {
            const nextPlan = content.plans.find((item) => item.name === event.target.value) ?? content.plans[0]
            setPlan(nextPlan.name)
            setDepartureDate('')
            setBookingError('')
            if (arrivalDate && (isWeekdayOnlyPlan(nextPlan) || isWeekendOnlyPlan(nextPlan)) && !isPlanReservationDate(nextPlan, arrivalDate)) setArrivalDate('')
          }}>{content.plans.map((item) => <option key={item.name}>{item.name}</option>)}</select></label></div>
          <button className="button button-dark booking-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Abriendo WhatsApp...' : 'Reservar por WhatsApp'} <ArrowRight size={15} /></button>
          {(availabilityError || bookingError) && <div className="booking-error" role="alert">
            <p>{bookingError || 'No fue posible consultar la disponibilidad en línea en este momento.'}</p>
            <a href={`${whatsappUrl}&text=${encodeURIComponent(`Hola ${content.businessName}, ¿me ayudan a confirmar disponibilidad para ${arrivalDate ? displayDate(arrivalDate) : 'la fecha que deseo'}?`)}`} target="_blank" rel="noreferrer">Confirmar disponibilidad por WhatsApp <ArrowRight size={14} /></a>
          </div>}
        </form>
      </section>

      <section className="experience section-shell" id="experiencia">
        <div className="experience-image image-card"><img src={content.experienceImage} alt={`Experiencia en ${content.businessName}`} /><span className="image-note">Una pausa que se queda contigo</span></div>
        <div className="experience-copy"><SectionIntro eyebrow="La experiencia" title={content.experienceTitle} copy={content.experienceDescription} /><div className="feature-list">{content.amenities.slice(0, 3).map((item, index) => <div key={item.title}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong></div>)}</div><a href="#qué-incluye" className="text-link">Conoce todas las comodidades <ArrowRight size={15} /></a></div>
      </section>

      <section className="gallery-section section-shell" id="galería"><SectionIntro eyebrow="Un lugar para mirar despacio" title="Momentos que se quedan" /><div className="filter-tabs">{filters.map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="gallery-grid">{filteredGallery.map((item, index) => <figure key={`${item.title}-${index}`} className={`gallery-item${index === 0 && filteredGallery.length > 3 ? ' large' : ''}${item.title === 'Detalle personalizado' ? ' personalized-detail' : ''}`}><img src={item.image} alt={item.title} /><figcaption><span>{item.category}</span><strong>{item.title}</strong></figcaption></figure>)}</div></section>

      <section className="amenities-section section-shell" id="qué-incluye"><SectionIntro eyebrow="Todo pensado para ti" title="Comodidades exclusivas incluidas en tu estadía" /><div className="amenities-grid">{content.amenities.map((item, index) => { const Icon = amenityIcon(item.icon); return <div className="amenity-card" key={`${item.title}-${index}`}><Icon size={24} strokeWidth={1.3} /><h3>{item.title}</h3><p>{item.description}</p></div> })}</div></section>

      <section className="food-section" id="gastronomía"><div className="section-shell"><SectionIntro eyebrow="Desayuno incluido" title={content.breakfastTitle} copy={content.breakfastDescription} /><div className="food-grid breakfast-grid">
        <figure className="food-photo-card"><img src={content.breakfastImage} alt="Desayuno servido con arepa, huevos, chorizo y fruta" /></figure>
        <article className="food-card"><div className="food-card-body"><span className="food-badge">Dos opciones para elegir</span>{content.breakfasts.map((item, index) => <div className="breakfast-option" key={`${item.title}-${index}`}><span className="breakfast-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{item.title}</h3><p>{item.description}</p></div></div>)}</div></article>
      </div></div></section>

      <section className="rates-section section-shell" id="tarifas">
        <SectionIntro eyebrow="Planifica tu pausa" title="Tarifas y disponibilidad" copy="Elige tus fechas y déjanos preparar una estadía inolvidable." />
        <div className="rates-layout">
          <div className="calendar-card">
            <div className="calendar-head">
              <button type="button" aria-label="Mes anterior" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}><ChevronRight className="rotate-180" size={17} /></button>
              <strong>{new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(calendarMonth)}</strong>
              <button type="button" aria-label="Mes siguiente" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}><ChevronRight size={17} /></button>
            </div>
            <div className="weekdays">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="calendar-grid">
              {calendarDays.map((date, index) => {
                if (!date) return <span key={`empty-${index}`} aria-hidden="true" />
                const isPast = date < minArrivalDate
                const isNightBusy = unavailableDates.has(date)
                const selected = date === arrivalDate || date === departureDate
                const inRange = Boolean(arrivalDate && departureDate && date > arrivalDate && date < departureDate)
                const selectingDeparture = Boolean(selectedPlan.kind !== 'day' && arrivalDate && !departureDate)
                const isPossibleDeparture = Boolean(
                  selectingDeparture &&
                  date > arrivalDate &&
                  areNightsAvailable(arrivalDate, date, unavailableDates) &&
                  (!dateRestrictedPlan || hasAllowedPlanReservationNights(selectedPlan, arrivalDate, date))
                )
                const isPlanRestricted = dateRestrictedPlan && (selectingDeparture ? !isPossibleDeparture : !isPlanReservationDate(selectedPlan, date))
                const isBusy = selectingDeparture ? !isPossibleDeparture : isNightBusy
                const isDisabled = isPast || (selectingDeparture ? !isPossibleDeparture : (isNightBusy || isPlanRestricted))

                return <button
                  key={date}
                  type="button"
                  className={`${isBusy || isPlanRestricted ? 'busy' : ''}${selected ? ' selected' : ''}${inRange ? ' in-range' : ''}${isPossibleDeparture ? ' departure-available' : ''}`}
                  disabled={isDisabled}
                  aria-label={`${isPlanRestricted ? 'No disponible para este plan' : isBusy ? 'Noche ocupada' : 'Disponible'}: ${displayDate(date)}${selected ? ', seleccionado' : ''}`}
                  onClick={() => {
                    if (selectedPlan.kind === 'day') {
                      if (isNightBusy) {
                        setBookingError('Esa fecha se encuentra ocupada.')
                        return
                      }
                      if (dateRestrictedPlan && !isPlanReservationDate(selectedPlan, date)) {
                        setBookingError(selectedPlanDateError)
                        return
                      }
                      setBookingError('')
                      setArrivalDate(date)
                      setDepartureDate('')
                    } else if (selectingDeparture) {
                      if (date <= arrivalDate) {
                        if (!isNightBusy && (!dateRestrictedPlan || isPlanReservationDate(selectedPlan, date))) {
                          setBookingError('')
                          setArrivalDate(date)
                          setDepartureDate('')
                        }
                        return
                      }
                      if (!areNightsAvailable(arrivalDate, date, unavailableDates)) {
                        setBookingError('Una o más noches intermedias no están disponibles.')
                        return
                      }
                      if (dateRestrictedPlan && !hasAllowedPlanReservationNights(selectedPlan, arrivalDate, date)) {
                        setBookingError(selectedPlanDateError)
                        return
                      }
                      setBookingError('')
                      setDepartureDate(date)
                    } else {
                      if (isNightBusy) {
                        setBookingError('Esa noche se encuentra ocupada.')
                        return
                      }
                      if (dateRestrictedPlan && !isPlanReservationDate(selectedPlan, date)) {
                        setBookingError(selectedPlanDateError)
                        return
                      }
                      setBookingError('')
                      setArrivalDate(date)
                      setDepartureDate('')
                    }
                  }}
                >{Number(date.slice(-2))}</button>
              })}
            </div>
            <div className="calendar-legend"><span><i className="available" />Disponible</span><span><i className="busy-dot" />Noche ocupada</span><span><i className="selected-dot" />Seleccionado</span></div>
            <p className="calendar-hint">{weekdayOnly ? 'Este plan solo está disponible de lunes a jueves (no aplica festivos). La salida puede ser viernes a las 12:00 m.' : weekendOnly ? 'Este plan aplica viernes, sábados, domingos y festivos de Colombia.' : selectedPlan.kind === 'day' ? `Selecciona la fecha de tu plan ${selectedPlan.name}.` : arrivalDate && !departureDate ? 'Ahora selecciona tu fecha de salida (Check-out 12:00 m.).' : 'Check-in: 3:00 p. m. · Check-out: 12:00 m. Solo se bloquea la noche; el día de salida queda libre al mediodía para otro ingreso. Reservas con al menos 1 día de anticipación.'}</p>
          </div>
          <div className="price-cards">
            {content.plans.map((item) => <article className={`price-card${item.featured ? ' featured' : ''}`} key={item.name}>
              {item.featured && <span className="popular">Experiencia destacada</span>}
              <span className="eyebrow">{item.eyebrow}</span>
              <h3>{item.name}</h3>
              <strong className="price">{formatCOP(item.price)} <small>COP / {item.unit.replace('por ', '')}</small></strong>
              <p className="price-note">{item.description}</p>
              <a className={`button ${item.featured ? 'button-light' : 'button-outline'}`} href="#reservar" onClick={() => {
                setPlan(item.name)
                setDepartureDate('')
                setBookingError('')
                if (arrivalDate && (isWeekdayOnlyPlan(item) || isWeekendOnlyPlan(item)) && !isPlanReservationDate(item, arrivalDate)) setArrivalDate('')
              }}>Seleccionar fechas <ArrowRight size={15} /></a>
            </article>)}
          </div>
        </div>
        <p className="payment-note">Garantiza tu estadía con un anticipo del 50%. El saldo se liquida al ingreso.</p>
      </section>

      <section className="location-section" id="ubicación"><div className="section-shell"><SectionIntro eyebrow="La ruta hacia tu refugio" title={`Cómo llegar a ${content.businessName}`} copy={content.contactAddress} /><div className="location-grid"><div className="map-card">{mapOpen ? <iframe className="map-embed" src={mapEmbedUrl} title={`Mapa de ubicación de ${content.businessName}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : <button className="map-art map-trigger" type="button" onClick={() => setMapOpen(true)} aria-label={`Abrir mapa con la ruta hacia ${content.businessName}`}><div className="map-pin"><MapPin size={24} /></div><span className="map-label">{content.businessName}</span><div className="map-road road-one" /><div className="map-road road-two" /><span className="map-open-label">Abrir mapa y ruta</span></button>}<div className="map-footer"><span><Navigation size={15} /> {content.contactAddress}</span><a href={locationUrl} target="_blank" rel="noreferrer">Abrir ruta en Google Maps <ArrowRight size={14} /></a></div></div><div className="location-facts"><div className="fact"><Mountain size={22} /><h3>Distancias clave</h3><p>A solo 8 minutos del parque principal de San Antonio de Prado.</p></div><div className="fact"><Car size={22} /><h3>Tipo de vehículo</h3><p>Vía pavimentada hasta el acceso. Apto para cualquier tipo de vehículo.</p></div><div className="fact"><Navigation size={22} /><h3>Navegación asistida</h3><div className="nav-buttons"><a href={locationUrl} target="_blank" rel="noreferrer">Google Maps <ArrowRight size={13} /></a><a href={`https://www.waze.com/ul?q=${encodeURIComponent(content.contactAddress)}`} target="_blank" rel="noreferrer">Waze <ArrowRight size={13} /></a></div></div></div></div></div></section>

      <section className="info-section section-shell" id="información"><div className="info-heading"><SectionIntro eyebrow="Antes de tu llegada" title="Información importante & normas del lugar" /></div><div className="accordion-list">{content.policies.map((policy, index) => <div className={`accordion ${openInfo === index ? 'open' : ''}`} key={`${policy.title}-${index}`}><button onClick={() => setOpenInfo(openInfo === index ? -1 : index)}><span>{policy.title}</span><ChevronDown size={18} /></button>{openInfo === index && <p>{policy.description}</p>}</div>)}</div></section>

      <section className="reviews-section">
        <div className="section-shell">
          <SectionIntro eyebrow="Palabras que inspiran" title="La experiencia de nuestros visitantes" />
          <div className="rating"><span>Opiniones de huéspedes</span><span className="stars" aria-label="Todas las reseñas tienen 5 de 5 estrellas">★★★★★</span><small>{guestReviews.length} experiencias compartidas</small></div>
          <div className="review-carousel" aria-live="polite">
            {(() => {
              const review = guestReviews[reviewIndex]
              return <blockquote className="review-slide" key={review.id}>
                <div className="quote-mark">“</div>
                <p>{review.text}</p>
                <footer><span>{review.author}</span><span className="stars" aria-label={`${review.rating} de 5 estrellas`}>{'★'.repeat(review.rating)}</span><small>{review.published}</small></footer>
              </blockquote>
            })()}
            <div className="review-controls">
              <button type="button" aria-label="Reseña anterior" onClick={() => setReviewIndex((index) => (index - 1 + guestReviews.length) % guestReviews.length)}><ChevronLeft size={18} /></button>
              <span>{reviewIndex + 1} / {guestReviews.length}</span>
              <button type="button" aria-label="Siguiente reseña" onClick={() => setReviewIndex((index) => (index + 1) % guestReviews.length)}><ChevronRight size={18} /></button>
            </div>
          </div>
          <a className="text-link reviews-more-link" href={allGoogleReviewsUrl} target="_blank" rel="noreferrer">Ver más opiniones en Google <ArrowRight size={15} /></a>
        </div>
      </section>

      <footer className="site-footer" id="contacto"><div className="section-shell footer-grid"><div className="contact-copy"><span className="eyebrow">Hablemos de tu escapada</span><h2>¿Listo para bajar el ritmo?</h2><p>Escríbenos y déjanos ayudarte a encontrar las fechas perfectas para tu refugio en la montaña.</p><a className="button button-dark" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos a WhatsApp <MessageCircle size={16} /></a>{content.contactEmail && <p><a href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a></p>}<div className="social-links"><a href={content.instagramUrl} target="_blank" rel="noreferrer" aria-label={`Instagram de ${content.businessName}`}><span className="instagram-mark" aria-hidden="true"><i /></span> <span>Instagram</span></a><a href={content.facebookUrl} target="_blank" rel="noreferrer" aria-label={`Facebook de ${content.businessName}`}><span className="facebook-mark" aria-hidden="true">f</span> <span>Facebook</span></a></div></div><form className="contact-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const message = [`Hola ${content.businessName}, quiero hacer una consulta.`, `Nombre: ${form.get('name')}`, `Correo: ${form.get('email')}`, `Teléfono: ${form.get('phone')}`, `Mensaje: ${form.get('message')}`].join('\n'); window.open(`${whatsappUrl}&text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer') }}><input name="name" type="text" placeholder="Nombre completo" aria-label="Nombre completo" required /><input name="email" type="email" placeholder="Correo electrónico" aria-label="Correo electrónico" /><input name="phone" type="tel" placeholder="Teléfono / WhatsApp" aria-label="Teléfono o WhatsApp" /><textarea name="message" placeholder="Mensaje" aria-label="Mensaje" rows={4} required /><button type="submit" className="button button-dark">Enviar consulta <ArrowRight size={15} /></button></form></div><div className="footer-brand"><img src={content.logoUrl} alt={content.businessName} /><p>{content.heroTitle}</p><small>© 2026 {content.businessName}. Todos los derechos reservados.</small></div></footer>
      <a className="floating-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={21} /><span>¿Preguntas? Chatea con nosotros</span></a>
    </main>
  )
}
