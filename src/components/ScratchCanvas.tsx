import { useEffect, useRef, useState, useCallback } from 'react'

interface ScratchCanvasProps {
  /** Fires once when the user first starts scratching (good moment to call the reveal API). */
  onStart?: () => void
  /** Fires once when the scratched area passes the reveal threshold. */
  onComplete?: () => void
  /** Reports scratch progress 0..1 (throttled). */
  onProgress?: (progress: number) => void
  /** When true, the remaining foil auto-clears with a fade (e.g. after the result is locked in). */
  forceReveal?: boolean
  /** Disables scratching (e.g. while an error is being handled). */
  disabled?: boolean
  /** Fraction of the surface that must be scratched before auto-reveal. */
  threshold?: number
  /** First line of the big label shown on the foil. */
  label?: string
  /** Second line of the big label shown on the foil. */
  label2?: string
  /** Small sub-label shown on the foil. */
  subLabel?: string
}

const DEFAULT_THRESHOLD = 0.5

interface Flake {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
  color: string
}

const FLAKE_COLORS = ['#FBEFDF', '#F2C879', '#E8635B', '#FFFFFF']

function drawSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outer: number,
  color: string
) {
  const inner = outer * 0.24
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI / 4) * i - Math.PI / 2
    const rad = i % 2 === 0 ? outer : inner
    const x = cx + Math.cos(ang) * rad
    const y = cy + Math.sin(ang) * rad
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export function ScratchCanvas({
  onStart,
  onComplete,
  onProgress,
  forceReveal = false,
  disabled = false,
  threshold = DEFAULT_THRESHOLD,
  label = 'SCRATCH',
  label2 = '& win',
  subLabel,
}: ScratchCanvasProps) {
  const scratchRef = useRef<HTMLCanvasElement>(null)
  const particleRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const startedRef = useRef(false)
  const completedRef = useRef(false)
  const lastProgressCheckRef = useRef(0)
  const lastHapticRef = useRef(0)
  const flakesRef = useRef<Flake[]>([])
  const rafRef = useRef<number | null>(null)
  const dprRef = useRef(1)

  const clearRafRef = useRef<number | null>(null)

  const [started, setStarted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)

  // ---- Foil drawing -------------------------------------------------------
  const drawFoil = useCallback(
    (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const w = canvas.width
      const h = canvas.height

      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, w, h)

      // Red foil base
      const grad = ctx.createLinearGradient(0, 0, w, h)
      grad.addColorStop(0, '#EC6F64')
      grad.addColorStop(0.5, '#D6483F')
      grad.addColorStop(1, '#BC332F')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // Soft diagonal sheen band
      const sheen = ctx.createLinearGradient(0, h, w, 0)
      sheen.addColorStop(0.35, 'rgba(255,255,255,0)')
      sheen.addColorStop(0.62, 'rgba(255,255,255,0.16)')
      sheen.addColorStop(0.85, 'rgba(255,255,255,0)')
      ctx.fillStyle = sheen
      ctx.fillRect(0, 0, w, h)

      // Gold sparkle stars
      const gold = '#E7B85B'
      const u = Math.min(w, h)
      const stars: [number, number, number][] = [
        [0.82, 0.16, 0.05],
        [0.7, 0.26, 0.032],
        [0.9, 0.3, 0.04],
        [0.15, 0.58, 0.03],
        [0.13, 0.76, 0.052],
        [0.28, 0.78, 0.034],
      ]
      for (const [fx, fy, fr] of stars) {
        drawSparkle(ctx, w * fx, h * fy, u * fr, gold)
      }

      // Center label (two lines, cream fill + red outline)
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineJoin = 'round'
      const cx = w / 2
      const cy = h / 2
      const f1 = Math.round(w * 0.16)
      const f2 = Math.round(w * 0.17)
      const outline = Math.max(3, w * 0.016)

      ctx.font = `800 ${f1}px ui-sans-serif, system-ui, sans-serif`
      ctx.strokeStyle = '#C8413A'
      ctx.lineWidth = outline
      ctx.fillStyle = '#FBEFDF'
      ctx.strokeText(label, cx, cy - f1 * 0.58)
      ctx.fillText(label, cx, cy - f1 * 0.58)

      ctx.font = `800 ${f2}px ui-sans-serif, system-ui, sans-serif`
      ctx.strokeText(label2, cx, cy + f2 * 0.58)
      ctx.fillText(label2, cx, cy + f2 * 0.58)

      if (subLabel) {
        ctx.font = `600 ${Math.round(w * 0.034)}px ui-sans-serif, system-ui, sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.72)'
        ctx.fillText(subLabel, cx, h * 0.9)
      }
      ctx.restore()
    },
    [label, label2, subLabel]
  )

  // ---- Size / init --------------------------------------------------------
  const setup = useCallback(() => {
    const canvas = scratchRef.current
    const particles = particleRef.current
    const wrap = wrapRef.current
    if (!canvas || !particles || !wrap) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    dprRef.current = dpr
    const rect = wrap.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    for (const c of [canvas, particles]) {
      c.width = Math.round(rect.width * dpr)
      c.height = Math.round(rect.height * dpr)
      c.style.width = `${rect.width}px`
      c.style.height = `${rect.height}px`
    }
    drawFoil(canvas)
  }, [drawFoil])

  useEffect(() => {
    setup()
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(() => {
      // Only re-init the foil if the user hasn't started scratching yet.
      if (!startedRef.current) setup()
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [setup])

  // ---- Particles ----------------------------------------------------------
  const runParticles = useCallback(() => {
    const particles = particleRef.current
    const ctx = particles?.getContext('2d')
    if (!particles || !ctx) return

    const tick = () => {
      ctx.clearRect(0, 0, particles.width, particles.height)
      const flakes = flakesRef.current
      for (let i = flakes.length - 1; i >= 0; i--) {
        const f = flakes[i]
        f.life += 1
        f.vy += 0.35
        f.x += f.vx
        f.y += f.vy
        const alpha = Math.max(0, 1 - f.life / f.maxLife)
        if (alpha <= 0) {
          flakes.splice(i, 1)
          continue
        }
        ctx.globalAlpha = alpha
        ctx.fillStyle = f.color
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      if (flakes.length > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
      }
    }

    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [])

  const spawnFlakes = useCallback(
    (x: number, y: number) => {
      const flakes = flakesRef.current
      if (flakes.length > 90) return
      const count = 3
      for (let i = 0; i < count; i++) {
        flakes.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 3 - 1,
          size: (Math.random() * 1.6 + 1) * dprRef.current,
          life: 0,
          maxLife: 28 + Math.random() * 18,
          color: FLAKE_COLORS[(Math.random() * FLAKE_COLORS.length) | 0],
        })
      }
      runParticles()
    },
    [runParticles]
  )

  // ---- Animated auto-clear (wipe the rest away once threshold is hit) ------
  const autoClear = useCallback(() => {
    const canvas = scratchRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    setCompleted(true)

    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2
    const maxR = Math.sqrt(cx * cx + cy * cy) * 1.02
    const duration = 480
    const start = performance.now()
    let lastR = 0

    ctx.globalCompositeOperation = 'destination-out'

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = t * t * (3 - 2 * t) // smoothstep
      const r = eased * maxR

      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()

      // Throw shavings off the expanding edge.
      if (r - lastR > 6) {
        lastR = r
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2
          spawnFlakes(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
        }
      }

      if (t < 1) {
        clearRafRef.current = requestAnimationFrame(step)
      } else {
        ctx.clearRect(0, 0, w, h)
        clearRafRef.current = null
      }
    }
    clearRafRef.current = requestAnimationFrame(step)
  }, [spawnFlakes])

  // ---- Progress measurement ----------------------------------------------
  const measureProgress = useCallback(() => {
    const canvas = scratchRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { width, height } = canvas
    let data: ImageData
    try {
      data = ctx.getImageData(0, 0, width, height)
    } catch {
      return
    }
    const pixels = data.data
    let cleared = 0
    let total = 0
    // Sample every 8th pixel for performance.
    const step = 8 * 4
    for (let i = 3; i < pixels.length; i += step) {
      total++
      if (pixels[i] === 0) cleared++
    }
    const p = total > 0 ? cleared / total : 0
    setProgress(p)
    onProgress?.(p)

    if (!completedRef.current && p >= threshold) {
      completedRef.current = true
      drawingRef.current = false
      if ('vibrate' in navigator) navigator.vibrate([18, 24, 40])
      autoClear()
      onComplete?.()
    }
  }, [autoClear, onComplete, onProgress, threshold])

  // ---- Scratch input ------------------------------------------------------
  const getPoint = (clientX: number, clientY: number) => {
    const canvas = scratchRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }

  const scratchAt = useCallback(
    (x: number, y: number) => {
      const canvas = scratchRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return

      const radius = Math.max(18, canvas.width * 0.06)
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = radius * 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const last = lastPointRef.current
      ctx.beginPath()
      if (last) {
        ctx.moveTo(last.x, last.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()

      lastPointRef.current = { x, y }
      spawnFlakes(x, y)

      const now = performance.now()
      if (now - lastHapticRef.current > 55) {
        lastHapticRef.current = now
        if ('vibrate' in navigator) navigator.vibrate(4)
      }
      if (now - lastProgressCheckRef.current > 90) {
        lastProgressCheckRef.current = now
        measureProgress()
      }
    },
    [measureProgress, spawnFlakes]
  )

  const beginScratch = useCallback(() => {
    if (!startedRef.current) {
      startedRef.current = true
      setStarted(true)
      onStart?.()
    }
  }, [onStart])

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || completedRef.current || forceReveal) return
    e.preventDefault()
    ;(e.target as HTMLCanvasElement).setPointerCapture?.(e.pointerId)
    drawingRef.current = true
    beginScratch()
    lastPointRef.current = null
    const { x, y } = getPoint(e.clientX, e.clientY)
    scratchAt(x, y)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled || completedRef.current) return
    e.preventDefault()
    // Coalesced events give smoother lines on supported browsers.
    const events =
      typeof e.nativeEvent.getCoalescedEvents === 'function'
        ? e.nativeEvent.getCoalescedEvents()
        : [e.nativeEvent]
    for (const ev of events) {
      const { x, y } = getPoint(ev.clientX, ev.clientY)
      scratchAt(x, y)
    }
  }

  const endScratch = useCallback(() => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastPointRef.current = null
    measureProgress()
  }, [measureProgress])

  // ---- Auto-clear on forceReveal ------------------------------------------
  useEffect(() => {
    if (!forceReveal || completedRef.current) return
    completedRef.current = true
    autoClear()
  }, [forceReveal, autoClear])

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      if (clearRafRef.current != null) cancelAnimationFrame(clearRafRef.current)
    }
  }, [])

  const pct = Math.min(100, Math.round((progress / threshold) * 100))

  return (
    <div ref={wrapRef} className="absolute inset-0 z-10 select-none">
      <canvas
        ref={scratchRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ cursor: forceReveal ? 'default' : 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endScratch}
        onPointerCancel={endScratch}
        onPointerLeave={endScratch}
      />
      <canvas ref={particleRef} className="pointer-events-none absolute inset-0 h-full w-full z-20" />

      {/* Progress chip */}
      {started && !completed && !forceReveal && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 backdrop-blur-sm">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full rounded-full transition-[width] duration-150"
                style={{ width: `${pct}%`, backgroundColor: '#F2C879' }}
              />
            </div>
            <span className="text-xs font-bold text-white tabular-nums">{pct}%</span>
          </div>
        </div>
      )}

    </div>
  )
}
