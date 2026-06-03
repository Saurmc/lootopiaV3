import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StepForm from './StepForm';

vi.mock('@/components/ui/file-upload', () => ({
  default: () => null,
}));

const noop = vi.fn().mockResolvedValue(undefined);

function renderForm(defaultValues?: Parameters<typeof StepForm>[0]['defaultValues']) {
  render(<StepForm onSubmit={noop} defaultValues={defaultValues} />);
}

describe('StepForm — validation_type selector', () => {
  it('renders validation_type select with gps as default', () => {
    renderForm();
    const select = screen.getByLabelText('Type de validation') as HTMLSelectElement;
    expect(select.value).toBe('gps');
  });

  it('selecting qrcode shows expected_code field', async () => {
    renderForm();
    const select = screen.getByLabelText('Type de validation');
    fireEvent.change(select, { target: { value: 'qrcode' } });
    await waitFor(() => {
      expect(screen.getByLabelText(/Code QR attendu/i)).toBeInTheDocument();
    });
  });

  it('selecting quiz shows correct_answer field', async () => {
    renderForm();
    const select = screen.getByLabelText('Type de validation');
    fireEvent.change(select, { target: { value: 'quiz' } });
    await waitFor(() => {
      expect(screen.getByLabelText(/Bonne réponse/i)).toBeInTheDocument();
    });
  });

  it('selecting photo shows no extra field', async () => {
    renderForm();
    const select = screen.getByLabelText('Type de validation');
    fireEvent.change(select, { target: { value: 'photo' } });
    await waitFor(() => {
      expect(screen.queryByLabelText(/Code QR attendu/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Bonne réponse/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Latitude/i)).not.toBeInTheDocument();
    });
  });

  it('gps type shows lat/lng fields', () => {
    renderForm();
    expect(screen.getByLabelText('Latitude')).toBeInTheDocument();
    expect(screen.getByLabelText('Longitude')).toBeInTheDocument();
  });
});
