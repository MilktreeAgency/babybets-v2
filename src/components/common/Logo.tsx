interface LogoProps {
  textColor?: string
  className?: string
  height?: string | number
}

export default function Logo({ textColor = '#ffffff', className = '', height = 42 }: LogoProps) {
  return (
    <svg
      viewBox="0 0 1000 250"
      style={{ height: typeof height === 'number' ? `${height}px` : height, width: 'auto' }}
      className={className}
      aria-label="BabyBets Logo"
    >
      {/* Icon/Symbol on the left - keep original color */}
      <g transform="translate(0, 0)">
        {/* This is a placeholder for the icon - you would need to add the actual path data from your logo */}
        <circle cx="60" cy="125" r="50" fill="#FED0B9" opacity="0.3" />
        <circle cx="60" cy="125" r="35" fill="#FED0B9" />
      </g>
      
      {/* Baby Bets Text - customizable color */}
      <g transform="translate(140, 125)">
        <text
          x="0"
          y="0"
          fontFamily="Arial, sans-serif"
          fontSize="90"
          fontWeight="700"
          fill={textColor}
          dominantBaseline="middle"
        >
          Baby Bets
        </text>
      </g>
    </svg>
  )
}
