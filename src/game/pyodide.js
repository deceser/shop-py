let pyodideInstance = null;
let loading = false;
let queue = [];

export async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;

  if (loading) {
    return new Promise((res) => queue.push(res));
  }

  loading = true;

  const { loadPyodide } = await import(
    'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.mjs'
  );
  pyodideInstance = await loadPyodide();

  queue.forEach((res) => res(pyodideInstance));
  queue = [];
  loading = false;

  return pyodideInstance;
}

export async function runPyTest(userCode, testCode) {
  const pyodide = await getPyodide();

  const fullCode = `
${userCode}

${testCode}
`;

  try {
    pyodide.runPython(fullCode);
    return { ok: true, error: null };
  } catch (e) {
    const msg = e.message ?? String(e);
    const clean = msg.split('\n').slice(-3).join('\n');
    return { ok: false, error: clean };
  }
}

export async function runMoveCode(code, maxSteps = 50) {
  const pyodide = await getPyodide();

  const wrapper = `
actions = []
_steps = [0]
def _chk():
    _steps[0] += 1
    if _steps[0] > ${maxSteps}:
        raise RuntimeError("Ліміт кроків (${maxSteps})")
def move_right(): _chk(); actions.append('R')
def move_left():  _chk(); actions.append('L')
def move_up():    _chk(); actions.append('U')
def move_down():  _chk(); actions.append('D')

${code}
`;

  try {
    pyodide.runPython(wrapper);
    const raw = pyodide.globals.get('actions').toJs();
    return { ok: true, actions: Array.from(raw), error: null };
  } catch (e) {
    const msg = e.message ?? String(e);
    const clean = msg.split('\n').slice(-3).join('\n');
    return { ok: false, actions: [], error: clean };
  }
}

export async function runDungeonCode(code, state, maxSteps = 120) {
  const pyodide = await getPyodide();

  const { playerPos, keys, walls, gridCols, gridRows } = state;
  const wallsJson = JSON.stringify(walls ?? []);
  const keysJson = JSON.stringify(keys ?? []);

  const wrapper = `
_pos = [${playerPos.x}, ${playerPos.y}]
_collected = []
_keys = ${keysJson}
_walls = ${wallsJson}
_cols = ${gridCols}
_rows = ${gridRows}
_actions = []
_steps = [0]

def _chk():
    _steps[0] += 1
    if _steps[0] > ${maxSteps}:
        raise RuntimeError("Ліміт кроків (${maxSteps})")

def _move(dx, dy, code):
    _chk()
    nx = _pos[0] + dx
    ny = _pos[1] + dy
    blocked = any(w['x'] == nx and w['y'] == ny for w in _walls)
    if 0 <= nx < _cols and 0 <= ny < _rows and not blocked:
        _pos[0] = nx
        _pos[1] = ny
    _actions.append(code)

def move_right(): _move(1, 0, 'R')
def move_left():  _move(-1, 0, 'L')
def move_up():    _move(0, -1, 'U')
def move_down():  _move(0, 1, 'D')

def collect():
    _chk()
    for k in list(_keys):
        if k['x'] == _pos[0] and k['y'] == _pos[1]:
            _keys.remove(k)
            _collected.append({'x': k['x'], 'y': k['y']})
    _actions.append('C')

def has_key():
    return len(_collected) > 0

def pos():
    return (_pos[0], _pos[1])

def is_wall(x, y):
    return any(w['x'] == x and w['y'] == y for w in _walls)

${code}
`;

  try {
    pyodide.runPython(wrapper);
    const actions = Array.from(pyodide.globals.get('_actions').toJs());
    const collected = Array.from(pyodide.globals.get('_collected').toJs()).map((item) => {
      const obj = item instanceof Map ? Object.fromEntries(item) : item;
      return { x: obj.x ?? obj.get?.('x'), y: obj.y ?? obj.get?.('y') };
    });
    const finalPos = Array.from(pyodide.globals.get('_pos').toJs());
    return { ok: true, actions, collected, finalPos: { x: finalPos[0], y: finalPos[1] }, error: null };
  } catch (e) {
    const msg = e.message ?? String(e);
    const clean = msg.split('\n').slice(-3).join('\n');
    return { ok: false, actions: [], collected: [], finalPos: playerPos, error: clean };
  }
}

export async function runPyCode(code) {
  const pyodide = await getPyodide();

  const lines = [];
  const origPrint = pyodide.globals.get('print');

  pyodide.globals.set(
    'print',
    pyodide.toPy((...args) => {
      lines.push(args.map(String).join(' '));
    }),
  );

  try {
    pyodide.runPython(code);
    return { ok: true, output: lines.join('\n'), error: null };
  } catch (e) {
    const msg = e.message ?? String(e);
    const clean = msg.split('\n').slice(-3).join('\n');
    return { ok: false, output: '', error: clean };
  } finally {
    if (origPrint) pyodide.globals.set('print', origPrint);
  }
}
