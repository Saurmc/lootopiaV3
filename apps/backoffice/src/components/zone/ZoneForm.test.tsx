import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ZoneForm from './ZoneForm';
import type { ZoneShape } from '@/services/zones.service';

vi.mock('@/components/zone/ZoneCanvas', () => ({
  default: ({ onShapeCommit }: { onShapeCommit: (s: ZoneShape) => void }) => (
    <button
      data-testid="zone-canvas"
      onClick={() => onShapeCommit({ type: 'rect', x: 10, y: 20, width: 100, height: 80 })}
    >
      Canvas mock
    </button>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, defaultValue }: { children: React.ReactNode; onValueChange: (v: string) => void; defaultValue: string }) => (
    <select
      data-testid="shape-select"
      defaultValue={defaultValue}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

describe('ZoneForm', () => {
  it('ne contient plus aucune référence à "US44"', () => {
    render(<ZoneForm onSubmit={vi.fn()} />);
    expect(screen.queryByText(/US44/i)).toBeNull();
    // Switch to polygon
    const select = screen.getByTestId('shape-select');
    fireEvent.change(select, { target: { value: 'polygon' } });
    expect(screen.queryByText(/US44/i)).toBeNull();
  });

  it('rend ZoneCanvas et met les champs de coordonnées en readOnly quand planUrl fourni', () => {
    render(<ZoneForm onSubmit={vi.fn()} planUrl="http://example.com/plan.jpg" />);

    expect(screen.getByTestId('zone-canvas')).toBeInTheDocument();

    // Rect is default shape — X, Y, Largeur, Hauteur must be readonly
    expect(screen.getByLabelText('X')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Y')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Largeur')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Hauteur')).toHaveAttribute('readonly');

    // Ordre field is never readonly
    expect(screen.getByLabelText('Ordre')).not.toHaveAttribute('readonly');
  });

  it('les champs numériques sont éditables sans planUrl', () => {
    render(<ZoneForm onSubmit={vi.fn()} />);

    expect(screen.queryByTestId('zone-canvas')).toBeNull();

    const inputs = screen.getAllByRole('spinbutton');
    const numericInputs = inputs.filter(i => i.getAttribute('type') === 'number');
    numericInputs.forEach(input => {
      expect(input).not.toHaveAttribute('readonly');
    });
  });

  it('préremplit les champs avec la forme reçue du canvas', () => {
    render(<ZoneForm onSubmit={vi.fn()} planUrl="http://example.com/plan.jpg" />);

    fireEvent.click(screen.getByTestId('zone-canvas'));

    const xInput = screen.getByLabelText('X') as HTMLInputElement;
    expect(xInput.value).toBe('10');

    const yInput = screen.getByLabelText('Y') as HTMLInputElement;
    expect(yInput.value).toBe('20');
  });

  it('soumet le formulaire sans canvas avec les valeurs saisies', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ZoneForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.shape.type).toBe('rect');
  });
});
