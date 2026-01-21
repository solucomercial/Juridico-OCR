"use client"

import { useState } from "react"
import { Search, FileText, Loader2, ExternalLink, Calendar } from "lucide-react"
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
  }
  highlight?: {
    conteudo?: string[]
  }
}

const UNC_PREFIX = "//10.130.1.99/DeptosMatriz/Juridico/"

function toUncPath(originalPath: string) {
  const trimmed = originalPath?.trim()
  if (!trimmed) return ""
  const withoutDados = trimmed.replace(/^\/?:?dados\//i, "")
  return `${UNC_PREFIX}${withoutDados}`
}

function buildFileHref(originalPath: string, term: string) {
  const corrected = toUncPath(originalPath)
  if (!corrected) return "#"
  const searchFragment = term ? `#search=${encodeURIComponent(term)}` : ""
  return `file:${corrected}${searchFragment}`
}

export default function SearchInterface() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState("")

  async function handleSearch() {
    if (!query.trim()) return

    setIsLoading(true)
    setStatus("Pesquisando no acervo jurídico...")
    setResults([])

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || "Erro na conexão com OpenSearch")
      }

      const data = await res.json()
      setResults(data.hits.hits)
      setStatus(`Documentos encontrados: ${data.hits.total.value}`)
    } catch (error) {
      console.error("Erro na busca:", error)
      const message = error instanceof Error ? error.message : "Erro ao conectar com o servidor OpenSearch."
      setStatus(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
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
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={isLoading} className="bg-blue-900 hover:bg-blue-800">
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
            {isLoading ? "Buscando" : "Pesquisar"}
          </Button>
        </div>
        {status && <p className="mt-4 text-sm font-medium text-blue-700">{status}</p>}
      </Card>

      <div className="space-y-4">
        {results.map((hit) => (
          <Card key={hit._id} className="p-5 hover:shadow-lg transition-shadow border-l-4 border-l-blue-900">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="font-bold text-lg flex items-center gap-2 text-slate-800">
                  <FileText className="h-5 w-5 text-blue-900" /> 
                  {hit._source.arquivo}
                </div>
                
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

              {/* Link para abrir o arquivo original (ajuste conforme o seu servidor de arquivos) */}
              <Button variant="outline" size="sm" asChild className="ml-4">
                <a
                  href={buildFileHref(hit._source.caminho_original, query)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" /> Abrir
                </a>
              </Button>
            </div>
          </Card>
        ))}

        {!isLoading && results.length === 0 && query && (
          <p className="text-center text-gray-500">Nenhum documento encontrado para "{query}".</p>
        )}
      </div>
    </div>
  )
}