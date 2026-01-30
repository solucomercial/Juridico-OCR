"use client"

import { useState } from "react"
import { Search, FileText, Loader2, ExternalLink, Calendar, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Interface atualizada para os campos do OpenSearch
interface SearchResult {
  _id: string
  _source: {
    arquivo: string
    conteudo: string
    data: string
    caminho_original: string
    pagina: number
  }
  highlight?: {
    conteudo?: string[]
  }
}

type SelectedItem = {
  id: string
  path: string
  page?: number
  filename: string
}
const PAGE_SIZE = 20
const MAX_FETCH_SIZE = 10000

// Mapeamento de caminhos UNC para volumes Docker
const NFS_MAPPING: Record<string, string> = {
  "//10.130.1.99/DeptosMatriz/Juridico": "/juridico",
  "//172.17.0.10/h$/People": "/people",
  "//172.17.0.10/h$/sign": "/sign",
  "//172.17.0.10/h$/sign_original_files": "/sign_original_files"
}

function mapUncToLocal(uncPath: string): string {
  const upperUnc = uncPath.toUpperCase()
  for (const [nfsPrefix, localPath] of Object.entries(NFS_MAPPING)) {
    if (upperUnc.startsWith(nfsPrefix.toUpperCase())) {
      const relative = uncPath.slice(nfsPrefix.length)
      // Converte o caminho UNC para o volume montado no Docker
      return localPath + relative.replace(/\\/g, "/")
    }
  }
  return uncPath
}

function extractFileName(originalPath: string) {
  if (!originalPath) return "arquivo"
  const parts = originalPath.split(/[\\/]/)
  return parts[parts.length - 1] || "arquivo"
}

function toFileUrl(path?: string) {
  if (!path) return "#"
  const fileUrl = `file://${path}`
  console.log("File URL:", fileUrl) // Adicione esta linha para debug
  return fileUrl
}

export default function SearchInterface() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalHits, setTotalHits] = useState(0)
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map())
  const [isDownloading, setIsDownloading] = useState(false)

  function selectAllCurrentPage() {
    setSelectedItems((prev) => {
      const next = new Map(prev)
      const allSelected = results.every((hit) => next.has(hit._id))

      if (allSelected) {
        results.forEach((hit) => next.delete(hit._id))
        return next
      }

      results.forEach((hit) => {
        next.set(hit._id, {
          id: hit._id,
          path: hit._source.caminho_original,
          page: hit._source.pagina,
          filename: hit._source.arquivo,
        })
      })

      return next
    })
  }

  async function selectAllResults() {
    if (!query.trim() || totalHits === 0) return

    const desiredSize = Math.min(totalHits, MAX_FETCH_SIZE)
    setStatus(`Carregando todos os ${desiredSize} resultados para seleção...`)

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, page: 1, size: desiredSize }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || "Erro ao carregar todos os resultados.")
      }

      const data = await res.json()
      const hits: SearchResult[] = data.hits?.hits ?? []

      setSelectedItems((prev) => {
        const next = new Map(prev)
        hits.forEach((hit) => {
          next.set(hit._id, {
            id: hit._id,
            path: hit._source.caminho_original,
            page: hit._source.pagina,
            filename: hit._source.arquivo,
          })
        })
        return next
      })

      const returned = hits.length
      if (returned < totalHits) {
        setStatus(`Selecionados ${returned} de ${totalHits} (limite máximo para seleção: ${MAX_FETCH_SIZE}).`)
      } else {
        setStatus(`Todos os ${returned} resultados foram selecionados.`)
      }
    } catch (error) {
      console.error("Erro ao selecionar todos:", error)
      const message = error instanceof Error ? error.message : "Falha ao selecionar todos os resultados."
      setStatus(message)
    }
  }

  async function handleSearch(nextPage = 1) {
    if (!query.trim()) return

    const safePage = nextPage > 0 ? Math.floor(nextPage) : 1
    setPage(safePage)

    setIsLoading(true)
    setStatus("Pesquisando no acervo jurídico...")
    setResults([])
    setTotalPages(1)
    setTotalHits(0)

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          page: safePage,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || "Erro na conexão com OpenSearch")
      }

      const data = await res.json()
      const hitsTotal = typeof data.hits.total === "number" ? data.hits.total : data.hits.total?.value ?? 0
      const calculatedPages = hitsTotal > 0 ? Math.max(1, Math.ceil(hitsTotal / PAGE_SIZE)) : 1

      setResults(data.hits.hits)
      setTotalHits(hitsTotal)
      setTotalPages(calculatedPages)
      setStatus(`Documentos encontrados: ${hitsTotal} | Página ${safePage} de ${calculatedPages}`)
    } catch (error) {
      console.error("Erro na busca:", error)
      const message = error instanceof Error ? error.message : "Erro ao conectar com o servidor OpenSearch."
      setStatus(message)
    } finally {
      setIsLoading(false)
    }
  }

  function toggleSelection(hit: SearchResult) {
    setSelectedItems((prev) => {
      const next = new Map(prev)
      if (next.has(hit._id)) {
        next.delete(hit._id)
      } else {
        next.set(hit._id, {
          id: hit._id,
          path: hit._source.caminho_original,
          page: hit._source.pagina,
          filename: hit._source.arquivo,
        })
      }
      return next
    })
  }

  async function downloadSelected() {
    const items = Array.from(selectedItems.values())
      .filter((item) => Boolean(item.path))
      .map((item) => ({ path: item.path, page: item.page }))

    if (items.length === 0) return

    setIsDownloading(true)
    setStatus(`Preparando download de ${items.length} arquivo${items.length > 1 ? "s" : ""}...`)

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paths: items }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || "Erro ao preparar download.")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const filename = items.length === 1
        ? `${extractFileName(items[0].path)}${items[0].page ? `_p${items[0].page}` : ""}`
        : "documentos.zip"

      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = filename
      anchor.click()
      URL.revokeObjectURL(url)
      setStatus(`Download iniciado para ${items.length} arquivo${items.length > 1 ? "s" : ""}.`)
    } catch (error) {
      console.error("Erro no download:", error)
      const message = error instanceof Error ? error.message : "Falha ao processar o download."
      setStatus(message)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* <a href="https://solucoesterceirizadas.com.br/" target="_blank" rel="noopener noreferrer">
        <img 
          src="/logo-solu-web.png" 
          alt="Soluções Serviços Terceirizados" 
          className="mx-auto h-40 w-auto pb-4 transition-opacity hover:opacity-80" 
        />
      </a> */}
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-800">Soluções Serviços Terceirizados</h1>
        <p className="text-muted-foreground">Portal de Consulta de Documentos - OpenSearch</p>
      </header>

      <Card className="p-6 shadow-md border-t-4 border-t-blue-900">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Pesquisar por contratos, nomes, CPF ou termos jurídicos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(1)}
            />
          </div>
          <Button onClick={() => handleSearch(1)} disabled={isLoading} className="bg-blue-900 hover:bg-blue-800">
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
            {isLoading ? "Buscando" : "Pesquisar"}
          </Button>
        </div>
        {status && <p className="mt-4 text-sm font-medium text-blue-700">{status}</p>}
      </Card>

      <div className="space-y-4">
        {selectedItems.size > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-700">Selecionados: {selectedItems.size}</p>
            <Button onClick={downloadSelected} disabled={isDownloading} className="bg-blue-900 hover:bg-blue-800">
              {isDownloading ? <Loader2 className="animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              {isDownloading ? "Preparando..." : "Baixar Selecionados"}
            </Button>
          </div>
        )}

        {results.length > 0 && (
          <div className="flex items-center justify-between text-sm text-slate-700">
            <span>Resultados nesta página: {results.length}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllCurrentPage}>
                Selecionar todos desta página
              </Button>
              <Button variant="outline" size="sm" onClick={selectAllResults}>
                Selecionar todos os resultados
              </Button>
            </div>
          </div>
        )}

        {results.map((hit) => (
          <Card key={hit._id} className="p-5 hover:shadow-lg transition-shadow border-l-4 border-l-blue-900">
            <div className="flex gap-4 items-start">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-blue-900"
                checked={selectedItems.has(hit._id)}
                onChange={() => toggleSelection(hit)}
                aria-label="Selecionar documento"
              />

              <div className="flex-1 flex justify-between items-start gap-4">
                <div className="space-y-2">
                <div className="font-bold text-lg flex items-center gap-2 text-slate-800">
                  <FileText className="h-5 w-5 text-blue-900" /> 
                  {hit._source.arquivo}
                </div>
                <div className="text-xs text-slate-600">Página: {hit._source.pagina}</div>
                
                {/* Exibe o destaque (highlight) ou uma prévia do conteúdo */}
                <div className="text-sm text-slate-600 italic bg-slate-50 p-2 rounded border">
                  {hit.highlight?.conteudo ? (
                    <span dangerouslySetInnerHTML={{ __html: `...${hit.highlight.conteudo[0]}...` }} />
                  ) : (
                    <span>{hit._source.conteudo.substring(0, 150)}...</span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Indexado em: {hit._source.data}
                  </span>
                </div>
              </div>

                {/* <Button variant="outline" size="sm" asChild className="shrink-0">
                  <a
                    href={(hit._source.caminho_original)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" /> Abrir
                  </a>
                </Button> */}
              </div>
            </div>
          </Card>
        ))}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-slate-600">
              Página {page} de {totalPages} — {totalHits} resultado{totalHits === 1 ? "" : "s"}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSearch(page - 1)}
                disabled={page <= 1 || isLoading}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSearch(page + 1)}
                disabled={page >= totalPages || isLoading}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}

        {!isLoading && results.length === 0 && query && (
          <p className="text-center text-gray-500">Nenhum documento encontrado para "{query}".</p>
        )}
      </div>
    </div>
  )
}