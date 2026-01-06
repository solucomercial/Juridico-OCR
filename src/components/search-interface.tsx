"use client"

import type React from "react"

import { useState } from "react"
import { Search, FileText, Loader2, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SearchResult {
  arquivo: string
  pagina: number
}

export default function SearchInterface() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalHits, setTotalHits] = useState(0)

  const MEILI_URL = process.env.NEXT_PUBLIC_MEILI_URL
  const INDEX = process.env.NEXT_PUBLIC_INDEX
  const SEARCH_KEY = process.env.NEXT_PUBLIC_SEARCH_KEY
  const FILE_SERVER = process.env.NEXT_PUBLIC_FILE_SERVER

  async function handleSearch() {
    if (!query.trim()) return

    setIsLoading(true)
    setResults([])

    try {
      const res = await fetch(`${MEILI_URL}/indexes/${INDEX}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SEARCH_KEY}`,
        },
        body: JSON.stringify({
          q: query,
          limit: 20,
          attributesToRetrieve: ["arquivo", "pagina"],
        }),
      })

      const data = await res.json()
      setResults(data.hits)
      setTotalHits(data.estimatedTotalHits)
    } catch (error) {
      console.error("[v0] Error searching:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-balance">Busca Jurídica</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Pesquise em documentos jurídicos de forma rápida e eficiente
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Search Bar */}
          <Card className="p-6 md:p-8 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Digite o termo de busca..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 h-12 text-base"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !query.trim()}
                  className="h-12 px-8 gap-2"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>

              {totalHits > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="font-normal">
                    {totalHits} {totalHits === 1 ? "resultado encontrado" : "resultados encontrados"}
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Resultados</h2>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <Card key={index} className="p-5 hover:shadow-md transition-shadow duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground text-base leading-relaxed break-words">
                              {result.arquivo}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">Página {result.pagina}</p>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2 flex-shrink-0 bg-transparent" asChild>
                        <a href={`${FILE_SERVER}${result.arquivo}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Abrir
                        </a>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && results.length === 0 && query && (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Nenhum resultado encontrado</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Tente usar termos diferentes ou verifique a ortografia
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">Sistema de Busca de Documentos Jurídicos</p>
        </div>
      </footer>
    </div>
  )
}
