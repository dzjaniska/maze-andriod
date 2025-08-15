import { useMemo } from 'react'

export function useAudio() {
	const api = useMemo(() => {
		let moveCtx,
			winCtx
		const playBeep = (freq = 600, duration = 0.05, type = 'sine') => {
			const ctx = new (window.AudioContext || window.webkitAudioContext)()
			const o = ctx.createOscillator()
			const g = ctx.createGain()
			o.type = type
			o.frequency.value = freq
			o.connect(g)
			g.connect(ctx.destination)
			g.gain.setValueAtTime(0.0001, ctx.currentTime)
			g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01)
			g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
			o.start()
			o.stop(ctx.currentTime + duration)
		}
		return {
			playMove: () => playBeep(700, 0.03, 'square'),
			playWin: () => playBeep(440, 0.1, 'triangle'),
		}
	}, [])
	return api
}