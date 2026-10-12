import type { SiteContent } from '@/lib/site-content'

export function isValidSiteContent(value: unknown): value is SiteContent {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const content = value as Record<string, unknown>
  const stringFields = [
    'businessName', 'logoUrl', 'heroImage', 'experienceImage', 'heroEyebrow', 'heroTitle', 'heroSubtitle',
    'experienceTitle', 'experienceDescription', 'whatsappPhone', 'contactEmail',
    'contactAddress', 'instagramUrl', 'facebookUrl', 'locationUrl', 'mapEmbedUrl',
    'breakfastTitle', 'breakfastDescription', 'breakfastImage',
  ]
  if (!stringFields.every((field) => typeof content[field] === 'string' && (content[field] as string).length <= 2000)) return false
  if (!['businessName', 'heroTitle', 'heroSubtitle', 'whatsappPhone', 'contactAddress'].every((field) => (content[field] as string).trim().length > 0)) return false
  if (content.contactEmail && (typeof content.contactEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.contactEmail))) return false
  if (!/^\d{8,15}$/.test(content.whatsappPhone as string)) return false
  const safeUrlFields = ['logoUrl', 'heroImage', 'experienceImage', 'instagramUrl', 'facebookUrl', 'locationUrl', 'mapEmbedUrl', 'breakfastImage']
  if (!safeUrlFields.every((field) => {
    const raw = content[field] as string
    if (!raw) return field === 'instagramUrl' || field === 'facebookUrl'
    try {
      return new URL(raw).protocol === 'https:'
    } catch {
      return false
    }
  })) return false
  if (!Array.isArray(content.plans) || content.plans.length < 1 || content.plans.length > 10) return false
  if (!content.plans.every((item) => {
    if (typeof item !== 'object' || item === null) return false
    const plan = item as Record<string, unknown>
    return typeof plan.name === 'string' && plan.name.trim().length > 0 && plan.name.length <= 80 &&
      typeof plan.eyebrow === 'string' && plan.eyebrow.length <= 120 &&
      typeof plan.price === 'number' && Number.isSafeInteger(plan.price) && plan.price > 0 &&
      typeof plan.unit === 'string' && plan.unit.length > 0 && plan.unit.length <= 60 &&
      typeof plan.description === 'string' && plan.description.length <= 500 &&
      typeof plan.featured === 'boolean' &&
      (plan.kind === 'day' || plan.kind === 'overnight')
  })) return false
  const planNames = (content.plans as Array<{ name: string }>).map((plan) => plan.name)
  if (new Set(planNames).size !== planNames.length) return false
  if (!Array.isArray(content.gallery) || content.gallery.length > 30) return false
  if (!content.gallery.every((item) => {
    if (typeof item !== 'object' || item === null) return false
    const image = item as Record<string, unknown>
    if (
      typeof image.title !== 'string' ||
      image.title.trim().length === 0 ||
      image.title.length > 100 ||
      typeof image.category !== 'string' ||
      image.category.trim().length === 0 ||
      image.category.length > 100 ||
      typeof image.image !== 'string' ||
      image.image.length > 2000
    ) return false
    try {
      return new URL(image.image).protocol === 'https:'
    } catch {
      return false
    }
  })) return false
  for (const field of ['amenities', 'policies', 'breakfasts'] as const) {
    const entries = content[field]
    if (!Array.isArray(entries) || entries.length > 20) return false
    if (!entries.every((item) => {
      if (typeof item !== 'object' || item === null) return false
      const record = item as Record<string, unknown>
      const hasTitleAndDescription = typeof record.title === 'string' && record.title.trim().length > 0 && record.title.length <= 120 &&
        typeof record.description === 'string' && record.description.length <= 1000
      return hasTitleAndDescription && (field !== 'amenities' || (
        typeof record.icon === 'string' &&
        ['BedDouble', 'Sparkles', 'Wifi', 'Home', 'Coffee', 'ShieldCheck'].includes(record.icon)
      ))
    })) return false
  }
  return true
}
