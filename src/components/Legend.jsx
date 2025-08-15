const Item = ({ color, label }) => (
	<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
		<span style={{ width: 14, height: 14, background: color, display: 'inline-block', borderRadius: 2, border: '1px solid #d1d5db' }} />
		<span>{label}</span>
	</div>
)

export default function Legend() {
	return (
		<div style={{ display: 'flex', gap: 16, alignItems: 'center', color: '#374151', flexWrap: 'wrap' }}>
			<Item color="#10b981" label="Start" />
			<Item color="#ef4444" label="Finish" />
			<Item color="#f59e0b" label="Player" />
			<Item color="#60a5fa" label="Auto path" />
		</div>
	)
}