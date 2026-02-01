import { useEffect, useRef } from 'react';

interface PanDetail {
    x: number;
    y: number;
    dx?: number;
    dy?: number;
    target?: EventTarget | null;
}

interface UsePannableProps {
    onPanStart?: (detail: PanDetail) => void;
    onPanMove?: (detail: PanDetail) => void;
    onPanEnd?: (detail: PanDetail) => void;
}

export function usePannable<T extends HTMLElement>({
    onPanStart,
    onPanMove,
    onPanEnd,
}: UsePannableProps) {
    const ref = useRef<T>(null);
    const handlers = useRef({ onPanStart, onPanMove, onPanEnd });
    const state = useRef({ x: 0, y: 0, isPanning: false });

    // Update handlers ref so listeners always use the latest ones without re-attaching
    useEffect(() => {
        handlers.current = { onPanStart, onPanMove, onPanEnd };
    }, [onPanStart, onPanMove, onPanEnd]);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const handleMousedown = (event: MouseEvent) => {
            // Only handle left click
            if (event.button !== 0) return;

            state.current.x = event.clientX;
            state.current.y = event.clientY;
            state.current.isPanning = true;

            handlers.current.onPanStart?.({
                x: state.current.x,
                y: state.current.y,
                target: event.target,
            });

            window.addEventListener('mousemove', handleMousemove);
            window.addEventListener('mouseup', handleMouseup);
        };

        const handleMousemove = (event: MouseEvent) => {
            if (!state.current.isPanning) return;

            const dx = event.clientX - state.current.x;
            const dy = event.clientY - state.current.y;
            // We don't update state.current.x/y here because Image.tsx uses 
            // the initial startX/startY to calculate total delta.
            // Or if it uses relative delta, we should update it. 
            // Image.tsx currently uses (currentX - startX).

            handlers.current.onPanMove?.({
                x: event.clientX,
                y: event.clientY,
                dx,
                dy
            });
        };

        const handleMouseup = (event: MouseEvent) => {
            if (!state.current.isPanning) return;
            state.current.isPanning = false;

            handlers.current.onPanEnd?.({
                x: event.clientX,
                y: event.clientY
            });

            window.removeEventListener('mousemove', handleMousemove);
            window.removeEventListener('mouseup', handleMouseup);
        };

        const handleTouchStart = (event: TouchEvent) => {
            if (event.touches.length > 1) return;
            const touch = event.touches[0];
            state.current.x = touch.clientX;
            state.current.y = touch.clientY;
            state.current.isPanning = true;

            handlers.current.onPanStart?.({
                x: state.current.x,
                y: state.current.y,
                target: touch.target,
            });

            window.addEventListener('touchmove', handleTouchmove, { passive: false });
            window.addEventListener('touchend', handleTouchend);
        };

        const handleTouchmove = (event: TouchEvent) => {
            if (!state.current.isPanning || event.touches.length > 1) return;
            event.preventDefault();

            const touch = event.touches[0];
            const dx = touch.clientX - state.current.x;
            const dy = touch.clientY - state.current.y;

            handlers.current.onPanMove?.({
                x: touch.clientX,
                y: touch.clientY,
                dx,
                dy
            });
        };

        const handleTouchend = (event: TouchEvent) => {
            if (!state.current.isPanning) return;
            state.current.isPanning = false;

            const touch = event.changedTouches[0];
            handlers.current.onPanEnd?.({
                x: touch.clientX,
                y: touch.clientY
            });

            window.removeEventListener('touchmove', handleTouchmove);
            window.removeEventListener('touchend', handleTouchend);
        };

        node.addEventListener('mousedown', handleMousedown);
        node.addEventListener('touchstart', handleTouchStart);

        return () => {
            node.removeEventListener('mousedown', handleMousedown);
            node.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('mousemove', handleMousemove);
            window.removeEventListener('mouseup', handleMouseup);
            window.removeEventListener('touchmove', handleTouchmove);
            window.removeEventListener('touchend', handleTouchend);
        };
    }, []); // Only attach once

    return ref;
}
