import { useEffect, useRef, useState } from 'react';
import { initialCalc, press, transferValue, type CalcKey, type CalcState } from './calcEngine.ts';

interface Props {
  state: CalcState | undefined;
  onState: (s: CalcState) => void;
  onClose: () => void;
  /** Called with the display value when Transfer Display is pressed; undefined disables the button. */
  onTransfer?: (value: string) => void;
}

const ROWS: { label: string; key: CalcKey; cls?: string }[][] = [
  [
    { label: 'MR', key: 'MR', cls: 'k-dark' },
    { label: 'MC', key: 'MC', cls: 'k-dark' },
    { label: 'M+', key: 'M+', cls: 'k-dark' },
    { label: '(', key: '(', cls: 'k-blue' },
    { label: ')', key: ')', cls: 'k-blue' },
  ],
  [
    { label: '7', key: '7' },
    { label: '8', key: '8' },
    { label: '9', key: '9' },
    { label: '÷', key: '/', cls: 'k-blue' },
    { label: 'C', key: 'C', cls: 'k-orange' },
  ],
  [
    { label: '4', key: '4' },
    { label: '5', key: '5' },
    { label: '6', key: '6' },
    { label: '×', key: '*', cls: 'k-blue' },
    { label: 'CE', key: 'CE', cls: 'k-orange' },
  ],
  [
    { label: '1', key: '1' },
    { label: '2', key: '2' },
    { label: '3', key: '3' },
    { label: '−', key: '-', cls: 'k-blue' },
    { label: '√', key: 'sqrt', cls: 'k-blue' },
  ],
  [
    { label: '±', key: 'neg', cls: 'k-blue' },
    { label: '0', key: '0' },
    { label: '.', key: '.' },
    { label: '+', key: '+', cls: 'k-blue' },
    { label: '=', key: '=', cls: 'k-dark' },
  ],
];

const KEYMAP: Record<string, CalcKey> = {
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  '.': '.', '+': '+', '-': '-', '*': '*', '/': '/', '(': '(', ')': ')', '=': '=', Enter: '=',
};

export function Calculator({ state, onState, onClose, onTransfer }: Props) {
  const s = state ?? initialCalc();
  const [pos, setPos] = useState(() => ({ x: Math.max(20, window.innerWidth - 330), y: 120 }));
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!drag.current) return;
      setPos({
        x: Math.min(Math.max(0, e.clientX - drag.current.dx), window.innerWidth - 220),
        y: Math.min(Math.max(0, e.clientY - drag.current.dy), window.innerHeight - 80),
      });
    };
    const up = () => (drag.current = null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  useEffect(() => {
    boxRef.current?.focus();
  }, []);

  const hit = (k: CalcKey) => onState(press(s, k));

  return (
    <div
      ref={boxRef}
      className="calc"
      style={{ left: pos.x, top: pos.y }}
      tabIndex={0}
      onKeyDown={(e) => {
        const k = KEYMAP[e.key];
        if (k) {
          e.preventDefault();
          e.stopPropagation();
          hit(k);
        }
      }}
      onPointerDown={() => boxRef.current?.focus()}
    >
      <div
        className="calc-title"
        onPointerDown={(e) => {
          drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
        }}
      >
        <span>Calculator</span>
        <button type="button" className="calc-close" aria-label="Close calculator" onClick={onClose} onPointerDown={(e) => e.stopPropagation()}>
          ✕
        </button>
      </div>
      <div className="calc-display">
        <span className="calc-m">{s.memory !== null ? 'M' : ''}</span>
        <span className="calc-value" data-testid="calc-display">{s.display}</span>
      </div>
      <div className="calc-keys">
        {ROWS.flat().map((b) => (
          <button key={b.label} type="button" className={`calc-key ${b.cls ?? ''}`} onClick={() => hit(b.key)} data-key={b.key}>
            {b.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="calc-transfer"
        disabled={!onTransfer || s.error}
        onClick={() => onTransfer?.(transferValue(s))}
      >
        Transfer Display
      </button>
    </div>
  );
}
