"use client"

import { useState } from "react"
import { Search, FileText, Loader2, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface SearchResult {
  arquivo: string
  pagina: number
}

export default function SearchInterface() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState("")

  // Pegando as variáveis do .env.local
  const MEILI_URL = process.env.NEXT_PUBLIC_MEILI_URL
  const INDEX = process.env.NEXT_PUBLIC_INDEX
  const SEARCH_KEY = process.env.NEXT_PUBLIC_SEARCH_KEY
  const FILE_SERVER = process.env.NEXT_PUBLIC_FILE_SERVER

  async function handleSearch() {
    if (!query.trim()) return

    setIsLoading(true)
    setStatus("Buscando...")
    setResults([])

    try {
      const res = await fetch(`${MEILI_URL}/indexes/${INDEX}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SEARCH_KEY}`,
        },
        body: JSON.stringify({
          q: query,
          limit: 20,
          attributesToRetrieve: ["arquivo", "pagina"],
        }),
      })

      const data = await res.json()
      setResults(data.hits)
      setStatus(`Resultados encontrados: ${data.estimatedTotalHits}`)
    } catch (error) {
      console.error("Erro na busca:", error)
      setStatus("Erro ao conectar com o servidor.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          🔎 Busca de Documentos Jurídicos
        </h2>
        <div className="flex gap-2">
          <Input
            placeholder="Digite o termo de busca..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : "Buscar"}
          </Button>
        </div>
        {status && <p className="mt-4 text-sm text-muted-foreground">{status}</p>}
      </Card>

      <div className="space-y-4">
        {results.map((hit, index) => (
          <Card key={index} className="p-4 border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4" /> {hit.arquivo}
                </div>
                <div className="text-sm text-gray-500">Página: {hit.pagina}</div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a 
                  href={`${FILE_SERVER}${hit.arquivo}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" /> Abrir documento
                </a>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}