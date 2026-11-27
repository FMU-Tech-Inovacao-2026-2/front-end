import { describe, expect, test, vi } from 'vitest'
import { lerArquivoSumario } from './lerArquivoSumario'

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({ getTextContent: async () => ({ items: [{ str: 'Furosemida 40 mg' }, { str: 'por via oral.' }] }) }),
    }),
  })),
}))
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '/worker-teste.mjs' }))

describe('Leitura de sumários importados', () => {
  test('lê arquivo TXT sem alterar seu conteúdo', async () => {
    const arquivo = new File(['  Sumário fictício.  '], 'alta.txt', { type: 'text/plain' })
    await expect(lerArquivoSumario(arquivo)).resolves.toBe('Sumário fictício.')
  })

  test('recusa tipos de arquivo que não são suportados', async () => {
    const arquivo = new File(['imagem'], 'alta.png', { type: 'image/png' })
    await expect(lerArquivoSumario(arquivo)).rejects.toThrow('Escolha um arquivo .txt ou um PDF com texto selecionável.')
  })

  test('extrai texto e preserva o número da página de um PDF', async () => {
    const arquivo = new File(['pdf fictício'], 'alta.pdf', { type: 'application/pdf' })
    await expect(lerArquivoSumario(arquivo)).resolves.toBe('Página 1: Furosemida 40 mg por via oral.')
  })

  test('recusa arquivo vazio', async () => {
    const arquivo = new File(['   '], 'vazio.txt', { type: 'text/plain' })
    await expect(lerArquivoSumario(arquivo)).rejects.toThrow('O arquivo não contém texto.')
  })
})
