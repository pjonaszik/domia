// /lib/utils/format.ts
export function formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatDate(date: Date | string): string {
    const d = new Date(date)
    return d.toLocaleDateString()
}

export function formatTimeAgo(date: Date | string): string {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`

    return d.toLocaleDateString()
}