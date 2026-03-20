export interface ARContent {
  type: string;
  payload: Record<string, unknown>;
}

export interface Step {
  id: string;
  huntId: string;
  title: string;
  validationRadius: number;
  arContent: ARContent;
}
