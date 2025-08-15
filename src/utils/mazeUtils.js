// Maze utilities: seeded RNG, randomized DFS generation, BFS solver, movement helpers

// Seeded RNG helpers (xmur3 hash + mulberry32 PRNG)
function xmur3(str) {
	let h = 1779033703 ^ str.length;
	for (let i = 0; i < str.length; i += 1) {
		h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	return function () {
		h = Math.imul(h ^ (h >>> 16), 2246822507);
		h = Math.imul(h ^ (h >>> 13), 3266489909);
		h ^= h >>> 16;
		return h >>> 0;
	};
}

function mulberry32(a) {
	return function () {
		let t = (a += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function rngFromSeed(seedString) {
	const seedSource = xmur3(seedString || "maze-seed");
	const a = seedSource();
	return mulberry32(a);
}

export function randomSeed() {
	return Math.random().toString(36).slice(2, 10);
}

// Cell representation: { r, c, walls: { top, right, bottom, left } }
export function createEmptyMaze(rows, cols) {
	const maze = new Array(rows);
	for (let r = 0; r < rows; r += 1) {
		maze[r] = new Array(cols);
		for (let c = 0; c < cols; c += 1) {
			maze[r][c] = {
				r,
				c,
				walls: { top: true, right: true, bottom: true, left: true },
			};
		}
	}
	return maze;
}

const DIRS = [
	{ name: "up", dr: -1, dc: 0, wall: "top", opposite: "bottom" },
	{ name: "right", dr: 0, dc: 1, wall: "right", opposite: "left" },
	{ name: "down", dr: 1, dc: 0, wall: "bottom", opposite: "top" },
	{ name: "left", dr: 0, dc: -1, wall: "left", opposite: "right" },
];

export const Direction = {
	Up: "up",
	Right: "right",
	Down: "down",
	Left: "left",
};

export function inBounds(r, c, rows, cols) {
	return r >= 0 && r < rows && c >= 0 && c < cols;
}

export function getNeighbors(r, c, rows, cols) {
	const neighbors = [];
	for (const d of DIRS) {
		const nr = r + d.dr;
		const nc = c + d.dc;
		if (inBounds(nr, nc, rows, cols)) {
			neighbors.push({ r: nr, c: nc, dir: d });
		}
	}
	return neighbors;
}

function shuffleInPlace(arr, rng) {
	for (let i = arr.length - 1; i > 0; i -= 1) {
		const j = Math.floor(rng() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

export function generateMaze(rows, cols, rng) {
	const maze = createEmptyMaze(rows, cols);
	const visited = new Array(rows * cols).fill(false);
	const stack = [];

	const idx = (r, c) => r * cols + c;
	const startR = 0;
	const startC = 0;
	visited[idx(startR, startC)] = true;
	stack.push({ r: startR, c: startC });

	while (stack.length > 0) {
		const current = stack[stack.length - 1];
		const neighbors = getNeighbors(current.r, current.c, rows, cols).filter((n) => !visited[idx(n.r, n.c)]);
		if (neighbors.length === 0) {
			stack.pop();
			continue;
		}
		shuffleInPlace(neighbors, rng);
		const chosen = neighbors[0];
		// Remove walls between current and chosen
		maze[current.r][current.c].walls[chosen.dir.wall] = false;
		maze[chosen.r][chosen.c].walls[chosen.dir.opposite] = false;
		visited[idx(chosen.r, chosen.c)] = true;
		stack.push({ r: chosen.r, c: chosen.c });
	}
	return maze;
}

export function canMove(maze, r, c, directionName) {
	const cell = maze[r][c];
	switch (directionName) {
		case Direction.Up:
			return !cell.walls.top;
		case Direction.Right:
			return !cell.walls.right;
		case Direction.Down:
			return !cell.walls.bottom;
		case Direction.Left:
			return !cell.walls.left;
		default:
			return false;
	}
}

export function stepDelta(directionName) {
	switch (directionName) {
		case Direction.Up:
			return { dr: -1, dc: 0 };
		case Direction.Right:
			return { dr: 0, dc: 1 };
		case Direction.Down:
			return { dr: 1, dc: 0 };
		case Direction.Left:
			return { dr: 0, dc: -1 };
		default:
			return { dr: 0, dc: 0 };
	}
}

export function directionFromKey(key) {
	if (key === "ArrowUp") return Direction.Up;
	if (key === "ArrowRight") return Direction.Right;
	if (key === "ArrowDown") return Direction.Down;
	if (key === "ArrowLeft") return Direction.Left;
	return null;
}

export function findPathBFS(maze, start, goal) {
	const rows = maze.length;
	const cols = maze[0].length;
	const queue = [];
	const visited = new Array(rows * cols).fill(false);
	const prev = new Array(rows * cols).fill(-1);
	const idx = (r, c) => r * cols + c;

	queue.push(start);
	visited[idx(start.r, start.c)] = true;

	while (queue.length > 0) {
		const current = queue.shift();
		if (current.r === goal.r && current.c === goal.c) break;
		for (const d of DIRS) {
			if (!canMove(maze, current.r, current.c, d.name)) continue;
			const nr = current.r + d.dr;
			const nc = current.c + d.dc;
			if (!inBounds(nr, nc, rows, cols)) continue;
			const j = idx(nr, nc);
			if (visited[j]) continue;
			visited[j] = true;
			prev[j] = idx(current.r, current.c);
			queue.push({ r: nr, c: nc });
		}
	}

	// Reconstruct path
	const path = [];
	let curIndex = idx(goal.r, goal.c);
	if (!visited[curIndex] && !(start.r === goal.r && start.c === goal.c)) {
		return path; // no path
	}
	while (curIndex !== -1) {
		const r = Math.floor(curIndex / cols);
		const c = curIndex % cols;
		path.push({ r, c });
		curIndex = prev[curIndex];
	}
	path.reverse();
	return path;
}

export function computeCellSize(canvasSize, rows, cols, padding = 8) {
	const inner = canvasSize - padding * 2;
	const cell = Math.floor(inner / Math.max(rows, cols));
	return { cell, padding };
}