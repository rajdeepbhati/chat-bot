'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Check, Copy, Download, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MermaidBlockProps {
  code: string;
  className?: string;
}

// Initialize mermaid once
let mermaidInitialized = false;

const initMermaid = () => {
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    });
    mermaidInitialized = true;
  }
};

export function MermaidBlock({ code, className }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    initMermaid();
    renderDiagram();
  }, [code]);

  const renderDiagram = async () => {
    if (!containerRef.current) return;
    
    setIsLoading(true);
    setHasError(false);

    try {
      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      const { svg } = await mermaid.render(id, code);
      setSvgContent(svg);
      setHasError(false);
      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
      }
    } catch (e) {
      // Log error to console only, don't show anything in UI
      console.error('Mermaid rendering error:', (e as Error).message);
      setHasError(true);
      setSvgContent('');
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    if (!svgContent) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mermaid-diagram.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = async () => {
    if (!svgContent) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = 'mermaid-diagram.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    img.src = url;
  };

  // Don't render anything if there's an error
  if (hasError) {
    return null;
  }

  return (
    <div className={cn('relative group my-3 rounded-lg overflow-hidden bg-zinc-800 dark:bg-zinc-900 border border-zinc-700', className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
        <span className="text-xs text-zinc-400 font-mono">Mermaid Diagram</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadPNG}
            disabled={!svgContent}
            className="h-7 px-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
            title="Download as PNG"
          >
            <FileImage className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadSVG}
            disabled={!svgContent}
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
            title="Copy Code"
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
        className={cn(
          'p-4 overflow-x-auto flex items-center justify-center min-h-[100px] max-w-full',
          isLoading && 'animate-pulse bg-zinc-700/50'
        )}
        style={{ contain: 'content' }}
      />
    </div>
  );
}
