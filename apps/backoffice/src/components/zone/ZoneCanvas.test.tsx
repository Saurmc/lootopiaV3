import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ZoneCanvas from './ZoneCanvas';
import type { ZoneDto } from '@/services/zones.service';

const mockZones: ZoneDto[] = [
  {
    id: 'z1',
    hunt_id: 'h1',
    label: 'Zone rect',
    shape: { type: 'rect', x: 10, y: 20, width: 100, height: 80 },
    order: 0,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'z2',
    hunt_id: 'h1',
    label: 'Zone circle',
    shape: { type: 'circle', cx: 50, cy: 50, radius: 30 },
    order: 1,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'z3',
    hunt_id: 'h1',
    label: 'Zone polygon',
    shape: { type: 'polygon', points: [[0, 0], [100, 0], [50, 80]] },
    order: 2,
    created_at: '2026-01-01T00:00:00Z',
  },
];

function setupImage(img: HTMLImageElement, w = 800, h = 600) {
  Object.defineProperty(img, 'naturalWidth', { value: w, configurable: true });
  Object.defineProperty(img, 'naturalHeight', { value: h, configurable: true });
  Object.defineProperty(img, 'clientWidth', { value: 400, configurable: true });
  Object.defineProperty(img, 'clientHeight', { value: 300, configurable: true });
  act(() => { fireEvent.load(img); });
}

