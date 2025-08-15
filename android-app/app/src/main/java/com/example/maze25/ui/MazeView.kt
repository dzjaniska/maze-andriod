package com.example.maze25.ui

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.Handler
import android.os.Looper
import android.util.AttributeSet
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import kotlin.math.max
import kotlin.random.Random

class MazeView @JvmOverloads constructor(
	context: Context,
	attrs: AttributeSet? = null
) : View(context, attrs) {

	private val rows = 25
	private val cols = 25
	private val moveIntervalMs = 130L
	private val handler = Handler(Looper.getMainLooper())

	private var cellSize: Float = 0f
	private var paddingPx: Float = 16f

	private var maze: Array<Array<Cell>> = emptyArray()
	private var playerR = 0
	private var playerC = 0
	private var autoPath: MutableList<Pair<Int, Int>> = mutableListOf()
	private var autoRunnable: Runnable? = null
	private var paused: Boolean = false

	private var onMoveSound: (() -> Unit)? = null
	private var onWinSound: (() -> Unit)? = null

	private val paintWall = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.parseColor("#1f2937"); strokeWidth = 6f }
	private val paintBg = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.parseColor("#f4f5f7") }
	private val paintPlayer = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.parseColor("#f59e0b") }
	private val paintStart = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.parseColor("#10b981") }
	private val paintFinish = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.parseColor("#ef4444") }
	private val paintAuto = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.parseColor("#60a5fa") }

	init {
		isFocusable = true
		isFocusableInTouchMode = true
		newGame()
	}

	fun setOnMoveSound(cb: () -> Unit) { onMoveSound = cb }
	fun setOnWinSound(cb: () -> Unit) { onWinSound = cb }

	fun setPaused(p: Boolean) {
		paused = p
		if (paused) stopAuto()
	}

	fun newGame() {
		generateMaze()
		playerR = 0
		playerC = 0
		autoPath.clear()
		stopAuto()
		invalidate()
	}

	fun toggleAuto() {
		if (autoRunnable != null) {
			stopAuto()
			autoPath.clear()
			invalidate()
			return
		}
		startAuto()
	}

	private fun startAuto() {
		if (paused) return
		val path = bfsPath(Pair(playerR, playerC), Pair(rows - 1, cols - 1))
		if (path.size <= 1) return
		autoPath.clear()
		autoPath.add(path.first())
		var i = 1
		autoRunnable = object : Runnable {
			override fun run() {
				if (paused) return
				val next = path[i]
				autoPath.add(next)
				playerR = next.first
				playerC = next.second
				invalidate()
				i += 1
				if (i >= path.size) {
					stopAuto()
					onWinSound?.invoke()
				} else {
					handler.postDelayed(this, moveIntervalMs)
				}
			}
		}
		handler.postDelayed(autoRunnable!!, moveIntervalMs)
	}

	private fun stopAuto() {
		autoRunnable?.let { handler.removeCallbacks(it) }
		autoRunnable = null
	}

	override fun onTouchEvent(event: MotionEvent): Boolean {
		if (event.action == MotionEvent.ACTION_DOWN) {
			requestFocus()
			return true
		}
		return super.onTouchEvent(event)
	}

	override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
		when (keyCode) {
			KeyEvent.KEYCODE_DPAD_UP -> return tryMove(0, -1)
			KeyEvent.KEYCODE_DPAD_DOWN -> return tryMove(0, 1)
			KeyEvent.KEYCODE_DPAD_LEFT -> return tryMove(-1, 0)
			KeyEvent.KEYCODE_DPAD_RIGHT -> return tryMove(1, 0)
		}
		return super.onKeyDown(keyCode, event)
	}

	private fun tryMove(dx: Int, dy: Int): Boolean {
		if (paused) return false
		val (dr, dc) = Pair(dy, dx)
		if (!canMove(playerR, playerC, dr, dc)) return false
		playerR += dr
		playerC += dc
		autoPath.clear()
		onMoveSound?.invoke()
		if (playerR == rows - 1 && playerC == cols - 1) {
			onWinSound?.invoke()
		}
		invalidate()
		return true
	}

	private fun generateMaze() {
		maze = Array(rows) { r -> Array(cols) { c -> Cell(r, c) } }
		val rng = Random(System.nanoTime())
		val visited = Array(rows) { BooleanArray(cols) }
		fun dfs(r: Int, c: Int) {
			visited[r][c] = true
			val dirs = mutableListOf(Dir(0, -1, 0), Dir(1, 0, 1), Dir(0, 1, 2), Dir(-1, 0, 3))
			dirs.shuffle(rng)
			for (d in dirs) {
				val nr = r + d.dr
				val nc = c + d.dc
				if (nr !in 0 until rows || nc !in 0 until cols) continue
				if (visited[nr][nc]) continue
				// knock down walls
				maze[r][c].walls[d.idx] = false
				maze[nr][nc].walls[(d.idx + 2) % 4] = false
				dfs(nr, nc)
			}
		}
		dfs(0, 0)
	}

	private fun bfsPath(start: Pair<Int, Int>, goal: Pair<Int, Int>): List<Pair<Int, Int>> {
		val q: ArrayDeque<Pair<Int, Int>> = ArrayDeque()
		val visited = Array(rows) { BooleanArray(cols) }
		val prev = Array(rows) { IntArray(cols) { -1 } }
		q.add(start)
		visited[start.first][start.second] = true
		val dirs = arrayOf(Dir(0, -1, 0), Dir(1, 0, 1), Dir(0, 1, 2), Dir(-1, 0, 3))
		while (q.isNotEmpty()) {
			val cur = q.removeFirst()
			if (cur == goal) break
			for (d in dirs) {
				if (!canMove(cur.first, cur.second, d.dr, d.dc)) continue
				val nr = cur.first + d.dr
				val nc = cur.second + d.dc
				if (nr !in 0 until rows || nc !in 0 until cols) continue
				if (visited[nr][nc]) continue
				visited[nr][nc] = true
				prev[nr][nc] = cur.first * cols + cur.second
				q.add(Pair(nr, nc))
			}
		}
		val path = mutableListOf<Pair<Int, Int>>()
		var idx = goal.first * cols + goal.second
		if (!visited[goal.first][goal.second] && start != goal) return path
		while (idx != -1) {
			val r = idx / cols
			val c = idx % cols
			path.add(Pair(r, c))
			idx = prev[r][c]
		}
		path.reverse()
		return path
	}

	private fun canMove(r: Int, c: Int, dr: Int, dc: Int): Boolean {
		val cell = maze[r][c]
		val dirIdx = when {
			dr == -1 && dc == 0 -> 0 // top
			dr == 0 && dc == 1 -> 1 // right
			dr == 1 && dc == 0 -> 2 // bottom
			dr == 0 && dc == -1 -> 3 // left
			else -> -1
		}
		if (dirIdx == -1) return false
		if (cell.walls[dirIdx]) return false
		val nr = r + dr
		val nc = c + dc
		return nr in 0 until rows && nc in 0 until cols
	}

	override fun onDraw(canvas: Canvas) {
		super.onDraw(canvas)
		canvas.drawColor(paintBg.color)
		cellSize = ((width - paddingPx * 2f).coerceAtMost(height - paddingPx * 2f)) / max(rows, cols)

		// start
		canvas.drawRect(
			paddingPx,
			paddingPx,
			paddingPx + cellSize,
			paddingPx + cellSize,
			paintStart
		)
		// finish
		canvas.drawRect(
			paddingPx + (cols - 1) * cellSize,
			paddingPx + (rows - 1) * cellSize,
			paddingPx + cols * cellSize,
			paddingPx + rows * cellSize,
			paintFinish
		)

		// walls
		for (r in 0 until rows) {
			for (c in 0 until cols) {
				val x = paddingPx + c * cellSize
				val y = paddingPx + r * cellSize
				val w = maze[r][c].walls
				if (w[0]) canvas.drawLine(x, y, x + cellSize, y, paintWall)
				if (w[1]) canvas.drawLine(x + cellSize, y, x + cellSize, y + cellSize, paintWall)
				if (w[2]) canvas.drawLine(x, y + cellSize, x + cellSize, y + cellSize, paintWall)
				if (w[3]) canvas.drawLine(x, y, x, y + cellSize, paintWall)
			}
		}

		// auto path
		for (p in autoPath) {
			val x = paddingPx + p.second * cellSize + cellSize * 0.25f
			val y = paddingPx + p.first * cellSize + cellSize * 0.25f
			canvas.drawRect(x, y, x + cellSize * 0.5f, y + cellSize * 0.5f, paintAuto)
		}

		// player
		val px = paddingPx + playerC * cellSize + cellSize * 0.15f
		val py = paddingPx + playerR * cellSize + cellSize * 0.15f
		canvas.drawCircle(px + cellSize * 0.35f, py + cellSize * 0.35f, cellSize * 0.3f, paintPlayer)
	}

	private data class Cell(val r: Int, val c: Int, val walls: BooleanArray = booleanArrayOf(true, true, true, true))
	private data class Dir(val dr: Int, val dc: Int, val idx: Int)
}