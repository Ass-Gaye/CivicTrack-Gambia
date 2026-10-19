interface SectionTitleProps {
  title: string
  description?: string
  eyebrow?: string
  className?: string
}

export function SectionTitle({ title, description, eyebrow, className = 'mb-6' }: SectionTitleProps) {
  return (
    <div className={className}>
      {eyebrow && (
        <span className="text-xs font-bold uppercase tracking-wider text-river-600 block mb-1">
          {eyebrow}
        </span>
      )}
      <h2 className="text-xl sm:text-2xl font-extrabold text-sand-900 tracking-tight">{title}</h2>
      {description && <p className="mt-1 text-sm text-sand-600 leading-relaxed max-w-2xl">{description}</p>}
    </div>
  )
}
