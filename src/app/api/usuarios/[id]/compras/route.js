// src/app/api/usuarios/[id]/compras/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(request, { params }) {
    const { id } = await params // id del usuario

    const { data, error } = await supabase
        .from('compra')
        .select('id_compra, total, fecha_compra, detalle_compra(*, producto_editorial(titulo))')
        .eq('usuario_id', id)
        .order('fecha_compra', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data }, { status: 200 })
}