import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { rngFromSeed, randomSeed, generateMaze, canMove, stepDelta, directionFromKey, findPathBFS, computeCellSize, Direction } from '../utils/mazeUtils'

const ROWS = 25
const COLS = 25
const MOVE_INTERVAL_MS = 130
const CANVAS_SIZE = 640

const COLORS = {
	background: '#f4f5f7',
	wall: '#1f2937',
	grid: '#e5e7eb',
	player: '#f59e0b',
	start: '#10b981',
	finish: '#ef4444',
	auto: '#60a5fa',
}

export default function MazeCanvas({ seed, onVictory, paused, autoPath, setAutoPath, playMove, playWin, autoTrigger, regenTick }) {
	const canvasRef = useRef(null)
	const [maze, setMaze] = useState([])
	const [player, setPlayer] = useState({ r: 0, c: 0, x: 0, y: 0 })
	const [heldDirection, setHeldDirection] = useState(null)
	const [isFocused, setIsFocused] = useState(false)
	const autoIntervalRef = useRef(null)

	const rng = useMemo(() => rngFromSeed(seed || randomSeed()), [seed])

	// Generate maze when seed or regenTick changes
	useEffect(() => {
		const m = generateMaze(ROWS, COLS, rng)
		setMaze(m)
		setPlayer({ r: 0, c: 0, x: 0, y: 0 })
		setAutoPath([])
		// stop any running auto animation
		if (autoIntervalRef.current) {
			clearInterval(autoIntervalRef.current)
			autoIntervalRef.current = null
		}
	}, [rng, setAutoPath, regenTick])

	// Compute sizes
	const { cell, padding } = useMemo(() => computeCellSize(CANVAS_SIZE, ROWS, COLS, 8), [])

	const draw = useCallback((ctx) => {
		ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
		ctx.fillStyle = COLORS.background
		ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

		// Draw start and finish tiles
		ctx.fillStyle = COLORS.start
		ctx.fillRect(padding, padding, cell, cell)
		ctx.fillStyle = COLORS.finish
		ctx.fillRect(padding + (COLS - 1) * cell, padding + (ROWS - 1) * cell, cell, cell)

		// Draw grid walls
		ctx.strokeStyle = COLORS.wall
		ctx.lineWidth = 2
		ctx.beginPath()
		for (let r = 0; r < ROWS; r += 1) {
			for (let c = 0; c < COLS; c += 1) {
				const x = padding + c * cell
				const y = padding + r * cell
				const w = maze[r]?.[c]?.walls
				if (!w) continue
				if (w.top) {
					ctx.moveTo(x, y)
					ctx.lineTo(x + cell, y)
				}
				if (w.right) {
					ctx.moveTo(x + cell, y)
					ctx.lineTo(x + cell, y + cell)
				}
				if (w.bottom) {
					ctx.moveTo(x, y + cell)
					ctx.lineTo(x + cell, y + cell)
				}
				if (w.left) {
					ctx.moveTo(x, y)
					ctx.lineTo(x, y + cell)
				}
			}
		}
		ctx.stroke()

		// Draw auto solver path
		if (autoPath && autoPath.length > 0) {
			ctx.fillStyle = COLORS.auto
			for (const p of autoPath) {
				const x = padding + p.c * cell + cell * 0.25
				const y = padding + p.r * cell + cell * 0.25
				ctx.fillRect(x, y, cell * 0.5, cell * 0.5)
			}
		}

		// Draw player
		ctx.fillStyle = COLORS.player
		const px = padding + player.c * cell + cell * 0.15
		const py = padding + player.r * cell + cell * 0.15
		ctx.beginPath()
		ctx.arc(px + cell * 0.35, py + cell * 0.35, cell * 0.3, 0, Math.PI * 2)
		ctx.fill()
	}, [maze, autoPath, player, cell, padding])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		draw(ctx)
	}, [maze, player, autoPath, draw])

	// Holding key movement interval
	useEffect(() => {
		if (paused || !heldDirection) return
		const id = setInterval(() => {
			attemptMove(heldDirection)
		}, MOVE_INTERVAL_MS)
		return () => clearInterval(id)
	}, [heldDirection, paused])

	const attemptMove = useCallback((dir) => {
		if (paused || !maze.length) return
		const { r, c } = player
		if (!canMove(maze, r, c, dir)) return
		const { dr, dc } = stepDelta(dir)
		const nr = r + dr
		const nc = c + dc
		setPlayer({ r: nr, c: nc, x: 0, y: 0 })
		setAutoPath([])
		playMove?.()
		if (nr === ROWS - 1 && nc === COLS - 1) {
			onVictory?.()
			playWin?.()
		}
	}, [paused, maze, player, setAutoPath, onVictory, playMove, playWin])

	// Keyboard handling
	const onKeyDown = useCallback((e) => {
		if (!isFocused) return
		if (e.repeat) e.preventDefault()
		if (e.key === 'p' || e.key === 'P') return // handled outside
		if (e.key === 'r' || e.key === 'R') return // handled outside
		if (e.code === 'Space') return // handled outside
		const dir = directionFromKey(e.key)
		if (dir) {
			e.preventDefault()
			setHeldDirection(dir)
			attemptMove(dir)
		}
	}, [attemptMove, isFocused])

	const onKeyUp = useCallback((e) => {
		const dir = directionFromKey(e.key)
		if (dir && heldDirection === dir) {
			setHeldDirection(null)
		}
	}, [heldDirection])

	useEffect(() => {
		const handle = (e) => onKeyDown(e)
		const handleUp = (e) => onKeyUp(e)
		document.addEventListener('keydown', handle)
		document.addEventListener('keyup', handleUp)
		return () => {
			document.removeEventListener('keydown', handle)
			document.removeEventListener('keyup', handleUp)
		}
	}, [onKeyDown, onKeyUp])

	// Auto solver animation function
	const runAutoSolver = useCallback(() => {
		if (paused || !maze.length) return
		const path = findPathBFS(maze, { r: player.r, c: player.c }, { r: ROWS - 1, c: COLS - 1 })
		if (path.length <= 1) return
		let i = 1
		setAutoPath(path.slice(0, 1))
		if (autoIntervalRef.current) {
			clearInterval(autoIntervalRef.current)
		}
		autoIntervalRef.current = setInterval(() => {
			if (paused) return
			const next = path[i]
			setAutoPath(path.slice(0, i + 1))
			setPlayer({ r: next.r, c: next.c, x: 0, y: 0 })
			i += 1
			if (i >= path.length) {
				clearInterval(autoIntervalRef.current)
				autoIntervalRef.current = null
				onVictory?.()
				playWin?.()
			}
		}, Math.min(MOVE_INTERVAL_MS, 130))
	}, [maze, player, setAutoPath, onVictory, playWin, paused])

	// Space toggles auto: if running -> stop, else -> start
	useEffect(() => {
		if (autoTrigger == null) return
		if (autoIntervalRef.current) {
			clearInterval(autoIntervalRef.current)
			autoIntervalRef.current = null
			setAutoPath([])
			return
		}
		runAutoSolver()
	}, [autoTrigger, runAutoSolver, setAutoPath])

	// Pause should stop auto interval
	useEffect(() => {
		if (paused && autoIntervalRef.current) {
			clearInterval(autoIntervalRef.current)
			autoIntervalRef.current = null
		}
	}, [paused])

	useEffect(() => () => { if (autoIntervalRef.current) clearInterval(autoIntervalRef.current) }, [])

	return (
		<div style={{ display: 'inline-block' }}>
			<canvas
				ref={canvasRef}
				width={CANVAS_SIZE}
				height={CANVAS_SIZE}
				tabIndex={0}
				style={{ outline: isFocused ? '2px solid #60a5fa' : 'none', cursor: 'pointer', background: COLORS.background }}
				onClick={() => setIsFocused(true)}
				aria-label="Maze canvas"
			/>
			<div style={{ marginTop: 8, color: '#6b7280', fontSize: 12 }}>
				Click the canvas to focus. Arrow keys to move. P: pause, R: new, Space: auto-solve.
			</div>
		</div>
	)
}