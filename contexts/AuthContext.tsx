// /contexts/AuthContext.tsx
// Authentication context for managing user state across the app

'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { User } from '@/lib/db/schema'
import { apiClient } from '@/lib/utils/api-client'

interface AuthContextType {
    user: User | null
    loading: boolean
    error: string | null
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, firstName?: string, lastName?: string, profession?: string, businessId?: string, phone?: string, country?: string) => Promise<void>
    logout: () => void
    refreshUser: () => Promise<void>
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const isInitializedRef = useRef(false)

    // Store token
    const storeToken = useCallback((token: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token)
        }
    }, [])

    // Remove token
    const removeToken = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
        }
        apiClient.removeToken()
    }, [])

    // Refresh user data from server
    const refreshUser = useCallback(async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
            if (!token) {
                setUser(null)
                setLoading(false)
                return
            }

            const response = await apiClient.get('/api/users/me')
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token invalid, clear it
                    removeToken()
                    setError('Session expired. Please login again.')
                    setUser(null)
                } else {
                    setError(`Failed to fetch user: ${response.status}`)
                }
                setLoading(false)
                return
            }

            const data = await response.json()
            if (data.user) {
                setUser(data.user)
                setError(null)
            } else {
                setError('Invalid user data received')
                setUser(null)
            }
        } catch (err) {
            console.error('Error refreshing user:', err)
            setError(err instanceof Error ? err.message : 'Failed to refresh user data')
            setUser(null)
        } finally {
            setLoading(false)
        }
    }, [removeToken])

    // Login
    const login = useCallback(async (email: string, password: string) => {
        try {
            setLoading(true)
            setError(null)

            const response = await apiClient.publicRequest('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Login failed')
            }

            const data = await response.json()
            
            if (data.token) {
                storeToken(data.token)
            }

            if (data.user) {
                setUser(data.user)
                setError(null)
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Login failed'
            setError(errorMessage)
            throw err
        } finally {
            setLoading(false)
        }
    }, [storeToken])

    // Register
    const register = useCallback(async (
        email: string,
        password: string,
        firstName?: string,
        lastName?: string,
        profession?: string,
        businessId?: string,
        phone?: string,
        country?: string
    ) => {
        try {
            setLoading(true)
            setError(null)

            const response = await apiClient.publicRequest('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, firstName, lastName, profession, businessId, phone, country }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Registration failed')
            }

            const data = await response.json()
            
            if (data.token) {
                storeToken(data.token)
            }

            if (data.user) {
                setUser(data.user)
                setError(null)
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Registration failed'
            setError(errorMessage)
            throw err
        } finally {
            setLoading(false)
        }
    }, [storeToken])

    // Logout
    const logout = useCallback(() => {
        removeToken()
        setUser(null)
        setError(null)
    }, [removeToken])

    // Initialize authentication on mount
    useEffect(() => {
        const initializeAuth = async () => {
            if (isInitializedRef.current) return
            isInitializedRef.current = true

            // Check if we have a token
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
            if (token) {
                        await refreshUser()
                } else {
                setLoading(false)
            }
        }

        initializeAuth()
    }, [refreshUser])

    // Poll for user updates (every 30 seconds) if authenticated
    useEffect(() => {
        if (!user) return

        // Clear any existing interval
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
        }

        // Set up polling
        pollingIntervalRef.current = setInterval(() => {
            refreshUser()
        }, 30000) // 30 seconds

        // Cleanup on unmount
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
            }
        }
    }, [user, refreshUser])

    // Listen for visibility changes to refresh when app becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user) {
                refreshUser()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [user, refreshUser])

    const value: AuthContextType = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
