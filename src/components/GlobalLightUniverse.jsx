import { useEffect, useRef, useState } from 'react'

const pageModes = {
  home: { density: 'rich', label: 'Infinite possibilities' },
  explore: { density: 'network', label: 'Ideas in orbit' },
  detail: { density: 'focused', label: 'One idea, many futures' },
  account: { density: 'quiet', label: 'Make it yours' },
  quiet: { density: 'quiet', label: 'Ideas have no limits' },
}

function getMode(pathname) {
  if (pathname === '/') return pageModes.home
  if (pathname.startsWith('/explore') || pathname.startsWith('/search') || pathname.startsWith('/category')) return pageModes.explore
  if (pathname.startsWith('/idea/')) return pageModes.detail
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password')) return pageModes.account
  return pageModes.quiet
}

export default function GlobalLightUniverse({ pathname }) {
  const sceneRef = useRef(null)
  const [active, setActive] = useState(false)
  const mode = getMode(pathname)

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene || typeof IntersectionObserver === 'undefined') {
      setActive(true)
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0 })
    observer.observe(scene)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return undefined

    const handlePointerMove = (event) => {
      if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 720) return
      const bounds = scene.getBoundingClientRect()
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
      scene.style.setProperty('--universe-x', `${x * 9}px`)
      scene.style.setProperty('--universe-y', `${y * 7}px`)
    }

    const resetPointer = () => {
      scene.style.setProperty('--universe-x', '0px')
      scene.style.setProperty('--universe-y', '0px')
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('blur', resetPointer)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('blur', resetPointer)
    }
  }, [active])

  return (
    <aside ref={sceneRef} className={`global-light-universe universe-${mode.density} ${active ? 'is-active' : ''}`} aria-hidden="true">
      <div className="universe-ambient"></div>
      <svg className="universe-svg" viewBox="0 0 640 520" role="presentation">
        <defs>
          <radialGradient id="bulbHalo" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#B9A47C" stopOpacity="0.24" />
            <stop offset="58%" stopColor="#B9A47C" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#B9A47C" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bulbRay" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#B9A47C" stopOpacity="0" />
            <stop offset="50%" stopColor="#B9A47C" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#B9A47C" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse className="universe-halo" cx="318" cy="235" rx="178" ry="176" fill="url(#bulbHalo)" />
        <g className="universe-rays">
          <path d="M318 32v54M318 382v46M116 235h54M466 235h54M174 91l38 39M424 341l38 39M462 91l-38 39M212 341l-38 39" />
        </g>
        <g className="universe-network">
          <path d="M84 178C166 88 221 160 293 122S442 77 545 156" />
          <path d="M94 350C188 282 223 371 320 330S450 271 551 350" />
          <path d="M126 126C198 208 234 214 318 235S449 236 520 126" />
          <circle cx="84" cy="178" r="4" /><circle cx="545" cy="156" r="4" /><circle cx="94" cy="350" r="4" /><circle cx="551" cy="350" r="4" /><circle cx="126" cy="126" r="3" /><circle cx="520" cy="126" r="3" />
        </g>
        <g className="lightbulb-mark">
          <path className="bulb-outline" d="M318 112c-70 0-122 53-122 119 0 40 19 70 48 94 13 11 20 24 22 42h104c2-18 9-31 22-42 29-24 48-54 48-94 0-66-52-119-122-119Z" />
          <path className="bulb-base" d="M263 383h110M271 399h94M283 415h70" />
          <path className="bulb-filament" d="M286 271c10-20 18-31 32-31s22 11 32 31M298 272l10-65M338 272l-10-65M308 207h20" />
        </g>
        <g className="universe-particles">
          <circle cx="220" cy="66" r="3" /><circle cx="438" cy="218" r="3" /><circle cx="198" cy="420" r="2" /><circle cx="470" cy="400" r="2" />
        </g>
      </svg>
      <span className="universe-label">{mode.label}</span>
    </aside>
  )
}
