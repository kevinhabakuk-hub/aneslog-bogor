import { BarChart3, ClipboardList, Moon, Settings, Sun } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PatientFormModal } from './components/PatientFormModal'
import { PatientReadModal } from './components/PatientReadModal'
import { RekapView } from './components/RekapView'
import { SettingsModal } from './components/SettingsModal'
import { ShiftHome } from './components/ShiftHome'
import { getTodayISO } from './lib/date'
import { exportPatientsCSV, exportStoreJSON, loadStore, saveStore } from './lib/storage'
import type { AnesLogStore, PatientRecord } from './types/aneslog'

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function App() {
  const [store, setStore] = useState<AnesLogStore>(() => loadStore())
  const [activeTab, setActiveTab] = useState<'today' | 'rekap'>('today')
  const [formOpen, setFormOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null)
  const [readingPatientId, setReadingPatientId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const todayISO = getTodayISO()

  useEffect(() => {
    saveStore(store)
  }, [store])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', store.theme)
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', store.theme === 'or-dark' ? '#000000' : '#F2F4F7')
    }
  }, [store.theme])

  const hospitalMap = useMemo(
    () => new Map(store.hospitals.map((h) => [h.id, h.name])),
    [store.hospitals]
  )

  const patientsToday = useMemo(() => {
    return store.patients
      .filter((p) => p.date === todayISO && p.hospitalId === store.activeHospitalId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [store.patients, todayISO, store.activeHospitalId])

  const readingPatient = useMemo(
    () => store.patients.find((p) => p.id === readingPatientId) ?? null,
    [store.patients, readingPatientId]
  )

  const handleToggleTheme = () => {
    setStore((prev) => ({
      ...prev,
      theme: prev.theme === 'clinical-bone' ? 'or-dark' : 'clinical-bone',
    }))
  }

  const handleSelectHospital = (hospitalId: string) => {
    setStore((prev) => ({ ...prev, activeHospitalId: hospitalId }))
  }

  const handleSavePatient = (
    data: Omit<PatientRecord, 'id' | 'createdAt' | 'updatedAt' | 'emrStatus'>
  ) => {
    const now = new Date().toISOString()
    if (editingPatient) {
      setStore((prev) => ({
        ...prev,
        activeHospitalId: data.hospitalId,
        patients: prev.patients.map((p) =>
          p.id === editingPatient.id ? { ...p, ...data, updatedAt: now } : p
        ),
      }))
      setEditingPatient(null)
      setFormOpen(false)
      return
    }

    const created: PatientRecord = {
      ...data,
      id: generateId(),
      emrStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    }
    setStore((prev) => ({
      ...prev,
      activeHospitalId: data.hospitalId,
      patients: [created, ...prev.patients],
    }))
    setFormOpen(false)
  }

  const handleToggleEmrStatus = (patientId: string) => {
    const now = new Date().toISOString()
    setStore((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id === patientId
          ? { ...p, emrStatus: p.emrStatus === 'done' ? 'pending' : 'done', updatedAt: now }
          : p
      ),
    }))
  }

  const handleDeletePatient = (patientId: string) => {
    setStore((prev) => ({
      ...prev,
      patients: prev.patients.filter((p) => p.id !== patientId),
    }))
    setReadingPatientId(null)
  }

  const handleAddHospital = (name: string) => {
    const id = `rs-${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${Date.now().toString(36).slice(-4)}`
    const shortName = name.replace(/^RS\s+/i, '').trim() || name
    setStore((prev) => ({
      ...prev,
      hospitals: [...prev.hospitals, { id, name, shortName }],
    }))
  }

  const handleDeleteHospital = (id: string) => {
    setStore((prev) => {
      if (prev.hospitals.length <= 1) return prev
      const nextHospitals = prev.hospitals.filter((h) => h.id !== id)
      return {
        ...prev,
        hospitals: nextHospitals,
        activeHospitalId:
          prev.activeHospitalId === id ? nextHospitals[0].id : prev.activeHospitalId,
      }
    })
  }

  return (
    <div className="min-h-dvh bg-base-100 text-base-content">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 border-b border-base-300/80 bg-base-200/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-base-content">AnesLog</h1>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary uppercase">
              Pre-Op
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label="Ganti mode terang/gelap"
              className="btn btn-sm btn-ghost h-9 w-9 rounded-full bg-base-100 p-0 hover:bg-base-300"
              title={store.theme === 'clinical-bone' ? 'Mode OR Gelap' : 'Mode One UI Terang'}
            >
              {store.theme === 'clinical-bone' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Pengaturan RS dan Backup"
              className="btn btn-sm btn-ghost h-9 w-9 rounded-full bg-base-100 p-0 hover:bg-base-300"
              title="Kelola RS & Backup"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-lg px-4 pt-4">
        {activeTab === 'today' ? (
          <ShiftHome
            todayISO={todayISO}
            hospitals={store.hospitals}
            activeHospitalId={store.activeHospitalId}
            patientsToday={patientsToday}
            onSelectHospital={handleSelectHospital}
            onOpenAdd={() => {
              setEditingPatient(null)
              setFormOpen(true)
            }}
            onOpenPatient={(p) => setReadingPatientId(p.id)}
          />
        ) : (
          <RekapView
            hospitals={store.hospitals}
            patients={store.patients}
            onOpenPatient={(p) => setReadingPatientId(p.id)}
          />
        )}
      </main>

      {/* Bottom 2-Tab Navigation (One UI Tactile) */}
      <nav
        aria-label="Navigasi Utama"
        className="fixed right-0 bottom-0 left-0 z-30 border-t border-base-300/80 bg-base-200/95 backdrop-blur-md"
      >
        <div className="mx-auto grid max-w-lg grid-cols-2 gap-2 px-4 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`flex h-11 items-center justify-center gap-2 rounded-full text-xs font-bold transition-colors ${
              activeTab === 'today'
                ? 'bg-primary/12 text-primary'
                : 'text-secondary hover:bg-base-100 hover:text-base-content'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rekap')}
            className={`flex h-11 items-center justify-center gap-2 rounded-full text-xs font-bold transition-colors ${
              activeTab === 'rekap'
                ? 'bg-primary/12 text-primary'
                : 'text-secondary hover:bg-base-100 hover:text-base-content'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Rekap
          </button>
        </div>
      </nav>

      {/* Modals */}
      {formOpen && (
        <PatientFormModal
          hospitals={store.hospitals}
          defaultHospitalId={store.activeHospitalId}
          defaultDate={todayISO}
          initialPatient={editingPatient}
          onClose={() => {
            setFormOpen(false)
            setEditingPatient(null)
          }}
          onSave={handleSavePatient}
        />
      )}

      {readingPatient && (
        <PatientReadModal
          patient={readingPatient}
          hospitalName={hospitalMap.get(readingPatient.hospitalId) ?? readingPatient.hospitalId}
          onClose={() => setReadingPatientId(null)}
          onEdit={() => {
            setEditingPatient(readingPatient)
            setReadingPatientId(null)
            setFormOpen(true)
          }}
          onToggleEmrStatus={() => handleToggleEmrStatus(readingPatient.id)}
          onDelete={() => handleDeletePatient(readingPatient.id)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          hospitals={store.hospitals}
          patientCount={store.patients.length}
          onClose={() => setSettingsOpen(false)}
          onAddHospital={handleAddHospital}
          onDeleteHospital={handleDeleteHospital}
          onExportCSV={() => exportPatientsCSV(store.patients, store.hospitals)}
          onExportJSON={() => exportStoreJSON(store)}
        />
      )}
    </div>
  )
}

export default App
