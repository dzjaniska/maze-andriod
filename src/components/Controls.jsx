import { useCallback, useState } from 'react'

export default function Controls({ seed, setSeed, paused, setPaused, onNewGame, onAuto }) {
	const [localSeed, setLocalSeed] = useState(seed || '')

	const applySeed = useCallback(() => {
		setSeed(localSeed)
		onNewGame?.()
	}, [localSeed, setSeed, onNewGame])

	return (
		<div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
			<button onClick={onNewGame}>New Game (R)</button>
			<button onClick={() => setPaused(!paused)}>{paused ? 'Resume (P)' : 'Pause (P)'}</button>
			<button onClick={onAuto}>Auto-solve (Space)</button>
			<label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
				<span>Seed:</span>
				<input value={localSeed} onChange={(e) => setLocalSeed(e.target.value)} placeholder="optional" />
				<button onClick={applySeed}>Apply</button>
			</label>
		</div>
	)
}