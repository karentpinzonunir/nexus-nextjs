
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { productoSchema } from '@/lib/schemas'

export async function GET(request, { params }) {
    const { id } = params
    const { data, error } = await supabase.from('producto_editorial').select('*').eq('id_producto', id).single()

    if (error || !data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ data }, { status: 200 })
}

export async function PUT(request, { params }) {
    try {
        const { id } = params
        const body = await request.json()
        const validData = productoSchema.partial().parse(body) 
        const { data, error } = await supabase
            .from('producto_editorial')
            .update(validData)
            .eq('id_producto', id)
            .select()
            .single()

        if (error || !data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
        return NextResponse.json({ data }, { status: 200 })
    } catch (error) {
        if (error.name === 'ZodError') return NextResponse.json({ error: error.errors }, { status: 400 })
        return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    const { id } = params
    const { error } = await supabase.from('producto_editorial').delete().eq('id_producto', id)
    if (error) return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
    return new NextResponse(null, { status: 204 })
}