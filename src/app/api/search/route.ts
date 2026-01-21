import { NextRequest, NextResponse } from "next/server"

const {
  OS_HOST,
  OS_PORT = "9200",
  OS_INDEX = "juridico_index",
  OS_USER,
  OS_PASS,
} = process.env

const SEARCH_URL = OS_HOST ? `http://${OS_HOST}:${OS_PORT}/${OS_INDEX}/_search` : undefined

export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query?: string }

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Parâmetro 'query' é obrigatório." }, { status: 400 })
    }

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
            fuzziness: "AUTO",
          },
        },
        highlight: {
          fields: {
            conteudo: { fragment_size: 200 },
          },
        },
        size: 20,
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
