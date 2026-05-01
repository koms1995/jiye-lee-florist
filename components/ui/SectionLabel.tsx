interface SectionLabelProps {
  children: React.ReactNode
  className?: string
}

export default function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <span
      className={`text-xs tracking-[0.2em] uppercase font-sans text-text-secondary ${className}`}
    >
      {children}
    </span>
  )
}
