import { NextRequest, NextResponse } from "next/server"

const {
  OS_HOST,
  OS_PORT = "9200",
  OS_INDEX = "juridico_index",
  OS_USER,
  OS_PASS,
} = process.env

const SEARCH_URL = OS_HOST ? `http://${OS_HOST}:${OS_PORT}/${OS_INDEX}/_search` : undefined
const PAGE_SIZE = 20
const MAX_SIZE = 10000

export async function POST(req: NextRequest) {
  try {
    const { query, page = 1, size } = (await req.json()) as { query?: string; page?: number; size?: number }

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 })
    }

    const pageNumber = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
    const requestedSize = Number.isFinite(size) && size && size > 0 ? Math.floor(size) : PAGE_SIZE
    const finalSize = Math.min(requestedSize, MAX_SIZE)
    const from = (pageNumber - 1) * finalSize

    if (!SEARCH_URL || !OS_USER || !OS_PASS) {
      return NextResponse.json({ error: "OpenSearch não configurado no servidor." }, { status: 500 })
    }

    const res = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${OS_USER}:${OS_PASS}`).toString("base64")}`,
      },
      body: JSON.stringify({
        query: {
          multi_match: {
            query,
            fields: ["conteudo", "arquivo^2"],
            fuzziness: "1",
          },
        },
        highlight: {
          fields: {
            conteudo: { fragment_size: 200 },
          },
        },
        size: finalSize,
        from,
      }),
      cache: "no-store",
    })

    if (!res.ok) {
      const details = await res.text()
      return NextResponse.json({ error: "Erro ao consultar OpenSearch", details }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro na rota /api/search:", error)
    return NextResponse.json({ error: "Falha ao processar a busca." }, { status: 500 })
  }
}
