interface PageSectionProps {
  title: string
  description?: string
  bgColor?: string
}

export default function PageSection({ title, description, bgColor = '' }: PageSectionProps) {
  return (
    <div className={`${bgColor} py-2 px-4 sm:px-6`}>
      <div className="max-w-[1300px] mx-auto">
        <h1
          className="text-2xl md:text-5xl font-semibold mb-3"
          style={{ fontFamily: "'Fraunces', serif", color: '#151e20' }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-lg" style={{ color: '#78716c' }}>
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
