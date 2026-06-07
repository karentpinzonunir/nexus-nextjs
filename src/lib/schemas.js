// src/lib/schemas.js
import { z } from 'zod'

// CATEGORÍAS
export const categoriaSchema = z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    descripcion: z.string().optional()
})

// PRODUCTOS EDITORIALES
export const productoSchema = z.object({
    categoria_id: z.number().int(),
    titulo: z.string().min(1, 'El título es requerido'),
    descripcion: z.string().optional(),
    tipo_producto: z.enum(['LIBRO', 'REVISTA']),
    autor: z.string().optional(),
    editorial: z.string().optional(),
    isbn: z.string().optional(),
    fecha_publicacion: z.string().optional(),
    precio: z.number().positive(),
    stock: z.number().int().nonnegative().default(0),
    imagen_url: z.string().url().optional().or(z.literal(''))
})

// COMPRAS
export const compraSchema = z.object({
    usuario_id: z.number().int(),
    detalle: z.array(z.object({
        producto_id: z.number().int(),
        cantidad: z.number().int().positive(),
        precio_unitario: z.number().positive()
    })).min(1, 'Debe haber al menos un producto en la compra')
})

// ESPACIOS COWORKING
export const espacioSchema = z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    capacidad: z.number().int().positive(),
    descripcion: z.string().optional(),
    ubicacion: z.string().optional(),
    precio_hora: z.number().positive()
})

// RESERVAS
export const reservaSchema = z.object({
    usuario_id: z.number().int(),
    espacio_id: z.number().int(),
    fecha_hora_inicio: z.string().datetime({ message: 'Formato de fecha inválido, usa ISO 8601' }),
    fecha_hora_fin: z.string().datetime({ message: 'Formato de fecha inválido, usa ISO 8601' })
})