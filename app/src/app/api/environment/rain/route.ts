import { NextResponse } from 'next/server'

export async function GET(_request: Request) {
  const url = new URL(_request.url)

  return NextResponse.redirect(new URL(`/api/environment/precipitation${url.search}`, url.origin))
}
