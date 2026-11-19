/** Mensagem de erro de um campo, com ícone. Ligue ao campo por aria-describedby. */
export function MensagemErro({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="entrada-erro-campo flex items-center gap-1.5 text-sm text-erro">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>
      {children}
    </p>
  )
}
