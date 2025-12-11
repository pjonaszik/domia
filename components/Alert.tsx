// /components/Alert.tsx

'use client'

interface AlertProps {
    message: string
    type?: 'error' | 'success' | 'info' | 'warning'
    onClose?: () => void
}

export function Alert({ message, type = 'error', onClose }: AlertProps) {
    if (!message) return null

    const bgColor = {
        error: 'bg-red-100 text-red-800 border-red-300',
        success: 'bg-green-100 text-green-800 border-green-300',
        info: 'bg-blue-100 text-blue-800 border-blue-300',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    }[type]

    return (
        <div className={`mb-4 p-3 ${bgColor} border-2 rounded-lg text-sm flex items-start justify-between`}>
            <span>{message}</span>
            {onClose && (
                <button
                    onClick={onClose}
                    className="ml-2 text-current opacity-70 hover:opacity-100"
                    aria-label="Fermer"
                >
                    <i className="fas fa-times" aria-hidden="true"></i>
                </button>
            )}
        </div>
    )
}

