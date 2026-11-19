import '@fontsource-variable/inter/wght.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { Rotas } from './App.tsx'
import { ApiProvider } from './api/ApiProvider.tsx'
import { criarApis } from './api/criarApis.ts'
import { AuthProvider } from './auth/AuthProvider.tsx'
import { criarCliente } from './auth/criarCliente.ts'
import './index.css'

const raiz = createRoot(document.getElementById('root')!)

criarCliente()
  .then((cliente) => {
    const apis = criarApis(cliente)
    raiz.render(
      <StrictMode>
        <AuthProvider cliente={cliente}>
          <ApiProvider apis={apis}>
            <BrowserRouter>
              <Rotas />
            </BrowserRouter>
          </ApiProvider>
        </AuthProvider>
      </StrictMode>,
    )
  })
  .catch((erro: unknown) => {
    console.error(erro)
    raiz.render(
      <main className="mx-auto max-w-xl p-8">
        <h1 className="text-2xl font-bold">Configuração incompleta</h1>
        <p className="mt-2 text-texto-suave">
          {erro instanceof Error ? erro.message : 'Não foi possível iniciar o app.'}
        </p>
      </main>,
    )
  })
