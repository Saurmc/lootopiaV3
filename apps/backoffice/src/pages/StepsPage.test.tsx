import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import StepsPage from './StepsPage';

vi.mock('lucide-react', () => ({
  ArrowLeft: () => null,
  Plus: () => null,
  Pencil: () => null,
  Trash2: () => null,
  MapPin: () => null,
  Layers: () => null,
  X: () => null,
  ChevronDown: () => null,
  Check: () => null,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: () => null,
  DialogContent: () => null,
  DialogHeader: () => null,
  DialogTitle: () => null,
  DialogDescription: () => null,
  DialogFooter: () => null,
}));

vi.mock('@/services/hunts.service', () => ({
  huntsService: { getById: vi.fn() },
}));

vi.mock('@/services/steps.service', () => ({
  stepsService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@/services/zones.service', () => ({
  zonesService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

import { huntsService } from '@/services/hunts.service';
import { stepsService } from '@/services/steps.service';
import { zonesService } from '@/services/zones.service';

const mockHunt = {
  id: 'hunt-1', partner_id: 'u1', title: 'Mystères du Musée',
  description: null, location: 'Paris', difficulty: 'easy' as const,
  duration: 60, points: 100, is_active: true, created_at: '2026-01-01T00:00:00Z',
};

const mockSteps = [
  { id: 's1', hunt_id: 'hunt-1', order: 0, title: 'Fontaine centrale', description: null, validation_radius: 50, ar_content: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 's2', hunt_id: 'hunt-1', order: 1, title: 'Entrée du musée', description: 'Cherchez la plaque', validation_radius: 30, ar_content: null, created_at: '2026-01-01T00:00:00Z' },
];

const mockZones = [
  { id: 'z1', hunt_id: 'hunt-1', label: 'Zone A', shape: { type: 'rect' as const, x: 0, y: 0, width: 100, height: 80 }, order: 0, created_at: '2026-01-01T00:00:00Z' },
];

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/hunts/hunt-1/steps']}>
        <Routes>
          <Route path="/hunts/:id/steps" element={<StepsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('StepsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(huntsService.getById).mockResolvedValue(mockHunt);
    vi.mocked(stepsService.getAll).mockResolvedValue(mockSteps);
    vi.mocked(zonesService.getAll).mockResolvedValue(mockZones);
  });

  it('affiche le titre de la chasse et les onglets', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Étapes & Zones')).toBeInTheDocument();
      expect(screen.getByText('Mystères du Musée')).toBeInTheDocument();
    });
    expect(screen.getByText('Étapes')).toBeInTheDocument();
    expect(screen.getByText('Zones')).toBeInTheDocument();
  });

  it('affiche la liste des étapes par défaut', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Fontaine centrale')).toBeInTheDocument();
      expect(screen.getByText('Entrée du musée')).toBeInTheDocument();
    });
  });

  it('affiche le rayon de validation de chaque étape', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Rayon : 50 m')).toBeInTheDocument();
      expect(screen.getByText('Rayon : 30 m')).toBeInTheDocument();
    });
  });

  it('affiche les zones après clic sur l\'onglet Zones', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Étapes'));
    fireEvent.click(screen.getByText('Zones'));
    await waitFor(() => {
      expect(screen.getByText('Zone A')).toBeInTheDocument();
    });
  });

  it('affiche "Aucune étape" si la liste est vide', async () => {
    vi.mocked(stepsService.getAll).mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/aucune étape/i)).toBeInTheDocument();
    });
  });

  it('ne supprime pas directement au clic sans confirmation', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Fontaine centrale'));
    const deleteButtons = screen.getAllByTitle('Supprimer');
    fireEvent.click(deleteButtons[0]);
    expect(stepsService.remove).not.toHaveBeenCalled();
  });
});
