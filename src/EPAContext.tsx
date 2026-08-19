import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { loadReferenceData, loadClientData, type EPAData } from '@/utils/dataLoader'

interface EPAContextValue {
  data: EPAData | null
  loading: boolean
  error: string | null
  selectedIndustry: string
  selectedArchetype: string
  selectedJurisdiction: string
  clientId: string | null
  setSelectedIndustry: (id: string) => void
  setSelectedArchetype: (id: string) => void
  setSelectedJurisdiction: (id: string) => void
  setClientId: (id: string | null) => void
}

const EPAContext = createContext<EPAContextValue | null>(null)

export function EPAProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<EPAData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndustry, setSelectedIndustry] = useState('financial-services')
  const [selectedArchetype, setSelectedArchetype] = useState('all')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('all')
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const loader = clientId
      ? loadClientData(clientId)
      : loadReferenceData()

    loader
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [clientId])

  return (
    <EPAContext.Provider value={{
      data, loading, error,
      selectedIndustry, selectedArchetype, selectedJurisdiction, clientId,
      setSelectedIndustry, setSelectedArchetype, setSelectedJurisdiction, setClientId,
    }}>
      {children}
    </EPAContext.Provider>
  )
}

export function useEPA() {
  const ctx = useContext(EPAContext)
  if (!ctx) throw new Error('useEPA must be used within EPAProvider')
  return ctx
}
