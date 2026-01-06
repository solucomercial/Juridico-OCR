import type { Metadata } from "next"
import SearchInterface from "@/components/search-interface"

export const metadata: Metadata = {
  title: "Busca Jurídica | Sistema de Documentos",
  description: "Sistema moderno de busca de documentos jurídicos",
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <SearchInterface />
    </div>
  )
}
