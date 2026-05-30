import { describe, it, expect } from 'vitest';
import { toPayload } from './StepForm';

const base = {
  order: '1',
  title: 'Devant la fontaine',
  description: '',
  lat: '',
  lng: '',
  validation_radius: '50',
  ar_image_url: '',
  ar_type: '2d-overlay' as const,
  ar_pos_x: '0',
  ar_pos_y: '0',
  ar_pos_z: '0',
  ar_scale: '1',
};

describe('toPayload — ar_content', () => {
  it("pas d'ar_content si ar_image_url vide", () => {
    const payload = toPayload({ ...base, ar_image_url: '' });
    expect(payload.ar_content).toBeUndefined();
  });

  it('2d-overlay sérialisé avec image, position et scale', () => {
    const payload = toPayload({
      ...base,
      ar_image_url: 'https://cdn.example.com/img.png',
      ar_type: '2d-overlay',
      ar_pos_x: '1.5',
      ar_pos_y: '-0.5',
      ar_pos_z: '2',
      ar_scale: '0.8',
    });
    expect(payload.ar_content).toEqual({
      type: '2d-overlay',
      image: 'https://cdn.example.com/img.png',
      position: { x: 1.5, y: -0.5, z: 2 },
      scale: 0.8,
    });
  });

  it("3d-model sérialisé avec model_url à la place d'image", () => {
    const payload = toPayload({
      ...base,
      ar_image_url: 'https://cdn.example.com/model.glb',
      ar_type: '3d-model',
      ar_pos_x: '0',
      ar_pos_y: '0',
      ar_pos_z: '0',
      ar_scale: '1',
    });
    expect(payload.ar_content).toEqual({
      type: '3d-model',
      model_url: 'https://cdn.example.com/model.glb',
      position: { x: 0, y: 0, z: 0 },
      scale: 1,
    });
    expect((payload.ar_content as { image?: string }).image).toBeUndefined();
  });
});
