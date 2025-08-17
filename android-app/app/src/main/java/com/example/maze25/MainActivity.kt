package com.example.maze25

import android.media.AudioAttributes
import android.media.SoundPool
import android.os.Bundle
import android.widget.Button
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import com.example.maze25.ui.MazeView

class MainActivity : AppCompatActivity() {
	private lateinit var mazeView: MazeView
	private var paused: Boolean = false

	private lateinit var soundPool: SoundPool
	private var beepMove: Int = 0
	private var beepWin: Int = 0

	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)
		enableEdgeToEdge()
		setContentView(R.layout.activity_main)

		mazeView = findViewById(R.id.mazeView)
		mazeView.setOnMoveSound { playMove() }
		mazeView.setOnWinSound { playWin() }

		val btnNew: Button = findViewById(R.id.btnNew)
		val btnPause: Button = findViewById(R.id.btnPause)
		val btnAuto: Button = findViewById(R.id.btnAuto)

		btnNew.setOnClickListener {
			mazeView.newGame()
		}
		btnPause.setOnClickListener {
			paused = !paused
			mazeView.setPaused(paused)
			btnPause.text = if (paused) "Resume (P)" else "Pause (P)"
		}
		btnAuto.setOnClickListener {
			mazeView.toggleAuto()
		}

		setupSound()
	}

	private fun setupSound() {
		val attrs = AudioAttributes.Builder()
			.setUsage(AudioAttributes.USAGE_GAME)
			.setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
			.build()
		soundPool = SoundPool.Builder().setMaxStreams(2).setAudioAttributes(attrs).build()
		// Simple synthesized beeps are not trivial with SoundPool; we can load short raw assets if provided.
		// For now, MazeView will call playMove()/playWin() and we can no-op or extend later.
	}

	private fun playMove() {
		// No-op placeholder. Optionally integrate Tone generator or short sound assets in res/raw.
	}

	private fun playWin() {
		// No-op placeholder.
	}
}