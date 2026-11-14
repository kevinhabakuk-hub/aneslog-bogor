import { z } from 'zod'

export const ASAClassSchema = z.enum(['I', 'II', 'III', 'IV', 'V'])
export type ASAClass = z.infer<typeof ASAClassSchema>

export const MallampatiSchema = z.enum(['I', 'II', 'III', 'IV'])
export type MallampatiClass = z.infer<typeof MallampatiSchema>

export const AnesthesiaPlanSchema = z.enum(['GA', 'Spinal', 'Epidural', 'Blok/Sedasi', 'Lainnya'])
export type AnesthesiaPlan = z.infer<typeof AnesthesiaPlanSchema>

export const EMRStatusSchema = z.enum(['pending', 'done'])
export type EMRStatus = z.infer<typeof EMRStatusSchema>

export const ThemeModeSchema = z.enum(['clinical-bone', 'or-dark'])
export type ThemeMode = z.infer<typeof ThemeModeSchema>

export const HospitalSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
})
export type Hospital = z.infer<typeof HospitalSchema>

export const PatientRecordSchema = z.object({
  id: z.string().min(1),
  hospitalId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fullName: z.string().min(1),
  rmNumber: z.string(),
  age: z.string(),
  weightKg: z.string(),
  diagnosisProcedure: z.string(),
  comorbidities: z.array(z.string()),
  otherComorbidity: z.string(),
  hasAllergy: z.boolean(),
  allergyNote: z.string(),
  medications: z.string(),
  asaClass: ASAClassSchema,
  isEmergency: z.boolean(),
  mallampati: MallampatiSchema,
  npoHours: z.string(),
  anesthesiaPlan: AnesthesiaPlanSchema,
  notes: z.string(),
  emrStatus: EMRStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type PatientRecord = z.infer<typeof PatientRecordSchema>

export const AnesLogStoreSchema = z.object({
  hospitals: z.array(HospitalSchema).min(1),
  patients: z.array(PatientRecordSchema),
  activeHospitalId: z.string().min(1),
  theme: ThemeModeSchema,
})
export type AnesLogStore = z.infer<typeof AnesLogStoreSchema>

export const COMORBIDITY_OPTIONS = [
  'Tidak Ada',
  'HT',
  'DM',
  'Asma/PPOK',
  'Jantung',
  'Ginjal',
  'Stroke/Neuro',
] as const

export const ASA_OPTIONS: ASAClass[] = ['I', 'II', 'III', 'IV', 'V']
export const MALLAMPATI_OPTIONS: MallampatiClass[] = ['I', 'II', 'III', 'IV']
export const ANESTHESIA_PLANS: AnesthesiaPlan[] = ['GA', 'Spinal', 'Epidural', 'Blok/Sedasi', 'Lainnya']
