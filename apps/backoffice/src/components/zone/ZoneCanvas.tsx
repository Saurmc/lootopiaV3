import { useRef, useState, useEffect, useCallback } from 'react';
import type { ZoneDto, ZoneShape, ZoneShapeType } from '@/services/zones.service';

interface ZoneCanvasProps {
  planUrl: string;
  zones: ZoneDto[];
  shapeType: ZoneShapeType;
  onShapeCommit: (shape: ZoneShape) => void;
}

interface Point { x: number; y: number }

function toSvgPoints(points: [number, number][] = []): string {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

export default function ZoneCanvas({ planUrl, zones, shapeType, onShapeCommit }: ZoneCanvasProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<Point | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);

  useEffect(() => {
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    setPolygonPoints([]);
    setDrawStart(null);
    setDrawCurrent(null);
    setIsDragging(false);
  }, [shapeType]);

  const getSvgPoint = useCallback((e: React.MouseEvent): Point => {
    const img = imgRef.current;
    if (!img || !img.clientWidth || !img.clientHeight) return { x: 0, y: 0 };
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    return {
      x: e.nativeEvent.offsetX * scaleX,
      y: e.nativeEvent.offsetY * scaleY,
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (shapeType === 'polygon') return;
    const pt = getSvgPoint(e);
    setDrawStart(pt);
    setDrawCurrent(pt);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || shapeType === 'polygon') return;
    setDrawCurrent(getSvgPoint(e));
  };

  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !drawStart || shapeType === 'polygon') return;
    setIsDragging(false);
    const end = getSvgPoint(e);
    if (shapeType === 'rect') {
      onShapeCommit({
        type: 'rect',
        x: Math.min(drawStart.x, end.x),
        y: Math.min(drawStart.y, end.y),
        width: Math.abs(end.x - drawStart.x),
        height: Math.abs(end.y - drawStart.y),
      });
    } else if (shapeType === 'circle') {
      const radius = Math.sqrt((end.x - drawStart.x) ** 2 + (end.y - drawStart.y) ** 2);
      onShapeCommit({ type: 'circle', cx: drawStart.x, cy: drawStart.y, radius });
    }
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (shapeType !== 'polygon') return;
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    if (e.detail === 1) {
      const pt = getSvgPoint(e);
      clickTimerRef.current = setTimeout(() => {
        setPolygonPoints(prev => [...prev, pt]);
        clickTimerRef.current = null;
      }, 250);
    } else if (e.detail >= 2) {
      setPolygonPoints(prev => {
        if (prev.length >= 3) {
          onShapeCommit({
            type: 'polygon',
            points: prev.map(p => [p.x, p.y] as [number, number]),
          });
        }
        return [];
      });
    }
  };

  const natW = naturalSize.w || 800;
  const natH = naturalSize.h || 600;

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <img
        ref={imgRef}
        src={planUrl}
        alt="Plan"
        style={{ display: 'block', width: '100%', userSelect: 'none' }}
        draggable={false}
        onLoad={() => {
          if (imgRef.current) {
            setNaturalSize({
              w: imgRef.current.naturalWidth,
              h: imgRef.current.naturalHeight,
            });
          }
        }}
      />
      {naturalSize.w > 0 && (
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'crosshair' }}
          viewBox={`0 0 ${natW} ${natH}`}
          preserveAspectRatio="none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
        >
          {zones.map(z => {
            if (z.shape.type === 'rect') {
              return (
                <rect
                  key={z.id}
                  x={z.shape.x}
                  y={z.shape.y}
                  width={z.shape.width}
                  height={z.shape.height}
                  fill="rgba(99,102,241,0.2)"
                  stroke="#6366f1"
                  strokeWidth="2"
                />
              );
            }
            if (z.shape.type === 'circle') {
              return (
                <circle
                  key={z.id}
                  cx={z.shape.cx}
                  cy={z.shape.cy}
                  r={z.shape.radius}
                  fill="rgba(99,102,241,0.2)"
                  stroke="#6366f1"
                  strokeWidth="2"
                />
              );
            }
            if (z.shape.type === 'polygon') {
              return (
                <polygon
                  key={z.id}
                  points={toSvgPoints(z.shape.points)}
                  fill="rgba(99,102,241,0.2)"
                  stroke="#6366f1"
                  strokeWidth="2"
                />
              );
            }
            return null;
          })}

          {isDragging && drawStart && drawCurrent && shapeType === 'rect' && (
            <rect
              x={Math.min(drawStart.x, drawCurrent.x)}
              y={Math.min(drawStart.y, drawCurrent.y)}
              width={Math.abs(drawCurrent.x - drawStart.x)}
              height={Math.abs(drawCurrent.y - drawStart.y)}
              fill="rgba(16,185,129,0.3)"
              stroke="#10b981"
              strokeWidth="2"
            />
          )}

          {isDragging && drawStart && drawCurrent && shapeType === 'circle' && (
            <circle
              cx={drawStart.x}
              cy={drawStart.y}
              r={Math.sqrt((drawCurrent.x - drawStart.x) ** 2 + (drawCurrent.y - drawStart.y) ** 2)}
              fill="rgba(16,185,129,0.3)"
              stroke="#10b981"
              strokeWidth="2"
            />
          )}

          {shapeType === 'polygon' && polygonPoints.length > 0 && (
            <>
              {polygonPoints.length > 1 && (
                <polyline
                  points={polygonPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="6,3"
                />
              )}
              {polygonPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4} fill="#10b981" />
              ))}
            </>
          )}
        </svg>
      )}
    </div>
  );
}
