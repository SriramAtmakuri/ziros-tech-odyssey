import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Rocket, Siren, UserRound } from 'lucide-react'

// A compressed opening cutscene (~8s, skippable) — crash-landing on Tech
// Planet. Story beats match the spec (starfield → alarm → planet → crash →
// title card) condensed from the spec's 30-45s suggestion to keep it snappy
// for a solo player who will see this once.
const STEP_DURATIONS = [1400, 1300, 2100, 1000, 2000]

// Two real continent silhouettes — Africa/Europe (front) and the Americas
// (back), traced from a CC-BY 4.0 licensed source (Twemoji) — swapped via a
// genuine CSS 3D rotation (rotateY + backface-visibility) rather than a flat
// spin, so the far side of the globe actually shows a different view, the
// way a real rotating sphere would.
const GLOBE_FRONT_PATH = 'M25.716 1.756c-1.022.568-1.872 1.528-3.028 1.181-1.875-.562-4.375-1.812-6-.25s-2 3 0 2.938 3.375-2.438 4.375-1.438.749 1.813-1.625 2.125S14.5 7 13.125 7s-1.688.812-.75 1.688-.563.937-2.125 1.812.375 1.25 1.688 2 2.312-.188 2.875-1.438 2.981-2.75 3.99-2.562c1.01.188 1.01.688.822 1.562s.75.625.812-.375 1.188-1.75 2.062-1.812 1.625 1.188.625 1.812-2 1.125-.75 1.438 2.125 1.938.688 2.625-3.937 1.125-5.062.562-3.688-1.375-4.375-.938-1.062.89-1.875 1.195c-.812.305-4.125 1.805-4.188 3.743S7.438 22.438 8.75 22.5s4.5-.812 5.5-1.625 2.375-.625 2.812.312.125 1.5-.312 3 .286 2.25.987 3.562c.701 1.312 1.263 2.062 1.263 3s1 1.875 2.5.312 2.875-4.625 3.5-5.75 1.125-3.625 1.875-4.125 1.938-1.688 1.062-1.5-2.625-.062-3.062-1.312-2.312-3.625-1.438-3.875 1.875 1.39 2.25 2.164c.375.774.875 1.711 1.625 1.961s2.375-1.673 2.875-1.961c.5-.289.125-1.476-.875-1.351s-2.312 0-2.312-.624 1.25-1.438 2.25-1.25 1.75.5 2.375 1.25 1.875 2.125 2.375 3 .875 1 1.125-.562c.166-1.038.387-1.609.59-2.222-1.013-5.829-4.82-10.683-9.999-13.148z'
const GLOBE_BACK_PATH = 'M30.13 23.748c-1.017-.39-.836-.248-1.463-1.581-.627-1.332-1.007-1.761-2.417-1.917-1.411-.155-1.358-.045-1.75-.75-.392-.706-1.982.191-3 .584-1.021.392-.769 1.246-1.083 1.166-.315-.078-1.107-.281-1.893-.907-.784-.628.583-1.118.976-1.509.393-.393-.74-.179-1.133-.416-.393-.234-1.096.471-1.723-.158-.628-.627-.235-1.568-.313-2.352-.079-.785 1.018-.941 1.724-1.098.705-.156 1.253.001 1.253.941 0 .941.863 1.255.628.156s.235-1.411.55-1.96c.313-.549.862-1.334 1.567-2.51.706-1.176 1.177-.628 2.039-.544.863.085 1.098-.083 1.725-.004.625.079 0-.784.236-1.646.234-.862 1.097-.706 1.961-.47.862.235-.864-1.099-1.177-1.804-.315-.706-1.177 0-1.724-1.176-.553-1.176-1.324-1.937-2.03-2.042-.706-.106.225 1.494-.324 2.356-.551.862-1.395.727-2.26.727-.861 0-1.661-.727-1.033-1.825.626-1.097 1.823-.984 2.45-1.925.628-.94-2.23-.854-3.25-1.167-1.02-.314-2.244-.311-3.263.473-1.02.783-3.201 1.028-4.064 1.341-.862.313-1.017-.52-1.173-1.148-.07-.279-.388-.367-.836-.357C7.11 3.45 5.187 5.138 3.664 7.147c.237.807 1.385-.189 1.61-.414.235-.235 1.411.079 1.567.941.157.862.079 1.805-.234 2.589-.314.783.784 1.881 1.411 2.979.628 1.099 1.333 1.098 1.647 1.098.313 0 2.117.706 2.038 1.568-.078.863 1.647 1.646 2.353 2.195.706.551 1.152 1.092 2.068 1.25.917.158 1.989 1.657 2.459 1.815.361.12.972.697 1.341.876-.485.614-1.424 1.875-1.424 2.456 0 .786 1.025 2.021 1.417 2.334.391.312 1.517.55 1.75 1.333.236.784-.164 3.423-.868 4.128-.708.705-.965 2.372-.965 2.372s.249.541 1.083 0C21.839 34.07 23.383 32.37 24 32c1.176-.707 2.319-1.565 3.417-2.583 1.098-1.019.7-1.733 1.25-2.75.549-1.019 1.259-.973 2.199-1.833.942-.864.284-.693-.736-1.086z'
const GLOBE_GLOW = 'drop-shadow(0 0 1px #f472b6) drop-shadow(0 0 3px #818cf8)'

