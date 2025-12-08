// /lib/utils/api-client.ts

export class ApiClient {
    private static instance: ApiClient

    static getInstance(): ApiClient {
        if (!ApiClient.instance) {
            ApiClient.instance = new ApiClient()
        }
        return ApiClient.instance
    }

    private getToken(): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem('auth_token')
    }

    private setToken(token: string): void {
        if (typeof window === 'undefined') return
        localStorage.setItem('auth_token', token)
    }

    removeToken(): void {
        if (typeof window === 'undefined') return
        localStorage.removeItem('auth_token')
    }

    async authenticatedRequest(
        url: string,
        options: RequestInit = {}
    ): Promise<Response> {
        const token = this.getToken()

        if (!token) {
            throw new Error('No authentication token available')
        }

        const headers = new Headers(options.headers)
        headers.set('Authorization', `Bearer ${token}`)

        return fetch(url, {
            ...options,
            headers
        })
    }

    async get(url: string) {
        return this.authenticatedRequest(url, { method: 'GET' })
    }

    async post(url: string, body?: any) {
        return this.authenticatedRequest(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        })
    }

    async put(url: string, body?: any) {
        return this.authenticatedRequest(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        })
    }

    async delete(url: string, body?: any) {
        return this.authenticatedRequest(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        })
    }

    // Public request (no auth)
    async publicRequest(url: string, options: RequestInit = {}): Promise<Response> {
        return fetch(url, options)
    }
}

export const apiClient = ApiClient.getInstance()
