import { Radio } from 'lucide-react'

interface LiveTickerProps {
  url: string
  text?: string
  className?: string
}

export default function LiveTicker({
  url,
  text = 'Watch Live Now',
  className = ''
}: LiveTickerProps) {
  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className={`border-y py-4 ${className}`}
      style={{
        backgroundColor: '#ff4444',
        borderColor: '#cc0000'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Radio
              className="w-5 h-5 text-white animate-pulse"
              fill="white"
            />
            <span className="text-white font-bold text-lg uppercase tracking-wide">
              We're Live Now!
            </span>
          </div>
          <button
            onClick={handleClick}
            className="cursor-pointer bg-green-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-600 transition-colors shadow-lg"
          >
            {text}
          </button>
        </div>
      </div>
    </div>
  )
}
