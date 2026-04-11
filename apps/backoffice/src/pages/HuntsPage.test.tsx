import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import HuntsPage from './HuntsPage';

vi.mock('lucide-react', () => ({
  Plus: () => null,
  Search: () => null,
  Pencil: () => null,
  Trash2: () => null,
  Eye: () => null,
  ArrowLeft: () => null,
  Wand2: () => null,
  ListChecks: () => null,
  Bell: () => null,
  LayoutDashboard: () => null,
  Map: () => null,
  BarChart2: () => null,
  Settings: () => null,
  X: () => null,
  ChevronDown: () => null,
  Check: () => null,
}));

// Radix Dialog uses react-remove-scroll (CJS, root node_modules) which causes a double-React
// instance crash. Mock the entire dialog module to avoid loading it in tests.
vi.mock('@/components/ui/dialog', () => ({
  Dialog: () => null,
  DialogTrigger: () => null,
  DialogContent: () => null,
  DialogHeader: () => null,
  DialogTitle: () => null,
  DialogDescription: () => null,
  DialogFooter: () => null,
}));

vi.mock('@/services/hunts.service', () => ({
  huntsService: {
    getAll: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

import { huntsService } from '@/services/hunts.service';

const mockHunts = [
  {
    id: 'h1',
    partner_id: 'u1',
    title: 'Mystères du Musée',
    description: null,
    location: 'Paris',
    difficulty: 'easy' as const,
    duration: 60,
    points: 100,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'h2',
    partner_id: 'u1',
    title: 'Art & Histoire',
    description: null,
    location: null,
    difficulty: 'medium' as const,
    duration: 90,
    points: 200,
    is_active: false,
    created_at: '2026-01-02T00:00:00Z',
  },
];

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <HuntsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HuntsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('affiche la liste des chasses', async () => {
    vi.mocked(huntsService.getAll).mockResolvedValue(mockHunts);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Mystères du Musée')).toBeInTheDocument();
      expect(screen.getByText('Art & Histoire')).toBeInTheDocument();
    });
  });

  it('affiche les badges de statut corrects', async () => {
    vi.mocked(huntsService.getAll).mockResolvedValue(mockHunts);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Actif')).toBeInTheDocument();
      expect(screen.getByText('Inactif')).toBeInTheDocument();
    });
  });

  it('affiche "Aucune chasse trouvée" si la liste est vide', async () => {
    vi.mocked(huntsService.getAll).mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/aucune chasse trouvée/i)).toBeInTheDocument();
    });
  });

  it('ne supprime pas directement : attend la confirmation', async () => {
    vi.mocked(huntsService.getAll).mockResolvedValue(mockHunts);
    renderPage();
    await waitFor(() => screen.getByText('Mystères du Musée'));
    const deleteButtons = screen.getAllByTitle('Supprimer');
    fireEvent.click(deleteButtons[0]);
    // Le service ne doit pas être appelé avant confirmation
    expect(huntsService.remove).not.toHaveBeenCalled();
  });
});
