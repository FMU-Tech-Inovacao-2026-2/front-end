/**
 * Logo da HealthIA, opção B ajustada ("H de aprovação"): um H com o sinal de
 * conferido ao lado. O traço do meio é reto para o H não parecer um M em
 * tamanhos pequenos. `fundo="escuro"` inverte as cores para usar sobre o azul.
 */
interface PropsMarca {
  tamanho?: number
  fundo?: 'claro' | 'escuro'
  className?: string
}

export function MarcaHealthIA({ tamanho = 40, fundo = 'claro', className }: PropsMarca) {
  const escuro = fundo === 'escuro'
  const quadrado = escuro ? '#FFFFFF' : '#142D4E'
  const letra = escuro ? '#142D4E' : '#FFFFFF'
  const sinal = escuro ? '#187C80' : '#5CC6CA'
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect width="64" height="64" rx="16" fill={quadrado} />
      <rect x="12" y="15" width="9" height="36" rx="3" fill={letra} />
      <rect x="34" y="15" width="9" height="36" rx="3" fill={letra} />
      <rect x="19" y="29" width="17" height="7" fill={letra} />
      <polyline
        points="40,22 45,27 54,14"
        fill="none"
        stroke={sinal}
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface PropsLogo {
  fundo?: 'claro' | 'escuro'
  tamanho?: 'md' | 'lg'
}

export function LogoHealthIA({ fundo = 'claro', tamanho = 'md' }: PropsLogo) {
  const escuro = fundo === 'escuro'
  const grande = tamanho === 'lg'
  return (
    <span className="inline-flex items-center gap-3">
      <MarcaHealthIA tamanho={grande ? 48 : 36} fundo={fundo} />
      <span
        className={`font-bold tracking-tight ${grande ? 'text-3xl' : 'text-2xl'} ${escuro ? 'text-white' : 'text-marca'}`}
      >
        Health<span className={escuro ? 'text-destaque-claro' : 'text-destaque'}>IA</span>
      </span>
    </span>
  )
}
