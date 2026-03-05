'use client';

import { useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { Button } from '@/components/ui/button';
import { Check, Copy, Download, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';

interface MathBlockProps {
  latex: string;
  isInline?: boolean;
  className?: string;
}

export function MathBlock({ latex, isInline = false, className }: MathBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const renderedLatex = useMemo(() => {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: !isInline,
      trust: false,
    });
  }, [latex, isInline]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = async () => {
    if (!containerRef.current) return;

    // Create SVG from the rendered content
    const content = containerRef.current.innerHTML;
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: center; justify-content: center; height: 100%; background: white;">
          ${content}
        </div>
      </foreignObject>
    </svg>`;
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'math-equation.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = async () => {
    if (!containerRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 200;

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create an image from SVG
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 20px; background: white;">
          ${containerRef.current.innerHTML}
        </div>
      </foreignObject>
    </svg>`;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = 'math-equation.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    img.src = url;
  };

  if (isInline) {
    return (
      <span
        className={cn('inline-block', className)}
        dangerouslySetInnerHTML={{ __html: renderedLatex }}
      />
    );
  }

  return (
    <div className={cn('relative group my-3 rounded-lg overflow-hidden bg-zinc-800 dark:bg-zinc-900 border border-zinc-700', className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
        <span className="text-xs text-zinc-400 font-mono">LaTeX</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadPNG}
            className="h-7 px-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
            title="Download as PNG"
          >
            <FileImage className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadSVG}
            className="h-7 px-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
            title="Download as SVG"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
            title="Copy LaTeX"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="p-4 overflow-x-auto text-center text-white"
        dangerouslySetInnerHTML={{ __html: renderedLatex }}
      />
    </div>
  );
}
