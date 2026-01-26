import { NextRequest, NextResponse } from "next/server"
import archiver from "archiver"
import { stat, readFile } from "fs/promises"
import path from "path"
import { PassThrough, Readable } from "stream"
import { PDFDocument } from "pdf-lib"

type SanitizedFile = {
  fullPath: string
  name: string
  size: number
}

type DownloadItem = {
  file: SanitizedFile
  page?: number
}

const FILE_BASE_PATH = process.env.FILE_BASE_PATH

function getBaseDir() {
  if (!FILE_BASE_PATH) {
    throw new Error("Variável de ambiente FILE_BASE_PATH não configurada no servidor.")
  }
  return path.resolve(FILE_BASE_PATH)
}

async function sanitizeFilePath(requestedPath: string): Promise<SanitizedFile> {
  if (!requestedPath) {
    throw new Error("Caminho de arquivo ausente.")
  }

  const baseDir = getBaseDir()
  const normalized = path.normalize(requestedPath)
  const target = path.isAbsolute(normalized) ? normalized : path.join(baseDir, normalized)
  const resolved = path.resolve(target)
  const relative = path.relative(baseDir, resolved)

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Caminho solicitado está fora do diretório permitido.")
  }

  const fileStat = await stat(resolved)
  if (!fileStat.isFile()) {
    throw new Error("Caminho solicitado não é um arquivo válido.")
  }

  return {
    fullPath: resolved,
    name: path.basename(resolved),
    size: fileStat.size,
  }
}

async function streamSingleFile(file: SanitizedFile) {
  const buffer = await readFile(file.fullPath)
  const body = new Uint8Array(buffer)
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
      "Content-Length": file.size.toString(),
    },
  })
}

async function buildSinglePageBuffer(file: SanitizedFile, page?: number): Promise<Buffer> {
  if (!page || page < 1) {
    return readFile(file.fullPath)
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Extração de página disponível apenas para PDFs.")
  }

  const source = await readFile(file.fullPath)
  const sourcePdf = await PDFDocument.load(source)
  const pageIndex = page - 1

  if (pageIndex < 0 || pageIndex >= sourcePdf.getPageCount()) {
    throw new Error("Página solicitada está fora dos limites do documento.")
  }

  const targetPdf = await PDFDocument.create()
  const [copied] = await targetPdf.copyPages(sourcePdf, [pageIndex])
  targetPdf.addPage(copied)
  const bytes = await targetPdf.save()
  return Buffer.from(bytes)
}

async function streamZip(items: DownloadItem[]) {
  const archive = archiver("zip", { zlib: { level: 9 } })
  const passThrough = new PassThrough()
  const webStream = Readable.toWeb(passThrough) as unknown as ReadableStream<Uint8Array>

  archive.on("error", (error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error))
    passThrough.destroy(err)
  })
  archive.pipe(passThrough)

  for (const item of items) {
    if (item.page) {
      const buffer = await buildSinglePageBuffer(item.file, item.page)
      const base = item.file.name.replace(/\.pdf$/i, "")
      const name = `${base}_p${item.page}.pdf`
      archive.append(Buffer.from(buffer), { name })
    } else {
      archive.file(item.file.fullPath, { name: item.file.name })
    }
  }

  archive.finalize().catch((error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error))
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

    if (!pathParam) {
      return NextResponse.json({ error: "Parâmetro 'path' é obrigatório." }, { status: 400 })
    }

    const file = await sanitizeFilePath(pathParam)
    const page = pageParam ? Number(pageParam) : undefined
    const buffer = await buildSinglePageBuffer(file, page)
    const filename = page ? `${file.name.replace(/\.pdf$/i, "")}_p${page}.pdf` : file.name

    const body = new Uint8Array(buffer)
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": buffer.length.toString(),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao preparar download."
    const status = message.includes("diretório permitido") || message.includes("arquivo") ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const entries = Array.isArray(body?.paths) ? body.paths : []

    if (entries.length === 0) {
      return NextResponse.json({ error: "Envie ao menos um caminho em 'paths'." }, { status: 400 })
    }

    const items: DownloadItem[] = []
    for (const entry of entries) {
      if (typeof entry === "string") {
        const file = await sanitizeFilePath(entry)
        items.push({ file })
      } else if (entry && typeof entry === "object" && "path" in entry) {
        const pathValue = String((entry as { path: string }).path)
        const pageValue = "page" in entry ? Number((entry as { page?: number }).page) : undefined
        const file = await sanitizeFilePath(pathValue)
        items.push({ file, page: pageValue })
      }
    }

    if (items.length === 1) {
      const { file, page } = items[0]
      const buffer = await buildSinglePageBuffer(file, page)
      const filename = page ? `${file.name.replace(/\.pdf$/i, "")}_p${page}.pdf` : file.name

      const body = new Uint8Array(buffer)
      return new NextResponse(body, {
        headers: {
          "Content-Type": file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
          "Content-Length": buffer.length.toString(),
        },
      })
    }

    return streamZip(items)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao preparar download."
    const status = message.includes("diretório permitido") || message.includes("arquivo") ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
