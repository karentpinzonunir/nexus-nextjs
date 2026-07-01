import { Auth0Client } from '@auth0/nextjs-auth0/server'

// Cliente único que lee las variables de entorno de .env.local
export const auth0 = new Auth0Client()