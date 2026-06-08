// src/app/api/categorias/[id]/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { categoriaSchema } from '@/lib/schemas'

// GET /api/categorias/{id}
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('categoria')
      .select('id_categoria, nombre, descripcion')
      .eq('id_categoria', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('Error en GET /api/categorias/[id]:', error)
    return NextResponse.json(
      { error: 'Error al obtener la categoría' },
      { status: 500 }
    )
  }
}

// PUT /api/categorias/{id}
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validación con Zod
    const validData = categoriaSchema.parse(body)

    const { data, error } = await supabase
      .from('categoria')
      .update(validData)
      .eq('id_categoria', id)
      .select('id_categoria, nombre, descripcion')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }
    console.error('Error en PUT /api/categorias/[id]:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la categoría' },
      { status: 500 }
    )
  }
}

// DELETE /api/categorias/{id}
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    const { error } = await supabase
      .from('categoria')
      .delete()
      .eq('id_categoria', id)

    if (error) throw error

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error en DELETE /api/categorias/[id]:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la categoría' },
      { status: 500 }
    )
  }
}