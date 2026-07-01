// app/api/auth/me/route.js
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function GET() {
  const session = await auth0.getSession();
  if (!session) return NextResponse.json({ usuario: null });
  // session.user es el objeto proporcionado por Auth0
  return NextResponse.json({ usuario: session.user });
}