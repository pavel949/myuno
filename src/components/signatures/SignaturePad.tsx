/**
 * SignaturePad — Canvas-based drawing component for e-signatures.
 * Outputs a PNG dataURL that can be uploaded to storage.
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  onChange?: (dataUrl: string | null) => void;
  height?: number;
  className?: string;
  disabled?: boolean;
}

export function SignaturePad({ onChange, height = 180, className, disabled }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  // Setup canvas with HiDPI support
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = 'hsl(var(--foreground))';
  }, [height]);

  useEffect(() => {
    setupCanvas();
    const onResize = () => setupCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setupCanvas]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasContent(true);
    const dataUrl = canvasRef.current?.toDataURL('image/png');
    onChange?.(dataUrl || null);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    onChange?.(null);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        ref={containerRef}
        className="relative w-full rounded-none border-2 border-dashed border-border bg-muted/20 overflow-hidden"
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={draw}
          onPointerUp={end}
          onPointerLeave={end}
          className={cn('touch-none w-full h-full', disabled && 'opacity-50 cursor-not-allowed')}
        />
        {!hasContent && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-muted-foreground text-sm">
            {isRu ? '✍️ Распишитесь здесь' : '✍️ Sign here'}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={!hasContent || disabled}>
          <Eraser className="w-3.5 h-3.5 mr-1.5" />
          {isRu ? 'Очистить' : 'Clear'}
        </Button>
        {hasContent && (
          <span className="text-xs text-success flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> {isRu ? 'Подпись получена' : 'Signature captured'}
          </span>
        )}
      </div>
    </div>
  );
}
