// src/app/api/categorias/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { categoriaSchema } from '@/lib/schemas'

// GET /api/categorias
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('categoria')
            .select('id_categoria, nombre, descripcion')
            .order('nombre', { ascending: true })

        if (error) throw error

        return NextResponse.json({ data }, { status: 200 })
    } catch (error) {
        console.error('Error en GET /api/categorias:', error)
        return NextResponse.json(
            { error: 'Error al obtener las categorías' },
            { status: 500 }
        )
    }
}

// POST /api/categorias
export async function POST(request) {
    try {
        const body = await request.json()

        // Validación con Zod
        const validData = categoriaSchema.parse(body)

        const { data, error } = await supabase
            .from('categoria')
            .insert([validData])
            .select('id_categoria, nombre, descripcion')
            .single()

        if (error) throw error

        return NextResponse.json({ data }, { status: 201 })
    } catch (error) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: error.errors },
                { status: 400 }
            )
        }
        console.error('Error en POST /api/categorias:', error)
        return NextResponse.json(
            { error: 'Error al crear la categoría' },
            { status: 500 }
        )
    }
}