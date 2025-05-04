// src/App.tsx
import './App.css';
import { useState } from 'react';
import { QRegister, H, X } from './quantum/simulator';

export default function App() {
  const [output, setOutput] = useState<string>('Click “Run Demo”');

  /* Runs two‑qubit Grover search on marked state |11⟩.             */
  const runGrover = () => {
    const qr = new QRegister(2);

    // 1. Hadamard on both qubits -> uniform superposition
    qr.applySingle(0, H);
    qr.applySingle(1, H);

    // 2. Oracle for |11⟩: phase‑flip via Z (implemented as X+CZ+X)
    qr.applySingle(0, X); // (X) maps |11⟩ ↔ |10⟩
    qr.applySingle(1, X);
    qr.applyCNOT(0, 1); // controlled‑Z effect
    qr.applySingle(0, X);
    qr.applySingle(1, X);

    // 3. Diffusion operator (in 2‑qubit case: H⊗2 • (2|00〉〈00|−I) • H⊗2)
    qr.applySingle(0, H);
    qr.applySingle(1, H);
    qr.applySingle(0, X);
    qr.applySingle(1, X);
    qr.applyCNOT(0, 1);
    qr.applySingle(0, X);
    qr.applySingle(1, X);
    qr.applySingle(0, H);
    qr.applySingle(1, H);

    // 4. Measure
    const result = qr.measure().toString(2).padStart(2, '0');
    setOutput(`Measurement: |${result}⟩ (expect |11⟩)`);
  };

  return (
    <main className="flex flex-col items-center gap-4 p-8 font-mono">
      <h1 className="text-2xl">Quantum Simulator</h1>
      <button
        onClick={runGrover}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-500 active:bg-blue-700"
      >
        Run Grover Demo
      </button>
      <pre>{output}</pre>
    </main>
  );
}
