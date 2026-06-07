// src/app/api/reservas/[id]/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function DELETE(request, { params }) {
    const { id } = params
    // Marcamos como cancelada en lugar de borrar físicamente
    const { error } = await supabase
        .from('reserva')
        .update({ fecha_cancelacion: new Date().toISOString() })
        .eq('id_reserva', id)

    if (error) return NextResponse.json({ error: 'Error al cancelar' }, { status: 500 })
    return new NextResponse(null, { status: 204 })
}