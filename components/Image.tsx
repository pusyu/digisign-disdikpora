'use client';

import { useEffect, useRef, useState } from 'react';
import { usePannable } from '@/hooks/usePannable';
import { readAsDataURL } from '@/lib/asyncReader';
import type { ImageObject } from '@/types';

interface ImageComponentProps {
    object: ImageObject;
    pageScale: number;
    onUpdate: (id: string, updates: Partial<ImageObject>) => void;
    onDelete: (id: string) => void;
}

export default function ImageComponent({
    object,
    pageScale,
    onUpdate,
    onDelete,
}: ImageComponentProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [operation, setOperation] = useState('');
    const [direction, setDirection] = useState('');
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [dx, setDx] = useState(0);
    const [dy, setDy] = useState(0);
    const [dw, setDw] = useState(0);
    const [dh, setDh] = useState(0);
    const [ratio, setRatio] = useState<number | null>(null);

    const pannableRef = usePannable<HTMLDivElement>({
        onPanStart: (detail) => {
            setStartX(detail.x);
            setStartY(detail.y);

            const target = detail.target as HTMLElement;
            if (target.dataset.direction) {
                setOperation('scale');
                setDirection(target.dataset.direction);
            } else {
                setOperation('move');
            }
        },
        onPanMove: (detail) => {
            const _dx = (detail.x! - startX) / pageScale;
            const _dy = (detail.y! - startY) / pageScale;

            if (operation === 'move') {
                setDx(_dx);
                setDy(_dy);
            } else if (operation === 'scale') {
                let newDw = dw;
                let newDh = dh;

                if (direction.includes('right')) newDw = _dx;
                if (direction.includes('left')) newDw = -_dx;
                if (direction.includes('bottom')) newDh = _dy;
                if (direction.includes('top')) newDh = -_dy;

                if (ratio !== null) {
                    const dhFromDw = (object.width + newDw) / ratio - object.height;
                    if (newDh > dhFromDw) {
                        newDw = (object.height + newDh) * ratio - object.width;
                    } else {
                        newDh = dhFromDw;
                    }
                }

                setDw(newDw);
                setDh(newDh);
                if (direction.includes('left')) setDx(-newDw);
                if (direction.includes('top')) setDy(-newDh);
            }
        },
        onPanEnd: () => {
            if (operation === 'move') {
                onUpdate(object.id, {
                    x: object.x + dx,
                    y: object.y + dy,
                });
                setDx(0);
                setDy(0);
            } else if (operation === 'scale') {
                onUpdate(object.id, {
                    x: object.x + dx,
                    y: object.y + dy,
                    width: object.width + dw,
                    height: object.height + dh,
                });
                setDx(0);
                setDy(0);
                setDw(0);
                setDh(0);
                setDirection('');
            }
            setOperation('');
        },
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !object.payload) return;

        // Set buffer size to match current object size
        canvas.width = object.width;
        canvas.height = object.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Draw image scaled to current width and height
            ctx.drawImage(object.payload, 0, 0, object.width, object.height);
        }
    }, [object.width, object.height, object.payload]); // Re-draw when size changes

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift') {
                setRatio((object.width + dw) / (object.height + dh));
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift') {
                setRatio(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [object, dw, dh]);

    return (
        <div
            className="absolute left-0 top-0 select-none z-10"
            style={{
                width: `${object.width + dw}px`,
                height: `${object.height + dh}px`,
                transform: `translate(${object.x + dx}px, ${object.y + dy}px)`,
                pointerEvents: 'initial', // Ensure container handles clicks
            }}
        >
            <div
                ref={pannableRef}
                className={`absolute w-full h-full cursor-grab ${operation === 'move' ? 'cursor-grabbing' : ''
                    } ${operation ? 'bg-black bg-opacity-30' : ''}`}
                style={{ zIndex: 10 }} // High z-index for controls
            >
                {/* Resize borders */}
                <div data-direction="left" className="resize-border h-full w-2 left-0 top-0 border-l cursor-ew-resize" />
                <div data-direction="top" className="resize-border w-full h-2 left-0 top-0 border-t cursor-ns-resize" />
                <div data-direction="bottom" className="resize-border w-full h-2 left-0 bottom-0 border-b cursor-ns-resize" />
                <div data-direction="right" className="resize-border h-full w-2 right-0 top-0 border-r cursor-ew-resize" />

                {/* Resize corners - Larger hitbox */}
                <div data-direction="left-top" className="resize-corner left-0 top-0 cursor-nwse-resize transform -translate-x-1/2 -translate-y-1/2 w-4 h-4" />
                <div data-direction="right-top" className="resize-corner right-0 top-0 cursor-nesw-resize transform translate-x-1/2 -translate-y-1/2 w-4 h-4" />
                <div data-direction="left-bottom" className="resize-corner left-0 bottom-0 cursor-nesw-resize transform -translate-x-1/2 translate-y-1/2 w-4 h-4" />
                <div data-direction="right-bottom" className="resize-corner right-0 bottom-0 cursor-nwse-resize transform translate-x-1/2 translate-y-1/2 w-4 h-4" />
            </div>

            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(object.id);
                }}
                className="absolute right-0 top-0 w-8 h-8 rounded-full bg-red-500 hover:bg-red-700 text-white flex items-center justify-center cursor-pointer transform translate-x-1/2 -translate-y-1/2 z-20 shadow-md"
                title="Delete image"
            >
                <img className="w-4 h-4 invert" src="/delete.svg" alt="delete" />
            </div>

            <canvas ref={canvasRef} className="w-full h-full pointer-events-none" style={{ zIndex: 1 }} />
        </div>
    );
}
