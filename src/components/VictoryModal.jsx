export default function VictoryModal({ visible, onNewGame }) {
	if (!visible) return null
	return (
		<div style={{
			position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
		}}>
			<div style={{ background: 'white', padding: 24, borderRadius: 8, minWidth: 280, textAlign: 'center' }}>
				<h2 style={{ marginTop: 0 }}>Victory!</h2>
				<p>You reached the finish cell.</p>
				<button onClick={onNewGame}>New Game</button>
			</div>
		</div>
	)
}