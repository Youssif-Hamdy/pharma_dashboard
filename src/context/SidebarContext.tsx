import { createContext, useContext } from 'react'

interface SidebarContextValue {
  openMobileSidebar: () => void
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined)

interface ProviderProps {
  openMobileSidebar: () => void
  children: React.ReactNode
}

export function SidebarProvider({ openMobileSidebar, children }: ProviderProps) {
  return (
    <SidebarContext.Provider value={{ openMobileSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  return ctx
}

