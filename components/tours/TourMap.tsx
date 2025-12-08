// /components/tours/TourMap.tsx

'use client'

import { useEffect, useRef } from 'react'
import type { Appointment, Client } from '@/lib/db/schema'

interface TourMapProps {
    appointments: Appointment[]
    clients: Client[]
    optimizedOrder?: string[]
}

export function TourMap({ appointments, clients, optimizedOrder }: TourMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Placeholder for map integration
        // In production, integrate with Google Maps, Mapbox, or similar
        if (mapRef.current) {
            mapRef.current.innerHTML = `
                <div style="width: 100%; height: 400px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 12px;">
                    <div style="text-align: center; color: #666;">
                        <i class="fas fa-map" style="font-size: 48px; margin-bottom: 16px;"></i>
                        <p>Carte interactive</p>
                        <p style="font-size: 12px; margin-top: 8px;">Intégration carte à venir</p>
                    </div>
                </div>
            `
        }
    }, [appointments, clients, optimizedOrder])

    return (
        <div className="card-3d">
            <h3 className="text-lg font-bold text-primary mb-4">Itinéraire</h3>
            <div ref={mapRef} className="w-full"></div>
            {optimizedOrder && optimizedOrder.length > 0 && (
                <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-primary">Ordre optimisé:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-secondary">
                        {optimizedOrder.map((appointmentId, index) => {
                            const appointment = appointments.find(apt => apt.id === appointmentId)
                            const client = appointment ? clients.find(c => c.id === appointment.clientId) : null
                            return (
                                <li key={appointmentId}>
                                    {index + 1}. {client ? `${client.firstName} ${client.lastName}` : 'Client inconnu'}
                                </li>
                            )
                        })}
                    </ol>
                </div>
            )}
        </div>
    )
}

