const LIMITE_ARQUIVO = 10 * 1024 * 1024
const LIMITE_TEXTO = 20_000
const LIMITE_PAGINAS = 40

export async function lerArquivoSumario(arquivo: File): Promise<string> {
  if (arquivo.size > LIMITE_ARQUIVO) throw new Error('O arquivo deve ter no máximo 10 MB.')

  if (arquivo.name.toLowerCase().endsWith('.txt') || arquivo.type === 'text/plain') {
    const texto = (await arquivo.text()).trim()
    if (!texto) throw new Error('O arquivo não contém texto.')
    if (texto.length > LIMITE_TEXTO) throw new Error('O sumário passou de 20.000 caracteres.')
    return texto
  }

  if (!arquivo.name.toLowerCase().endsWith('.pdf') && arquivo.type !== 'application/pdf') {
    throw new Error('Escolha um arquivo .txt ou um PDF com texto selecionável.')
  }

  const [{ getDocument, GlobalWorkerOptions }, workerSrc] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  GlobalWorkerOptions.workerSrc = workerSrc.default
  const documento = await getDocument({ data: new Uint8Array(await arquivo.arrayBuffer()) }).promise
  if (documento.numPages > LIMITE_PAGINAS) throw new Error('O PDF deve ter no máximo 40 páginas.')

  const paginas: string[] = []
  for (let numero = 1; numero <= documento.numPages; numero += 1) {
    const pagina = await documento.getPage(numero)
    const conteudo = await pagina.getTextContent()
    const linhas = conteudo.items.flatMap((item) => ('str' in item && item.str.trim() ? [item.str.trim()] : []))
    paginas.push(linhas.join(' '))
  }

  const texto = paginas.map((pagina, indice) => `Página ${indice + 1}: ${pagina}`).join('\n\n').trim()
  if (!texto || paginas.every((pagina) => !pagina)) {
    throw new Error('Não encontrei texto selecionável nesse PDF. Use um arquivo com texto ou digite o sumário.')
  }
  if (texto.length > LIMITE_TEXTO) throw new Error('O sumário passou de 20.000 caracteres.')
  return texto
}