export default function OpeningCutscene({ onDone }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= STEP_DURATIONS.length) { onDone(); return undefined }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_DURATIONS[step])
    return () => clearTimeout(t)
  }, [step, onDone])

  useEffect(() => {
    const onKey = (e) => { if (e.key === ' ' || e.key === 'Escape') onDone() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  const stars = Array.from({ length: 60 }, (_, i) => ({
    left: (i * 47) % 100, top: (i * 83) % 100, size: 1 + (i % 3),
  }))

  return (
    <div
      className="absolute inset-0 z-[60] bg-black overflow-hidden cursor-pointer"
      onClick={onDone}
    >
      {stars.map((s, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className="absolute rounded-full bg-white" style={{
          left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, opacity: 0.7,
        }}
        />
      ))}

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="ship" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* ignition flash at the launch pad, right before liftoff */}
            <motion.div
              className="absolute rounded-full"
              style={{
                left: '50%', bottom: 36, width: 100, height: 34, marginLeft: -50,
                background: 'radial-gradient(ellipse, rgba(224,242,254,0.95) 0%, rgba(34,211,238,0.55) 45%, rgba(34,211,238,0) 78%)',
                filter: 'blur(4px)',
              }}
              initial={{ opacity: 0, scaleX: 0.3 }}
              animate={{ opacity: [0, 1, 0], scaleX: [0.3, 1.8, 2.2] }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute"
              style={{ left: '50%', bottom: 0, marginLeft: -32 }}
              initial={{ y: 30 }}
              animate={{ y: -900 }}
              transition={{ duration: 1.3, ease: 'easeIn', delay: 0.15 }}
            >
              {/* flame trail — below the rocket now that it points straight up */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  left: '50%', top: 58, width: 14, height: 44, marginLeft: -7,
                  background: 'linear-gradient(to bottom, rgba(253,224,71,0.95) 0%, rgba(249,115,22,0.6) 45%, rgba(249,115,22,0) 85%)',
                  filter: 'blur(2px)',
                }}
                animate={{ scaleY: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 0.15, repeat: Infinity }}
              />
              <Rocket
                className="w-16 h-16 relative"
                strokeWidth={1.5}
                style={{
                  transform: 'rotate(-45deg)',
                  color: '#67e8f9',
                  filter: 'drop-shadow(0 0 3px #67e8f9) drop-shadow(0 0 9px #22d3ee) drop-shadow(0 0 18px #0891b2)',
                }}
              />
            </motion.div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="alarm"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.35) 0%, rgba(239,68,68,0) 70%)' }}
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 0.5, repeat: 4 }}
            />
            <motion.div
              className="text-red-500"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.4, repeat: 3 }}
            >
              <Siren className="w-14 h-14" strokeWidth={1.5} />
            </motion.div>
            <motion.p
              className="text-red-400 font-mono text-lg tracking-widest"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.5, repeat: 3 }}
            >
              SYSTEM MALFUNCTION
            </motion.p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="planet" className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div
              className="relative"
              style={{ boxShadow: '0 0 60px 10px rgba(196,132,252,0.18)', borderRadius: '9999px', perspective: 700 }}
              initial={{ width: 40, height: 40 }}
              animate={{ width: 380, height: 380 }}
              transition={{ duration: 1.4, ease: 'easeIn' }}
            >
              {/* a sphere's silhouette is a circle from any viewing angle, so
                  the outer ring stays put — only the continent pattern
                  underneath needs to rotate */}
              {/* the ring lives inside the same rotating group as the
                  continents now — ring + continents move as one rigid
                  object, squashing together through the turn, instead of a
                  static hoop with the pattern spinning inside it */}
              <motion.div
                className="absolute inset-0"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: 360 }}
                transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
              >
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 36 36"
                  style={{ backfaceVisibility: 'hidden', filter: GLOBE_GLOW }}
                >
                  <defs>
                    <linearGradient id="globeNeonFront" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="50%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                  <circle cx="18" cy="18" r="17.3" fill="none" stroke="url(#globeNeonFront)" strokeWidth="0.5" />
                  <path fill="none" stroke="url(#globeNeonFront)" strokeWidth="0.45" strokeLinejoin="round" d={GLOBE_FRONT_PATH} />
                </svg>
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 36 36"
                  style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', filter: GLOBE_GLOW }}
                >
                  <defs>
                    <linearGradient id="globeNeonBack" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="50%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                  <circle cx="18" cy="18" r="17.3" fill="none" stroke="url(#globeNeonBack)" strokeWidth="0.5" />
                  <path fill="none" stroke="url(#globeNeonBack)" strokeWidth="0.45" strokeLinejoin="round" d={GLOBE_BACK_PATH} />
                </svg>
              </motion.div>
            </motion.div>
            <motion.p
              className="absolute text-white font-mono text-sm bottom-24"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Tech Planet
            </motion.p>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="crash"
            className="absolute inset-0 bg-white flex items-center justify-center"
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], x: [0, -6, 6, -4, 0], y: [0, 4, -4, 2, 0] }}
            transition={{ duration: 0.9, times: [0, 0.15, 0.7, 1] }}
          />
        )}

        {step === 4 && (
          <motion.div
            key="title"
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-950 to-sky-950"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="relative flex items-center justify-center">
              <motion.div
                className="absolute rounded-full bg-amber-400"
                style={{ width: 60, height: 60, filter: 'blur(18px)' }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.5, scale: 1.4 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              />
              {Array.from({ length: 8 }, (_, i) => i).map((i) => {
                const angle = (i / 8) * Math.PI * 2
                return (
                  <motion.div
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className="absolute rounded-full bg-amber-300"
                    style={{ width: 3, height: 3 }}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{ x: Math.cos(angle) * 40, y: Math.sin(angle) * 40 - 10, opacity: 0 }}
                    transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                  />
                )
              })}
              <motion.div
                className="relative text-amber-400"
                initial={{ y: 20, opacity: 0, scale: 0.7 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 220 }}
              >
                <UserRound className="w-14 h-14" strokeWidth={1.5} />
              </motion.div>
            </div>
            <motion.h1
              className="text-4xl font-black text-white tracking-tight"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
            >
              Ziro&apos;s Tech <span className="text-amber-400">Odyssey</span>
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 right-4 text-xs text-slate-500 font-mono">click / space to skip</div>
    </div>
  )
}
