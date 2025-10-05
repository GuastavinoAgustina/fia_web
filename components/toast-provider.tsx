// components/toast-provider.tsx
"use client"

import { createContext, useContext, useState, ReactNode } from "react"

type Toast = { id: number; message: string }

const ToastContext = createContext<any>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000) // 3 segundos
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2"> {/* Cambiado left-4 por right-4 */}
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