describe('ZoneCanvas', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('rend l\'image et le SVG avec les zones existantes', () => {
    const onShapeCommit = vi.fn();
    render(
      <ZoneCanvas
        planUrl="http://example.com/plan.jpg"
        zones={mockZones}
        shapeType="rect"
        onShapeCommit={onShapeCommit}
      />,
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'http://example.com/plan.jpg');

    setupImage(img as HTMLImageElement);

    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();

    const rects = svg!.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThanOrEqual(1);

    const circles = svg!.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(1);

    const polygons = svg!.querySelectorAll('polygon');
    expect(polygons.length).toBeGreaterThanOrEqual(1);
  });

  it('appelle onShapeCommit avec un rect après mousedown → mouseup', () => {
    const onShapeCommit = vi.fn();
    render(
      <ZoneCanvas
        planUrl="http://example.com/plan.jpg"
        zones={[]}
        shapeType="rect"
        onShapeCommit={onShapeCommit}
      />,
    );

    const img = screen.getByRole('img');
    setupImage(img as HTMLImageElement);

    const svg = document.querySelector('svg')!;
    fireEvent.mouseDown(svg, { offsetX: 100, offsetY: 50 });
    fireEvent.mouseMove(svg, { offsetX: 200, offsetY: 150 });
    fireEvent.mouseUp(svg, { offsetX: 200, offsetY: 150 });

    expect(onShapeCommit).toHaveBeenCalledOnce();
    expect(onShapeCommit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'rect' }),
    );
  });

  it('appelle onShapeCommit avec un circle après drag', () => {
    const onShapeCommit = vi.fn();
    render(
      <ZoneCanvas
        planUrl="http://example.com/plan.jpg"
        zones={[]}
        shapeType="circle"
        onShapeCommit={onShapeCommit}
      />,
    );

    const img = screen.getByRole('img');
    setupImage(img as HTMLImageElement);

    const svg = document.querySelector('svg')!;
    fireEvent.mouseDown(svg, { offsetX: 100, offsetY: 100 });
    fireEvent.mouseMove(svg, { offsetX: 150, offsetY: 100 });
    fireEvent.mouseUp(svg, { offsetX: 150, offsetY: 100 });

    expect(onShapeCommit).toHaveBeenCalledOnce();
    expect(onShapeCommit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'circle' }),
    );
  });

  it('appelle onShapeCommit avec un polygon après 3 points + double-click', () => {
    const onShapeCommit = vi.fn();
    render(
      <ZoneCanvas
        planUrl="http://example.com/plan.jpg"
        zones={[]}
        shapeType="polygon"
        onShapeCommit={onShapeCommit}
      />,
    );

    const img = screen.getByRole('img');
    setupImage(img as HTMLImageElement);

    const svg = document.querySelector('svg')!;

    fireEvent.click(svg, { detail: 1, offsetX: 10, offsetY: 10 });
    vi.advanceTimersByTime(300);

    fireEvent.click(svg, { detail: 1, offsetX: 20, offsetY: 20 });
    vi.advanceTimersByTime(300);

    fireEvent.click(svg, { detail: 1, offsetX: 30, offsetY: 10 });
    vi.advanceTimersByTime(300);

    // double-click closes polygon
    fireEvent.click(svg, { detail: 2, offsetX: 30, offsetY: 10 });

    expect(onShapeCommit).toHaveBeenCalledOnce();
    expect(onShapeCommit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'polygon' }),
    );
    const shape = onShapeCommit.mock.calls[0][0];
    expect(shape.points).toHaveLength(3);
  });

  it('affiche la forme validée en vert après commit rect', () => {
    const onShapeCommit = vi.fn();
    render(
      <ZoneCanvas
        planUrl="http://example.com/plan.jpg"
        zones={[]}
        shapeType="rect"
        onShapeCommit={onShapeCommit}
      />,
    );

    const img = screen.getByRole('img');
    setupImage(img as HTMLImageElement);

    const svg = document.querySelector('svg')!;
    fireEvent.mouseDown(svg, { offsetX: 50, offsetY: 50 });
    fireEvent.mouseUp(svg, { offsetX: 150, offsetY: 120 });

    // La forme committée est rendue avec stroke="#10b981" (vert)
    const greenRect = svg.querySelector('rect[stroke="#10b981"]');
    expect(greenRect).toBeTruthy();
  });

  it('ferme le polygone automatiquement en cliquant près du premier point', () => {
    const onShapeCommit = vi.fn();
    render(
      <ZoneCanvas
        planUrl="http://example.com/plan.jpg"
        zones={[]}
        shapeType="polygon"
        onShapeCommit={onShapeCommit}
      />,
    );

    const img = screen.getByRole('img');
    setupImage(img as HTMLImageElement);

    const svg = document.querySelector('svg')!;

    // 3 points
    fireEvent.click(svg, { detail: 1, offsetX: 100, offsetY: 100 });
    vi.advanceTimersByTime(300);
    fireEvent.click(svg, { detail: 1, offsetX: 200, offsetY: 100 });
    vi.advanceTimersByTime(300);
    fireEvent.click(svg, { detail: 1, offsetX: 150, offsetY: 180 });
    vi.advanceTimersByTime(300);

    // Clic très proche du premier point → auto-close dans le timeout.
    // act() est requis car le flush React arrive depuis un timer (hors event system).
    fireEvent.click(svg, { detail: 1, offsetX: 101, offsetY: 101 });
    act(() => { vi.advanceTimersByTime(300); });

    expect(onShapeCommit).toHaveBeenCalledOnce();
    expect(onShapeCommit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'polygon' }),
    );
    const shape = onShapeCommit.mock.calls[0][0];
    expect(shape.points).toHaveLength(3);
  });

  it('ne déclenche pas onShapeCommit si moins de 3 points polygon', () => {
    const onShapeCommit = vi.fn();
    render(
      <ZoneCanvas
        planUrl="http://example.com/plan.jpg"
        zones={[]}
        shapeType="polygon"
        onShapeCommit={onShapeCommit}
      />,
    );

    const img = screen.getByRole('img');
    setupImage(img as HTMLImageElement);

    const svg = document.querySelector('svg')!;

    fireEvent.click(svg, { detail: 1, offsetX: 10, offsetY: 10 });
    vi.advanceTimersByTime(300);
    fireEvent.click(svg, { detail: 1, offsetX: 20, offsetY: 20 });
    vi.advanceTimersByTime(300);

    fireEvent.click(svg, { detail: 2 });

    expect(onShapeCommit).not.toHaveBeenCalled();
  });
});
