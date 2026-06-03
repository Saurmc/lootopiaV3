import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { StepMapItem } from '@lootopia/shared';

jest.mock('@maplibre/maplibre-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MapView: ({ children }: any) => React.createElement(View, { testID: 'map-view' }, children),
    Camera: () => null,
    PointAnnotation: ({ children, id }: any) =>
      React.createElement(View, { testID: `annotation-${id}` }, children),
    UserLocation: () => null,
    ShapeSource: ({ children }: any) => React.createElement(View, null, children),
    FillLayer: () => null,
    LineLayer: () => null,
    CircleLayer: () => null,
  };
});

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

jest.mock('../../store/auth.store', () => ({
  useAuthStore: () => ({ consentGps: false, isGuest: false }),
}));

jest.mock('../../hooks/useHunts', () => ({
  useHuntsOnMap: () => ({ data: [] }),
  useHuntHistory: () => ({ data: [] }),
}));

jest.mock('../../services/progress.service', () => ({
  progressService: {
    getHuntProgress: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('./HuntBottomSheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => React.createElement(View, { testID: 'hunt-bottom-sheet' });
});

const stepCurrent: StepMapItem = {
  id: 'step-current',
  order: 0,
  title: 'Étape courante',
  description: null,
  status: 'current',
  validation_radius: 50,
  validation_type: 'gps',
  coordinates: { lat: 48.85, lng: 2.35 },
};

const stepCompleted: StepMapItem = {
  id: 'step-completed',
  order: 1,
  title: 'Étape complétée',
  description: null,
  status: 'completed',
  validation_radius: 30,
  validation_type: 'gps',
  coordinates: { lat: 48.86, lng: 2.36 },
};

const stepLocked: StepMapItem = {
  id: 'step-locked',
  order: 2,
  title: 'Étape verrouillée',
  description: null,
  status: 'locked',
  validation_radius: 20,
  validation_type: 'gps',
  coordinates: null,
};

function wrapper(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return { ...actual, useQuery: jest.fn() };
});

import { useQuery } from '@tanstack/react-query';
import MapScreen from './MapScreen';

const mockUseQuery = useQuery as jest.Mock;

describe('MapScreen step markers', () => {
  beforeEach(() => {
    mockUseQuery.mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'hunts-map') return { data: [] };
      if (queryKey[0] === 'hunt-history') return { data: [] };
      if (queryKey[0] === 'hunt-progress') return { data: undefined };
      return { data: undefined };
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('renders no step markers when activeSteps is undefined', () => {
    const { queryByTestId } = render(wrapper(<MapScreen />));
    expect(queryByTestId('step-marker-step-current')).toBeNull();
    expect(queryByTestId('step-marker-step-completed')).toBeNull();
  });

  it('renders current step marker with coordinates', () => {
    mockUseQuery.mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'hunt-progress') {
        return {
          data: { steps: [stepCurrent] },
        };
      }
      return { data: [] };
    });

    const { getByTestId } = render(wrapper(<MapScreen />));
    expect(getByTestId('step-marker-step-current')).toBeTruthy();
  });

  it('renders completed step marker with coordinates', () => {
    mockUseQuery.mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'hunt-progress') {
        return {
          data: { steps: [stepCompleted] },
        };
      }
      return { data: [] };
    });

    const { getByTestId } = render(wrapper(<MapScreen />));
    expect(getByTestId('step-marker-step-completed')).toBeTruthy();
  });

  it('does not render locked step (coordinates null)', () => {
    mockUseQuery.mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'hunt-progress') {
        return {
          data: { steps: [stepLocked] },
        };
      }
      return { data: [] };
    });

    const { queryByTestId } = render(wrapper(<MapScreen />));
    expect(queryByTestId('step-marker-step-locked')).toBeNull();
  });
});
