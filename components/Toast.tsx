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
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce w-[90vw] max-w-md">
            <div className="bg-gray-800 text-white px-10 py-4 rounded-full shadow-lg border-4 border-gray-700 text-center"
                style={{ boxShadow: '0 6px 0 #374151, 0 12px 20px rgba(0, 0, 0, 0.3)' }}>
                {message}
            </div>
        </div>
    )
}