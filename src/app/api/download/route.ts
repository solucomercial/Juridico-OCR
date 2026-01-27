import { NextRequest, NextResponse } from "next/server"
import archiver from "archiver"
import { stat, readFile } from "fs/promises"
import path from "path"
import { PassThrough, Readable } from "stream"
import { PDFDocument } from "pdf-lib"

type DownloadItem = {
  filePath: string
  page?: number
  filename: string
}

const UNC_PREFIX = "//10.130.1.99/DeptosMatriz/Juridico"
const LOCAL_BASE = "/dados"

function mapUncToLocal(uncPath: string): string {
  if (uncPath.toUpperCase().startsWith(UNC_PREFIX.toUpperCase())) {
    const relative = uncPath.slice(UNC_PREFIX.length)
    return path.join(LOCAL_BASE, relative)
  }
  return uncPath
}

function extractFilename(filePath: string): string {
  const parts = filePath.split(/[\\/]/)
  return parts[parts.length - 1] || "arquivo"
}

async function validateAndGetFile(filePath: string): Promise<{ fullPath: string; size: number }> {
  console.info(`[download] Validando: ${filePath}`)
  try {
    const stats = await stat(filePath)
    if (!stats.isFile()) {
      throw new Error("Caminho não é um arquivo.")
    }
    console.info(`[download] Arquivo encontrado: ${stats.size} bytes`)
    return { fullPath: filePath, size: stats.size }
  } catch (err) {
    console.error(`[download] Erro ao validar: ${filePath}`, err)
    throw new Error(`Arquivo não encontrado: ${filePath}`)
  }
}

async function extractSinglePage(pdfPath: string, page: number): Promise<Buffer> {
  console.info(`[download] Extraindo página ${page} de: ${pdfPath}`)
  const buffer = await readFile(pdfPath)
  const sourcePdf = await PDFDocument.load(buffer)
  const pageIndex = page - 1

  if (pageIndex < 0 || pageIndex >= sourcePdf.getPageCount()) {
    throw new Error(`Página ${page} fora dos limites. Total: ${sourcePdf.getPageCount()}`)
  }

  const targetPdf = await PDFDocument.create()
  const [copied] = await targetPdf.copyPages(sourcePdf, [pageIndex])
  targetPdf.addPage(copied)
  const bytes = await targetPdf.save()
  console.info(`[download] Página extraída: ${bytes.length} bytes`)
  return Buffer.from(bytes)
}

async function streamZip(items: DownloadItem[]) {
  console.info(`[download] Criando ZIP com ${items.length} arquivo(s)`)
  const archive = archiver("zip", { zlib: { level: 9 } })
  const passThrough = new PassThrough()
  const webStream = Readable.toWeb(passThrough) as unknown as ReadableStream<Uint8Array>

  archive.on("error", (error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("[download] Erro no archiver:", err)
    passThrough.destroy(err)
  })
  archive.pipe(passThrough)

  for (const item of items) {
    const localPath = mapUncToLocal(item.filePath)
    await validateAndGetFile(localPath)
    const isPdf = /\.pdf$/i.test(item.filename)

    if (isPdf && item.page && item.page > 0) {
      const singlePageBuffer = await extractSinglePage(localPath, item.page)
      const name = item.filename.replace(/\.pdf$/i, "") + `_p${item.page}.pdf`
      archive.append(singlePageBuffer, { name })
    } else {
      archive.file(localPath, { name: item.filename })
    }
  }

  archive.finalize().catch((error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("[download] Erro ao finalizar ZIP:", err)
    passThrough.destroy(err)
  })

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=\"documentos.zip\"",
    },
  })
}

export async function GET(req: NextRequest) {
  try {
    const pathParam = req.nextUrl.searchParams.get("path")
    const pageParam = req.nextUrl.searchParams.get("page")

    console.info(`[download][GET] path=${pathParam} page=${pageParam}`)

    if (!pathParam) {
      return NextResponse.json({ error: "Parâmetro 'path' é obrigatório." }, { status: 400 })
    }

    const localPath = mapUncToLocal(pathParam)
    console.info(`[download][GET] Caminho local: ${localPath}`)

    const { fullPath, size } = await validateAndGetFile(localPath)
    const filename = extractFilename(pathParam)
    const page = pageParam ? Number(pageParam) : undefined

    const isPdf = /\.pdf$/i.test(filename)

    if (isPdf && page && page > 0) {
      const singlePageBuffer = await extractSinglePage(fullPath, page)
      const pageFilename = filename.replace(/\.pdf$/i, "") + `_p${page}.pdf`
      const body = new Uint8Array(singlePageBuffer)

      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(pageFilename)}"`,
          "Content-Length": String(body.byteLength),
        },
      })
    }

    const buffer = await readFile(fullPath)
    const body = new Uint8Array(buffer)
    return new NextResponse(body, {
      headers: {
        "Content-Type": isPdf ? "application/pdf" : "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": String(size),
      },
    })
  } catch (error) {
    console.error("[download][GET] Erro:", error)
    const message = error instanceof Error ? error.message : "Erro ao preparar download."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const entries = Array.isArray(body?.paths) ? body.paths : []

    console.info(`[download][POST] ${entries.length} item(ns) solicitado(s)`)

    if (entries.length === 0) {
      return NextResponse.json({ error: "Envie ao menos um caminho em 'paths'." }, { status: 400 })
    }

    const items: DownloadItem[] = []
    for (const entry of entries) {
      let pathStr = ""
      let page: number | undefined

      if (typeof entry === "string") {
        pathStr = entry
      } else if (entry && typeof entry === "object" && "path" in entry) {
        pathStr = String((entry as { path: string }).path)
        page = "page" in entry ? Number((entry as { page?: number }).page) : undefined
      } else {
        console.warn(`[download][POST] Entry inválido:`, entry)
        continue
      }

      const localPath = mapUncToLocal(pathStr)
      console.info(`[download][POST] Mapeado: ${pathStr} -> ${localPath}`)

      items.push({
        filePath: pathStr,
        page,
        filename: extractFilename(pathStr),
      })
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "Nenhum item válido para processar." }, { status: 400 })
    }

    if (items.length === 1) {
      const item = items[0]
      const localPath = mapUncToLocal(item.filePath)
      const { fullPath, size } = await validateAndGetFile(localPath)
      const isPdf = /\.pdf$/i.test(item.filename)

      if (isPdf && item.page && item.page > 0) {
        const singlePageBuffer = await extractSinglePage(fullPath, item.page)
        const pageFilename = item.filename.replace(/\.pdf$/i, "") + `_p${item.page}.pdf`
        const responseBody = new Uint8Array(singlePageBuffer)

        return new NextResponse(responseBody, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(pageFilename)}"`,
            "Content-Length": String(responseBody.byteLength),
          },
        })
      }

      const buffer = await readFile(fullPath)
      const responseBody = new Uint8Array(buffer)
      return new NextResponse(responseBody, {
        headers: {
          "Content-Type": isPdf ? "application/pdf" : "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(item.filename)}"`,
          "Content-Length": String(size),
        },
      })
    }

    return streamZip(items)
  } catch (error) {
    console.error("[download][POST] Erro:", error)
    const message = error instanceof Error ? error.message : "Erro ao preparar download."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
