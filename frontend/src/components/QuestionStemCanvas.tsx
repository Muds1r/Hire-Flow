import { useEffect, useRef } from 'react';

const MAX_WIDTH = 760;
const PAD_X = 32;
const PAD_Y = 28;
const FONT =
  '600 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  if (words.length === 0 || (words.length === 1 && words[0] === '')) {
    return [''];
  }
  const lines: string[] = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const next = `${line} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
    } else {
      lines.push(line);
      line = words[i];
    }
  }
  lines.push(line);
  return lines;
}

type Props = {
  text: string;
};

/** Renders MCQ stem as a canvas image (options stay separate UI controls). */
export function QuestionStemCanvas({ text }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) {
      return;
    }

    const cssWidth = Math.min(wrap.clientWidth || MAX_WIDTH, MAX_WIDTH);
    const contentWidth = cssWidth - PAD_X * 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.font = FONT;
    const lines = wrapLines(ctx, text, contentWidth);
    const lineHeight = 26;
    const cssHeight = PAD_Y * 2 + lines.length * lineHeight;

    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cssWidth, cssHeight);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, cssWidth - 1, cssHeight - 1);

    ctx.font = FONT;
    ctx.fillStyle = '#111827';
    ctx.textBaseline = 'top';
    let y = PAD_Y;
    for (const line of lines) {
      ctx.fillText(line, PAD_X, y);
      y += lineHeight;
    }
  }, [text]);

  if (!text.trim()) {
    return (
      <p className="text-center text-sm font-medium text-red-800">
        Question text is missing. Please contact the hiring team.
      </p>
    );
  }

  return (
    <div ref={wrapRef} className="w-full select-none">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Question"
        className="mx-auto block max-w-full rounded-lg shadow-sm"
      />
    </div>
  );
}
