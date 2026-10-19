import { HeatControl } from './interfaces/index.js';

export type ZoneLayout = 'auto' | 'single' | 'double';

/**
 * Known characteristics of a model.
 * These are used only as a fallback when the device registry does not provide them.
 */
export interface ModelProfile {
  /** model name prefix, e.g. `EQM582` matches `EQM582-QS`, `EQM582-KS` */
  model: string;
  /** whether the model is a water mat (온수매트) */
  isWaterMat: boolean;
  /** whether the model is verified to work with this plugin */
  verified: boolean;
  /** fallback heat control when `functions.heatControl` is missing or invalid in the device registry */
  heatControl: Pick<HeatControl, 'rangeMin' | 'rangeMax' | 'unit'>;
}

/**
 * User defined overrides for a device. (`deviceOverrides` in config.json)
 */
export interface DeviceOverride {
  /** device name in Navien Smart app */
  device: string;
  zones?: ZoneLayout;
  heatMin?: number;
  heatMax?: number;
  heatStep?: number;
}

const DEFAULT_HEAT_CONTROL: ModelProfile['heatControl'] = {
  rangeMin: 28,
  rangeMax: 45,
  unit: '0.5',
};

const MODEL_PROFILES: ModelProfile[] = [
  // 나비엔 메이트 온수매트 (Navien Mate water mat)
  // Previously controlled via "Navien Mate" app, migrated to "Navien Smart" since 2024-07.
  {
    model: 'EQM582',
    isWaterMat: true,
    verified: false,
    heatControl: { rangeMin: 28, rangeMax: 45, unit: '0.5' },
  },
];

/**
 * Find a model profile by model name.
 * @param modelName - model name of the device, e.g. `EQM582-QS`
 * @returns model profile, or `undefined` if the model is unknown
 */
export function findModelProfile(modelName?: string): ModelProfile | undefined {
  if (!modelName) {
    return undefined;
  }
  const normalized = modelName.toUpperCase().replace(/\s/g, '');
  return MODEL_PROFILES.find((profile) => normalized.startsWith(profile.model));
}

/**
 * Validate heat control from the device registry.
 * Older models (e.g. Navien Mate series) may omit the field or send numbers as strings.
 */
export function normalizeHeatControl(heatControl: Partial<HeatControl> | undefined, profile?: ModelProfile) {
  const fallback = profile?.heatControl ?? DEFAULT_HEAT_CONTROL;

  const rangeMin = toFiniteNumber(heatControl?.rangeMin) ?? fallback.rangeMin;
  const rangeMax = toFiniteNumber(heatControl?.rangeMax) ?? fallback.rangeMax;
  const step = toFiniteNumber(heatControl?.unit);

  const isValid = rangeMin < rangeMax && step !== undefined && step > 0;
  return isValid ?
    { rangeMin, rangeMax, step: step! } :
    { rangeMin: fallback.rangeMin, rangeMax: fallback.rangeMax, step: parseFloat(fallback.unit) };
}

export function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }
  return undefined;
}
