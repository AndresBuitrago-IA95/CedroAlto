'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Check, ImagePlus, LogOut, Plus, Save, Trash2 } from 'lucide-react'
import {
  defaultSiteContent,
  type EditableAmenity,
  type EditableBreakfast,
  type EditableGalleryItem,
  type EditablePlan,
  type EditablePolicy,
  type SiteContent,
} from '@/lib/site-content'

type Reservation = {
  id: string
  arrivalDate: string
  departureDate: string
  plan: string
  status: string
  expiresAt: string | null
  createdAt: string
}

type Tab = 'content' | 'reservations' | 'availability'

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const body = await response.json()
  if (!response.ok) throw new Error(body.error ?? 'No fue posible completar la solicitud.')
  return body as T
}

function TextField({ label, value, onChange, type = 'text', hint }: {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: string
  hint?: string
}) {
  return <label className="admin-field"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} />{hint && <small>{hint}</small>}</label>
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="admin-field"><span>{label}</span><textarea value={value} rows={3} onChange={(event) => onChange(event.target.value)} /></label>
}

function ImageField({ label, value, onChange, onUpload, uploading }: {
  label: string
  value: string
  onChange: (value: string) => void
  onUpload: (file: File) => Promise<void>
  uploading: boolean
}) {
  return <div className="admin-image-field">
    <TextField label={label} value={value} onChange={onChange} />
    {value && <img src={value} alt={`Vista previa: ${label}`} />}
    <label className="admin-upload"><ImagePlus size={15} />{uploading ? 'Cargando imagen…' : 'Subir imagen (máximo 5 MB)'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event) => {
      const file = event.target.files?.[0]
      if (file) void onUpload(file)
      event.currentTarget.value = ''
    }} /></label>
  </div>
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [loginError, setLoginError] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState<Tab>('content')
  const [content, setContent] = useState<SiteContent>(defaultSiteContent)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')
  const [blockReason, setBlockReason] = useState('')

  async function loadDashboard() {
    const [nextContent, result] = await Promise.all([
      requestJson<SiteContent>('/api/admin/content'),
      requestJson<{ reservations: Reservation[] }>('/api/admin/reservations'),
    ])
    setContent(nextContent)
    setReservations(result.reservations)
  }

  useEffect(() => {
    let active = true
    void requestJson<{ authenticated: boolean }>('/api/admin/session')
      .then(async ({ authenticated: valid }) => {
        if (!active) return
        setAuthenticated(valid)
        if (valid) await loadDashboard()
      })
      .catch((error: unknown) => {
        if (active) setPageError(error instanceof Error ? error.message : 'No fue posible verificar la sesión.')
      })
      .finally(() => {
        if (active) setCheckingSession(false)
      })
    return () => { active = false }
  }, [])

  async function logIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginError('')
    setPageError('')
    try {
      await requestJson('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      setAuthenticated(true)
      setPassword('')
      await loadDashboard()
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'No fue posible iniciar sesión.')
    }
  }

  async function logOut() {
    try {
      await requestJson('/api/admin/session', { method: 'DELETE' })
      setAuthenticated(false)
      setUsername('')
      setPassword('')
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'No fue posible cerrar sesión.')
    }
  }

  function update<K extends keyof SiteContent>(field: K, value: SiteContent[K]) {
    setContent((current) => ({ ...current, [field]: value }))
  }

  async function uploadImage(file: File): Promise<string> {
    const data = new FormData()
    data.set('file', file)
    const result = await requestJson<{ url: string }>('/api/admin/images', { method: 'POST', body: data })
    return result.url
  }

  async function saveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setPageError('')
    setNotice('')
    try {
      await requestJson('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
      setNotice('Información guardada. Los cambios ya se reflejan en el sitio.')
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'No fue posible guardar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(file: File, done: (url: string) => void) {
    setUploading(true)
    setPageError('')
    try {
      done(await uploadImage(file))
      setNotice('Imagen cargada. Guarda los cambios para publicarla.')
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'No fue posible cargar la imagen.')
    } finally {
      setUploading(false)
    }
  }

  async function blockDates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPageError('')
    setNotice('')
    try {
      await requestJson('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: blockStart, endDate: blockEnd || blockStart, reason: blockReason }),
      })
      setNotice('Disponibilidad actualizada; las fechas seleccionadas ya no se pueden reservar.')
      setBlockStart('')
      setBlockEnd('')
      setBlockReason('')
      await loadDashboard()
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'No fue posible actualizar la disponibilidad.')
    }
  }

  async function updateReservation(id: string, action: 'confirm' | 'remove') {
    setPageError('')
    setNotice('')
    try {
      if (action === 'confirm') {
        await requestJson('/api/admin/reservations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'confirmed' }),
        })
        setNotice('Reserva confirmada; las fechas siguen ocupadas.')
      } else {
        await requestJson('/api/admin/reservations', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
        setNotice('Reserva cancelada y fechas liberadas.')
      }
      await loadDashboard()
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'No fue posible actualizar la reserva.')
    }
  }

  if (checkingSession) return <main className="admin-screen"><p>Verificando acceso…</p></main>

  if (!authenticated) return <main className="admin-screen">
    <form className="admin-login" onSubmit={logIn}>
      <a className="admin-back" href="/"><ArrowLeft size={16} /> Volver al sitio</a>
      <span className="eyebrow">Acceso privado</span>
      <h1>Administración</h1>
      <p>Gestiona la información, las reservas y la disponibilidad de Cedro Alto.</p>
      <TextField label="Usuario" value={username} onChange={setUsername} />
      <TextField label="Contraseña" value={password} type="password" onChange={setPassword} />
      {loginError && <p className="admin-error" role="alert">{loginError}</p>}
      {pageError && <p className="admin-error" role="alert">{pageError}</p>}
      <button className="button button-dark" type="submit">Iniciar sesión</button>
    </form>
  </main>

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'content', label: 'Contenido del sitio' },
    { id: 'reservations', label: 'Reservas' },
    { id: 'availability', label: 'Disponibilidad' },
  ]
  const activeReservations = reservations.filter((item) => item.status === 'confirmed' || item.status === 'blocked' || item.status === 'pending')
  const normalReservations = activeReservations.filter((item) => !item.plan.startsWith('Bloqueo manual'))
  const manualBlocks = activeReservations.filter((item) => item.plan.startsWith('Bloqueo manual'))

  return <main className="admin-screen admin-dashboard">
    <header className="admin-header">
      <div><span className="eyebrow">Panel privado</span><h1>{content.businessName}</h1></div>
      <div className="admin-header-actions"><a className="admin-back" href="/"><ArrowLeft size={16} /> Ver sitio</a><button className="admin-secondary" onClick={() => void logOut()}><LogOut size={15} /> Cerrar sesión</button></div>
    </header>
    <nav className="admin-tabs" aria-label="Secciones administrativas">
      {tabs.map((item) => <button className={tab === item.id ? 'active' : ''} key={item.id} onClick={() => { setTab(item.id); setPageError(''); setNotice('') }}>{item.label}</button>)}
    </nav>
    {pageError && <p className="admin-banner error" role="alert">{pageError}</p>}
    {notice && <p className="admin-banner success" role="status">{notice}</p>}

    {tab === 'content' && <form className="admin-content-form" onSubmit={saveContent}>
      <fieldset className="admin-form-fieldset" disabled={saving || uploading}>
      <section className="admin-panel">
        <h2>Marca y portada</h2>
        <div className="admin-form-grid">
          <TextField label="Nombre del glamping" value={content.businessName} onChange={(value) => update('businessName', value)} />
          <TextField label="Texto pequeño de portada" value={content.heroEyebrow} onChange={(value) => update('heroEyebrow', value)} />
          <TextField label="Título principal (usa coma para separar renglones)" value={content.heroTitle} onChange={(value) => update('heroTitle', value)} />
          <TextAreaField label="Descripción de portada" value={content.heroSubtitle} onChange={(value) => update('heroSubtitle', value)} />
          <TextField label="Título de experiencia" value={content.experienceTitle} onChange={(value) => update('experienceTitle', value)} />
          <TextAreaField label="Descripción de experiencia" value={content.experienceDescription} onChange={(value) => update('experienceDescription', value)} />
        </div>
        <div className="admin-form-grid admin-image-grid">
          <ImageField label="Logo (URL segura HTTPS)" value={content.logoUrl} onChange={(value) => update('logoUrl', value)} onUpload={(file) => handleImageUpload(file, (url) => update('logoUrl', url))} uploading={uploading} />
          <ImageField label="Imagen de portada (URL segura HTTPS)" value={content.heroImage} onChange={(value) => update('heroImage', value)} onUpload={(file) => handleImageUpload(file, (url) => update('heroImage', url))} uploading={uploading} />
          <ImageField label="Imagen de experiencia" value={content.experienceImage} onChange={(value) => update('experienceImage', value)} onUpload={(file) => handleImageUpload(file, (url) => update('experienceImage', url))} uploading={uploading} />
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-section-heading"><div><h2>Planes y precios</h2><p>Los precios actualizan automáticamente el cálculo que recibe el cliente por WhatsApp.</p></div><button className="admin-secondary" type="button" onClick={() => update('plans', [...content.plans, { name: 'Nuevo plan', eyebrow: '', price: 0, unit: 'por noche', description: '', featured: false, kind: 'overnight' }])}><Plus size={15} /> Agregar plan</button></div>
        {content.plans.map((item, index) => <div className="admin-repeat-card" key={`plan-${index}`}>
          <div className="admin-section-heading"><h3>Plan {index + 1}</h3><button className="admin-icon-button danger" type="button" aria-label="Eliminar plan" disabled={content.plans.length <= 1} onClick={() => update('plans', content.plans.filter((_, row) => row !== index))}><Trash2 size={16} /></button></div>
          <div className="admin-form-grid">
            <TextField label="Nombre del plan" value={item.name} onChange={(value) => update('plans', content.plans.map((row, i) => i === index ? { ...row, name: value } : row))} />
            <TextField label="Descripción corta" value={item.eyebrow} onChange={(value) => update('plans', content.plans.map((row, i) => i === index ? { ...row, eyebrow: value } : row))} />
            <TextField label="Precio en COP" type="number" value={item.price} onChange={(value) => update('plans', content.plans.map((row, i) => i === index ? { ...row, price: Number(value) } : row))} />
            <TextField label="Unidad (por noche, por pasadía...)" value={item.unit} onChange={(value) => update('plans', content.plans.map((row, i) => i === index ? { ...row, unit: value } : row))} />
            <TextAreaField label="Detalles del plan" value={item.description} onChange={(value) => update('plans', content.plans.map((row, i) => i === index ? { ...row, description: value } : row))} />
            <label className="admin-field"><span>Tipo de estadía</span><select value={item.kind} onChange={(event) => update('plans', content.plans.map((row, i) => i === index ? { ...row, kind: event.target.value as EditablePlan['kind'] } : row))}><option value="overnight">Hospedaje por noches</option><option value="day">Pasadía (un día)</option></select></label>
            <label className="admin-checkbox"><input type="checkbox" checked={item.featured} onChange={(event) => update('plans', content.plans.map((row, i) => i === index ? { ...row, featured: event.target.checked } : row))} /> Destacar este plan</label>
          </div>
        </div>)}
      </section>

      <section className="admin-panel">
        <div className="admin-section-heading"><div><h2>Galería de imágenes</h2><p>Solo se aceptan imágenes con URL HTTPS.</p></div><button className="admin-secondary" type="button" onClick={() => update('gallery', [...content.gallery, { title: 'Nueva imagen', category: 'Habitación', image: '' }])}><Plus size={15} /> Agregar imagen</button></div>
        <div className="admin-gallery-list">{content.gallery.map((item, index) => <div className="admin-repeat-card" key={`gallery-${index}`}>
          <div className="admin-section-heading"><h3>Imagen {index + 1}</h3><button className="admin-icon-button danger" type="button" aria-label="Eliminar imagen" onClick={() => update('gallery', content.gallery.filter((_, row) => row !== index))}><Trash2 size={16} /></button></div>
          <div className="admin-form-grid">
            <TextField label="Título" value={item.title} onChange={(value) => update('gallery', content.gallery.map((row, i) => i === index ? { ...row, title: value } : row))} />
            <TextField label="Categoría" value={item.category} onChange={(value) => update('gallery', content.gallery.map((row, i) => i === index ? { ...row, category: value } : row))} />
            <ImageField label="Imagen" value={item.image} onChange={(value) => update('gallery', content.gallery.map((row, i) => i === index ? { ...row, image: value } : row))} onUpload={(file) => handleImageUpload(file, (url) => update('gallery', content.gallery.map((row, i) => i === index ? { ...row, image: url } : row)))} uploading={uploading} />
          </div>
        </div>)}</div>
      </section>

      <section className="admin-panel">
        <div className="admin-section-heading"><div><h2>Comodidades</h2><p>Aparecen en la descripción de la experiencia y en la sección de servicios.</p></div><button className="admin-secondary" type="button" onClick={() => update('amenities', [...content.amenities, { icon: 'Sparkles', title: 'Nueva comodidad', description: '' }])}><Plus size={15} /> Agregar</button></div>
        {content.amenities.map((item, index) => <EditableRow<EditableAmenity> key={`amenity-${index}`} title={`Comodidad ${index + 1}`} item={item} onChange={(next) => update('amenities', content.amenities.map((row, i) => i === index ? next : row))} onRemove={() => update('amenities', content.amenities.filter((_, row) => row !== index))} extra={<label className="admin-field"><span>Ícono</span><select value={item.icon} onChange={(event) => update('amenities', content.amenities.map((row, i) => i === index ? { ...row, icon: event.target.value } : row))}>{['BedDouble', 'Sparkles', 'Wifi', 'Home', 'Coffee', 'ShieldCheck'].map((icon) => <option key={icon}>{icon}</option>)}</select></label>} />)}
      </section>

      <section className="admin-panel">
        <h2>Desayunos</h2>
        <div className="admin-form-grid">
          <TextField label="Título de sección" value={content.breakfastTitle} onChange={(value) => update('breakfastTitle', value)} />
          <TextAreaField label="Descripción" value={content.breakfastDescription} onChange={(value) => update('breakfastDescription', value)} />
          <ImageField label="Imagen del desayuno" value={content.breakfastImage} onChange={(value) => update('breakfastImage', value)} onUpload={(file) => handleImageUpload(file, (url) => update('breakfastImage', url))} uploading={uploading} />
        </div>
        <div className="admin-section-heading"><h3>Opciones incluidas</h3><button className="admin-secondary" type="button" onClick={() => update('breakfasts', [...content.breakfasts, { title: 'Nuevo desayuno', description: '' }])}><Plus size={15} /> Agregar</button></div>
        {content.breakfasts.map((item, index) => <EditableRow<EditableBreakfast> key={`breakfast-${index}`} title={`Opción ${index + 1}`} item={item} onChange={(next) => update('breakfasts', content.breakfasts.map((row, i) => i === index ? next : row))} onRemove={() => update('breakfasts', content.breakfasts.filter((_, row) => row !== index))} />)}
      </section>

      <section className="admin-panel">
        <div className="admin-section-heading"><div><h2>Reglas e información</h2><p>Normas, políticas de pago y demás datos para huéspedes.</p></div><button className="admin-secondary" type="button" onClick={() => update('policies', [...content.policies, { title: 'Nueva política', description: '' }])}><Plus size={15} /> Agregar</button></div>
        {content.policies.map((item, index) => <EditableRow<EditablePolicy> key={`policy-${index}`} title={`Información ${index + 1}`} item={item} onChange={(next) => update('policies', content.policies.map((row, i) => i === index ? next : row))} onRemove={() => update('policies', content.policies.filter((_, row) => row !== index))} />)}
      </section>

      <section className="admin-panel">
        <h2>Contacto y ubicación</h2>
        <div className="admin-form-grid">
          <TextField label="WhatsApp (código país + número, solo dígitos)" value={content.whatsappPhone} onChange={(value) => update('whatsappPhone', value.replace(/\D/g, ''))} />
          <TextField label="Correo de contacto" value={content.contactEmail} type="email" onChange={(value) => update('contactEmail', value)} />
          <TextField label="Dirección visible" value={content.contactAddress} onChange={(value) => update('contactAddress', value)} />
          <TextField label="Enlace de Instagram (HTTPS)" value={content.instagramUrl} onChange={(value) => update('instagramUrl', value)} />
          <TextField label="Enlace de Facebook (HTTPS)" value={content.facebookUrl} onChange={(value) => update('facebookUrl', value)} />
          <TextField label="Enlace de Google Maps (HTTPS)" value={content.locationUrl} onChange={(value) => update('locationUrl', value)} />
          <TextField label="URL de mapa embebido (HTTPS)" value={content.mapEmbedUrl} onChange={(value) => update('mapEmbedUrl', value)} />
        </div>
      </section>
      </fieldset>
      <div className="admin-save-bar"><button className="button button-dark" type="submit" disabled={saving || uploading}><Save size={16} /> {saving ? 'Guardando…' : 'Guardar y publicar cambios'}</button></div>
    </form>}

    {tab === 'reservations' && <section className="admin-panel admin-data-panel">
      <div className="admin-section-heading"><div><h2>Reservas y solicitudes</h2><p>Al abrir WhatsApp, la solicitud bloquea las fechas. Confirma para mantener la reserva o cancélala para liberar el calendario.</p></div><button className="admin-secondary" onClick={() => void loadDashboard()}>Actualizar</button></div>
      {normalReservations.length === 0 ? <p>No hay reservas ni solicitudes activas.</p> : <div className="admin-record-list">{normalReservations.map((reservation) => <article className="admin-record" key={reservation.id}>
        <div><strong>{reservation.plan}</strong><p>{reservation.arrivalDate} a {reservation.departureDate}</p><small>{reservation.status === 'pending' ? 'Pendiente de confirmación — fechas bloqueadas hasta que confirmes o canceles.' : 'Confirmada — fechas bloqueadas.'}</small><small>Código: {reservation.id}</small></div>
        <div className="admin-record-actions">{reservation.status === 'pending' && <button className="admin-confirm" onClick={() => void updateReservation(reservation.id, 'confirm')}><Check size={15} /> Confirmar</button>}<button className="admin-icon-button danger" aria-label="Cancelar reserva y liberar fechas" title="Cancelar reserva y liberar fechas" onClick={() => void updateReservation(reservation.id, 'remove')}><Trash2 size={16} /></button></div>
      </article>)}</div>}
    </section>}

    {tab === 'availability' && <section className="admin-panel admin-data-panel">
      <div className="admin-section-heading"><div><h2>Administrar disponibilidad</h2><p>Bloquea rangos por mantenimiento, uso privado u otras reservas externas. La fecha final también queda bloqueada.</p></div><button className="admin-secondary" onClick={() => void loadDashboard()}>Actualizar</button></div>
      <form className="admin-form-grid admin-block-form" onSubmit={blockDates}>
        <TextField label="Desde" type="date" value={blockStart} onChange={setBlockStart} />
        <TextField label="Hasta (incluido)" type="date" value={blockEnd} onChange={setBlockEnd} />
        <TextField label="Motivo (opcional)" value={blockReason} onChange={setBlockReason} />
        <button className="button button-dark" type="submit">Bloquear fechas</button>
      </form>
      <h3>Bloqueos manuales</h3>
      {manualBlocks.length === 0 ? <p>No hay bloqueos manuales.</p> : <div className="admin-record-list">{manualBlocks.map((reservation) => <article className="admin-record" key={reservation.id}>
        <div><strong>{reservation.plan}</strong><p>{reservation.arrivalDate}{reservation.departureDate > reservation.arrivalDate ? ` a ${new Date(`${reservation.departureDate}T00:00:00Z`).toLocaleDateString('es-CO', { timeZone: 'UTC' })}` : ''}</p></div>
        <button className="admin-icon-button danger" aria-label="Liberar rango de fechas" title="Liberar rango de fechas" onClick={() => void updateReservation(reservation.id, 'remove')}><Trash2 size={16} /></button>
      </article>)}</div>}
      <h3>Reservas que ocupan fechas</h3>
      {normalReservations.length === 0 ? <p>No hay solicitudes activas.</p> : <ul className="admin-date-list">{normalReservations.map((item) => <li key={item.id}><strong>{item.arrivalDate}</strong> a <strong>{item.departureDate}</strong> · {item.plan} — {item.status === 'pending' ? 'pendiente de confirmar' : 'confirmada'}</li>)}</ul>}
    </section>}
  </main>
}

function EditableRow<T extends { title: string; description: string }>({ title, item, onChange, onRemove, extra }: {
  title: string
  item: T
  onChange: (next: T) => void
  onRemove: () => void
  extra?: ReactNode
}) {
  return <div className="admin-repeat-card">
    <div className="admin-section-heading"><h3>{title}</h3><button className="admin-icon-button danger" type="button" aria-label={`Eliminar ${title}`} onClick={onRemove}><Trash2 size={16} /></button></div>
    <div className="admin-form-grid">
      <TextField label="Título" value={item.title} onChange={(value) => onChange({ ...item, title: value })} />
      <TextAreaField label="Descripción" value={item.description} onChange={(value) => onChange({ ...item, description: value })} />
      {extra}
    </div>
  </div>
}
