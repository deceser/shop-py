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
