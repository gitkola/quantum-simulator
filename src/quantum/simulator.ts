// src/quantum/simulator.ts
/* ---------------------------------------------------------------------------
   A minimal, pure‑TypeScript state‑vector quantum simulator for n ≤ 8 qubits.
   Implements:
     • Complex‑number helpers
     • Single‑qubit gate application (Hadamard, Pauli‑X)
     • Two‑qubit CNOT
     • Full‑register measurement with collapse
   The state vector is stored as Float64 pairs [re, im].
--------------------------------------------------------------------------- */

export type Complex = [number, number]; // [re, im]

const add = ([ar, ai]: Complex, [br, bi]: Complex): Complex => [
  ar + br,
  ai + bi,
];
const sub = ([ar, ai]: Complex, [br, bi]: Complex): Complex => [
  ar - br,
  ai - bi,
];
const mul = ([ar, ai]: Complex, [br, bi]: Complex): Complex => [
  ar * br - ai * bi,
  ar * bi + ai * br,
];

export class QRegister {
  readonly n: number;
  private state: Float64Array; // length 2^n * 2  (re,im interleaved)

  constructor(nQubits: number) {
    if (nQubits < 1 || nQubits > 8) throw new Error('n must be 1‑8');
    this.n = nQubits;
    const dim = 1 << nQubits;
    this.state = new Float64Array(dim * 2);
    this.state[0] = 1; // |00…0⟩
  }

  // Fetch (re, im) for index
  private amp(idx: number): Complex {
    const i = idx * 2;
    return [this.state[i], this.state[i + 1]];
  }
  // Set amplitude
  private setAmp(idx: number, [re, im]: Complex): void {
    const i = idx * 2;
    this.state[i] = re;
    this.state[i + 1] = im;
  }

  /* Apply 2×2 gate on target qubit with matrix [[a,b],[c,d]] */
  applySingle(target: number, mat: [Complex, Complex, Complex, Complex]) {
    const dim = 1 << this.n;
    const bit = 1 << target;

    for (let i = 0; i < dim; ++i) {
      if ((i & bit) === 0) {
        const j = i | bit;
        const α = this.amp(i);
        const β = this.amp(j);
        const new0 = add(mul(mat[0], α), mul(mat[1], β));
        const new1 = add(mul(mat[2], α), mul(mat[3], β));
        this.setAmp(i, new0);
        this.setAmp(j, new1);
      }
    }
  }

  /* Controlled‑NOT: flips |target⟩ when |control⟩ = 1 */
  applyCNOT(control: number, target: number) {
    if (control === target) throw new Error('control ≠ target');
    const dim = 1 << this.n;
    const cBit = 1 << control;
    const tBit = 1 << target;

    for (let i = 0; i < dim; ++i) {
      if (i & cBit && (i & tBit) === 0) {
        const j = i | tBit; // flip target
        const α = this.amp(i);
        const β = this.amp(j);
        this.setAmp(i, β);
        this.setAmp(j, α);
      }
    }
  }

  /* Measure all qubits; returns classical integer and collapses state */
  measure(): number {
    const dim = 1 << this.n;
    let r = Math.random();
    for (let i = 0; i < dim; ++i) {
      const [re, im] = this.amp(i);
      r -= re * re + im * im;
      if (r <= 0) {
        // collapse to |i⟩
        this.state.fill(0);
        this.setAmp(i, [1, 0]);
        return i;
      }
    }
    return dim - 1; // numerical safety
  }

  /* Returns probabilities as array of length 2^n */
  probabilities(): number[] {
    const dim = 1 << this.n;
    const p: number[] = new Array(dim);
    for (let i = 0; i < dim; ++i) {
      const [re, im] = this.amp(i);
      p[i] = re * re + im * im;
    }
    return p;
  }
}

/* Convenience constant matrices */
export const H: [Complex, Complex, Complex, Complex] = [
  [1 / Math.SQRT2, 0],
  [1 / Math.SQRT2, 0],
  [1 / Math.SQRT2, 0],
  [-1 / Math.SQRT2, 0],
];
export const X: [Complex, Complex, Complex, Complex] = [
  [0, 0],
  [1, 0],
  [1, 0],
  [0, 0],
];
