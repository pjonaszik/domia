// /components/Toast.tsx


'use client'

import { useEffect } from 'react'

interface ToastProps {
    message: string
    show: boolean
    onHide: () => void
}

export function Toast({ message, show, onHide }: ToastProps) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onHide()
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [show, onHide])

    if (!show) return null

    return (
        <div 
            className="fixed z-[9999] pointer-events-none"
            style={{
                top: 'calc(90px + env(safe-area-inset-top))',
                left: '1rem',
                right: '1rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
            }}
        >
            <div 
                className="bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg border-2 border-gray-700 text-center animate-slide-down pointer-events-auto"
                style={{ 
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                    maxWidth: '28rem',
                    width: '100%',
                }}
            >
                {message}
            </div>
        </div>
    )
}