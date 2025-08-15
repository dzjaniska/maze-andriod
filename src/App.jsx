import { useCallback, useEffect, useMemo, useState } from 'react'
import MazeCanvas from './components/MazeCanvas'
import Controls from './components/Controls'
import VictoryModal from './components/VictoryModal'
import Legend from './components/Legend'
import { randomSeed } from './utils/mazeUtils'
import { useAudio } from './hooks/useAudio'
import './App.css'

export default function App() {
	const urlSeed = useMemo(() => new URLSearchParams(window.location.search).get('seed') || '', [])
	const [seed, setSeed] = useState(urlSeed || randomSeed())
	const [customSeed, setCustomSeed] = useState(!!urlSeed)
	const [paused, setPaused] = useState(false)
	const [isVictory, setIsVictory] = useState(false)
	const [autoPath, setAutoPath] = useState([])
	const [autoTrigger, setAutoTrigger] = useState(0)
	const [regenTick, setRegenTick] = useState(0)
	const { playMove, playWin } = useAudio()

	useEffect(() => {
		const usp = new URLSearchParams(window.location.search)
		if (seed) usp.set('seed', seed)
		else usp.delete('seed')
		const url = `${window.location.pathname}?${usp.toString()}`
		window.history.replaceState({}, '', url)
	}, [seed])

	const onNewGame = useCallback(() => {
		setIsVictory(false)
		setAutoPath([])
		if (!customSeed) {
			setSeed(randomSeed())
		} else {
			setRegenTick((n) => n + 1)
		}
	}, [customSeed])

	const onVictory = useCallback(() => setIsVictory(true), [])

	// Global hotkeys for P, R, Space
	useEffect(() => {
		const handler = (e) => {
			if (e.key === 'p' || e.key === 'P') {
				setPaused((p) => !p)
			}
			if (e.key === 'r' || e.key === 'R') {
				e.preventDefault()
				onNewGame()
			}
			if (e.code === 'Space') {
				e.preventDefault()
				setAutoTrigger((t) => t + 1)
			}
		}
		document.addEventListener('keydown', handler)
		return () => document.removeEventListener('keydown', handler)
	}, [onNewGame])

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
			<h1>Maze 25×25</h1>
			<Controls
				seed={seed}
				setSeed={(s) => { setSeed(s); setCustomSeed(!!s); setIsVictory(false); setAutoPath([]); setRegenTick((n) => n + 1) }}
				paused={paused}
				setPaused={setPaused}
				onNewGame={onNewGame}
				onAuto={() => setAutoTrigger((t) => t + 1)}
			/>
			<MazeCanvas
				seed={seed}
				onVictory={onVictory}
				paused={paused || isVictory}
				autoPath={autoPath}
				setAutoPath={setAutoPath}
				playMove={playMove}
				playWin={playWin}
				autoTrigger={autoTrigger}
				regenTick={regenTick}
			/>
			<Legend />
			<VictoryModal visible={isVictory} onNewGame={onNewGame} />
		</div>
	)
}
