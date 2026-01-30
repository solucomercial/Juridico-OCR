import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import SearchInterface from "@/components/search-interface"

export const metadata: Metadata = {
  title: "Busca Jurídica | Sistema de Documentos",
  description: "Sistema moderno de busca de documentos jurídicos",
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <SearchInterface />
      </div>

      {/* Footer */}
      <footer className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              {/* Logo e Link Institucional */}
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-100 shadow-sm">
                  <Image src="/solu-web.png" alt="Soluções Serviços Terceirizados" width={40} height={40} />
                </div>
                <Link 
                  href="https://solucoesterceirizadas.com.br/" 
                  target="_blank" 
                  className="text-sm font-semibold text-slate-800 hover:text-blue-900 transition-colors"
                >
                  Soluções Serviços Terceirizados
                </Link>
              </div>

              {/* Suporte/Chamados */}
              <div className="text-center sm:text-left">
                <p className="text-sm text-slate-600">
                  Teve algum problema?{" "}
                  <Link 
                    href="https://interface-client.milvus.com.br/listagem?token=e9d416d91074f7d7c084c09070334f2d58294273c777425aa6ec5db3bb9f394452f68ea3a1db97e12655173d53856dc5efef24920e9195f20806913813f7a974246f847e42" 
                    target="_blank"
                    className="font-medium text-blue-900 hover:underline transition-colors"
                  >
                    Abra um chamado
                  </Link>
                </p>
              </div>

              {/* Direitos e Desenvolvimento */}
              <div className="flex flex-col items-center gap-1 sm:items-end text-right">
                <p className="text-xs text-slate-500">
                  © 2026 Desenvolvido pelo time de TI
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
