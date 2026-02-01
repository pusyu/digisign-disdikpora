'use client';

import { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFPageProps {
    page: pdfjsLib.PDFPageProxy;
    onMeasure: (scale: number) => void;
}

export default function PDFPage({ page, onMeasure }: PDFPageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
    const scaleRef = useRef<number>(0);

    useEffect(() => {
        let isMounted = true;

        const renderPage = async () => {
            const canvas = canvasRef.current;
            if (!canvas || !page) return;

            // Cancel any previous render task
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
                renderTaskRef.current = null;
            }

            const viewport = page.getViewport({ scale: 1 });
            const context = canvas.getContext('2d');
            if (!context) return;

            // Use actual PDF size (scale 1) - display at 100% size
            const scale = 1;
            const scaledViewport = page.getViewport({ scale });

            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
            canvas.style.width = `${scaledViewport.width}px`;
            canvas.style.height = `${scaledViewport.height}px`;

            // Only call onMeasure if scale actually changed
            if (isMounted && scaleRef.current !== scale) {
                scaleRef.current = scale;
                onMeasure(scale);
            }

            const renderContext = {
                canvasContext: context,
                viewport: scaledViewport,
            };

            try {
                renderTaskRef.current = page.render(renderContext);
                await renderTaskRef.current.promise;
                renderTaskRef.current = null;
            } catch (error: any) {
                // Ignore cancellation errors
                if (error?.name !== 'RenderingCancelledException') {
                    console.error('PDF render error:', error);
                }
            }
        };

        renderPage();

        return () => {
            isMounted = false;
            // Cancel render task on cleanup
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
                renderTaskRef.current = null;
            }
        };
    }, [page]);

    return <canvas ref={canvasRef} className="max-w-full" />;
}
