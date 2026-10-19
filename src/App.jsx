import { useEffect, useState, lazy, Suspense } from 'react'
import HUD from './components/HUD/HUD.jsx'
import DialogueBox from './components/DialogueBox/DialogueBox.jsx'
import ChallengePanelRouter from './components/ChallengePanelRouter.jsx'
import Inventory from './components/Inventory/Inventory.jsx'
import MainMenu from './components/Menus/MainMenu.jsx'
import SettingsModal from './components/Menus/SettingsModal.jsx'
import StatsScreen from './components/Menus/StatsScreen.jsx'
import Overworld from './components/Menus/Overworld.jsx'
import ShortcutsOverlay from './components/Menus/ShortcutsOverlay.jsx'
import GlossaryBook from './components/Menus/GlossaryBook.jsx'
import QuestLog from './components/Menus/QuestLog.jsx'
import ZoneComplete from './components/Menus/ZoneComplete.jsx'
import OpeningCutscene from './components/Menus/OpeningCutscene.jsx'
import ZoneTransitionCard from './components/ZoneTransitionCard.jsx'
import { useGameStore } from './store/gameStore.js'
import { unlockAudio, toggleMute } from './utils/audioEngine.js'
import { isCapturingKeybind } from './utils/keybinds.js'

// The Phaser game engine (~1.5MB) is the single heaviest thing in the app and
// isn't needed until the player actually starts playing — lazy-load it so the
// main menu paints immediately instead of waiting on the whole engine.
const GameCanvas = lazy(() => import('./components/GameCanvas.jsx'))

export default function App() {
  const [started, setStarted] = useState(false)
  const [cutscene, setCutscene] = useState(false)
  const dialogue = useGameStore((s) => s.dialogue)
  const activeChallenge = useGameStore((s) => s.activeChallenge)
  const toggleInventory = useGameStore((s) => s.toggleInventory)
  const toggleSettings = useGameStore((s) => s.toggleSettings)
  const toggleStats = useGameStore((s) => s.toggleStats)
  const toggleOverworld = useGameStore((s) => s.toggleOverworld)
  const showOverworld = useGameStore((s) => s.showOverworld)
  const toggleShortcuts = useGameStore((s) => s.toggleShortcuts)
  const showShortcuts = useGameStore((s) => s.showShortcuts)
  const toggleGlossary = useGameStore((s) => s.toggleGlossary)
  const showGlossary = useGameStore((s) => s.showGlossary)
  const toggleQuests = useGameStore((s) => s.toggleQuests)
  const showQuests = useGameStore((s) => s.showQuests)
  const tickPlayTime = useGameStore((s) => s.tickPlayTime)

  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    // saves are debounced — make sure the latest state actually lands on
    // disk if the tab is closed/backgrounded before the debounce fires
    const flush = () => useGameStore.getState().flushSave()
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    if (!started) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape' && showOverworld) { toggleOverworld(); return }
      if (e.key === 'Escape' && showShortcuts) { toggleShortcuts(); return }
      if (e.key === 'Escape' && showGlossary) { toggleGlossary(); return }
      if (e.key === 'Escape' && showQuests) { toggleQuests(); return }
      // the glossary has a real text input — don't let any other shortcut
      // (including mute) hijack a keystroke someone's typing into its search box
      if (showGlossary) return
      // a Settings > Controls row is mid-capture for a rebind — every other
      // shortcut sits out except Escape, which still needs to close the
      // modal normally (see SettingsModal.jsx's RebindRow for why Escape
      // isn't handled there directly)
      if (isCapturingKeybind() && e.key !== 'Escape') return
      if (e.key.toLowerCase() === 'm') { toggleMute(); return }
      // activeChallenge means a Monaco editor or terminal input has focus —
      // don't hijack normal typing (esp. the very common letters "k"/"g")
      if (dialogue || activeChallenge) return
      if (e.key.toLowerCase() === 'i') toggleInventory()
      if (e.key === 'Tab') { e.preventDefault(); toggleStats() }
      if (e.key.toLowerCase() === 'o') toggleOverworld()
      if (e.key.toLowerCase() === 'k') toggleShortcuts()
      if (e.key.toLowerCase() === 'g') toggleGlossary()
      if (e.key.toLowerCase() === 'q') toggleQuests()
      if (e.key === 'Escape') toggleSettings()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    started, dialogue, activeChallenge, toggleInventory, toggleSettings, toggleStats,
    toggleOverworld, showOverworld, toggleShortcuts, showShortcuts, toggleGlossary, showGlossary,
    toggleQuests, showQuests,
  ])

  useEffect(() => {
    if (!started) return undefined
    // Monaco (~3.6MB) only loads once a challenge panel first mounts, so the
    // very first chest anyone opens shows a brief loading flash while it
    // fetches. Quietly prefetch it once gameplay actually starts — well
    // after the main menu/cutscene, and idle so it never competes with
    // Phaser's own startup — so by the time a player reaches a chest it's
    // already cached.
    const warm = () => {
      import('@monaco-editor/react')
      import('./utils/monacoSetup.js')
    }
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(warm, { timeout: 4000 })
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(warm, 2000)
    return () => clearTimeout(id)
  }, [started])

  useEffect(() => {
    if (!started) return undefined
    const interval = setInterval(() => tickPlayTime(30), 30000)
    return () => clearInterval(interval)
  }, [started, tickPlayTime])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {started ? (
        <>
          <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm animate-pulse">Loading Tech Planet…</div>}>
            <GameCanvas />
          </Suspense>
          <HUD />
          <ZoneTransitionCard />
          <DialogueBox />
          <ChallengePanelRouter />
          <Inventory />
          <SettingsModal onExitToMenu={() => setStarted(false)} />
          <StatsScreen />
          <Overworld />
          <ShortcutsOverlay />
          <GlossaryBook />
          <QuestLog />
          <ZoneComplete />
        </>
      ) : cutscene ? (
        <OpeningCutscene onDone={() => { setCutscene(false); setStarted(true) }} />
      ) : (
        <MainMenu onNewGame={() => setCutscene(true)} onContinue={() => setStarted(true)} />
      )}
    </div>
  )
}
