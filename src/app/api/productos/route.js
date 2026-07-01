// src/app/api/productos/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { productoSchema } from '@/lib/schemas'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const categoria = searchParams.get('categoria')
        const tipo = searchParams.get('tipo')
        const autor = searchParams.get('autor')
        const stock_min = searchParams.get('stock_min')
        const precio_max = searchParams.get('precio_max')

        let query = supabase.from('producto_editorial').select('*')

        if (categoria) query = query.eq('categoria_id', categoria)
        if (tipo) query = query.eq('tipo_producto', tipo.toUpperCase())
        if (autor) query = query.ilike('autor', `%${autor}%`)
        if (stock_min) query = query.gte('stock', parseInt(stock_min))
        if (precio_max) query = query.lte('precio', parseFloat(precio_max))

        const { data, error } = await query.order('titulo', { ascending: true })

        if (error) throw error
        return NextResponse.json({ data }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const validData = productoSchema.parse(body)

        const { data, error } = await supabase
            .from('producto_editorial')
            .insert([validData])
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ data }, { status: 201 })
    } catch (error) {
        if (error.name === 'ZodError') return NextResponse.json({ error: error.errors }, { status: 400 })
        return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
    }
}