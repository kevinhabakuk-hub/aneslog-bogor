import consultHandler from '../netlify/functions/consult'

export async function POST(req: Request): Promise<Response> {
  return consultHandler(req)
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204 })
}
