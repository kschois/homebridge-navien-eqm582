import { NavienReportedState } from '../aws/interfaces/index.js';
import { Device } from './interfaces/index.js';
import { NavienDevice } from './navien.device.js';
import { NavienDeviceStatusParser } from './navien.device-status.parser.js';
import { findModelProfile, normalizeHeatControl } from './navien.model.js';

const createDeviceJson = (overrides: {
  modelName?: string;
  side?: { left: string; right: string };
  heatControl?: unknown;
}): Device => ({
  deviceSeq: 1,
  serviceCode: 1,
  deviceId: 'device-id',
  modelCode: '1',
  mqttTopicKey: '',
  registerBy: '',
  registerAt: new Date(),
  icon: 0,
  regionCode: 0,
  lastModifyAt: new Date(),
  connected: 1,
  modelName: overrides.modelName ?? 'EQM582',
  orderNo: 0,
  Properties: {
    nickName: { mainItem: '온수매트', side: overrides.side },
    registry: {
      attributes: {
        functions: { heatControl: overrides.heatControl },
      },
    },
  },
} as unknown as Device);

describe('model profile', () => {
  it('should find EQM582 profile with suffix', () => {
    expect(findModelProfile('EQM582')?.model).toBe('EQM582');
    expect(findModelProfile('eqm582-qs')?.model).toBe('EQM582');
    expect(findModelProfile('EME520')).toBeUndefined();
    expect(findModelProfile(undefined)).toBeUndefined();
  });

  it('should normalize heat control given as strings', () => {
    expect(normalizeHeatControl({ rangeMin: '28', rangeMax: '45', unit: '1' } as never))
      .toEqual({ rangeMin: 28, rangeMax: 45, step: 1 });
  });

  it('should fallback to profile when heat control is invalid', () => {
    const profile = findModelProfile('EQM582');
    expect(normalizeHeatControl(undefined, profile)).toEqual({ rangeMin: 28, rangeMax: 45, step: 0.5 });
    expect(normalizeHeatControl({ rangeMin: 45, rangeMax: 28, unit: '0.5' } as never, profile))
      .toEqual({ rangeMin: 28, rangeMax: 45, step: 0.5 });
  });
});

describe('NavienDevice (EQM582)', () => {
  it('should use registry heat control when available', () => {
    const device = new NavienDevice(createDeviceJson({
      heatControl: { rangeMin: 30, rangeMax: 50, unit: '1' },
    }));
    expect(device.functions.heatRange).toEqual({ min: 29, max: 50, step: 1 });
  });

  it('should use EQM582 defaults when heat control is missing', () => {
    const device = new NavienDevice(createDeviceJson({}));
    expect(device.model).toBe('EQM582');
    expect(device.profile?.verified).toBe(false);
    expect(device.functions.heatRange).toEqual({ min: 27.5, max: 45, step: 0.5 });
  });

  it('should apply user overrides', () => {
    const device = new NavienDevice(
      createDeviceJson({ side: { left: 'L', right: 'R' } }),
      { device: '온수매트', zones: 'single', heatMin: 25, heatMax: 40, heatStep: 1 },
    );
    expect(device.isDouble).toBe(false);
    expect(device.functions.heatRange).toEqual({ min: 24, max: 40, step: 1 });
  });

  it('should detect double zones from nickname', () => {
    const device = new NavienDevice(createDeviceJson({ side: { left: 'L', right: 'R' } }));
    expect(device.isDouble).toBe(true);
  });
});

describe('NavienDeviceStatusParser', () => {
  it('should parse standard single payload', () => {
    const parser = new NavienDeviceStatusParser(false);
    const status = parser.parseStatusFrom({
      connected: true,
      operationMode: 1,
      heater: { single: { enable: true, temperature: { current: 30, set: 38 } } },
      childLock: false,
    } as unknown as NavienReportedState);

    expect(status).toEqual({
      isConnected: true,
      isPowerOn: true,
      isEnabled: true,
      currentTemperature: 30,
      targetTemperature: 38,
      isLocked: false,
    });
  });

  it('should parse values given as number or string', () => {
    const parser = new NavienDeviceStatusParser(false);
    const status = parser.parseStatusFrom({
      connected: 1,
      operationMode: '1',
      heater: { single: { enable: 1, temperature: { current: '31.5', set: '40' } } },
      childLock: 0,
    } as unknown as NavienReportedState);

    expect(status).toEqual({
      isConnected: true,
      isPowerOn: true,
      isEnabled: true,
      currentTemperature: 31.5,
      targetTemperature: 40,
      isLocked: false,
    });
  });

  it('should parse single device reporting as left', () => {
    const parser = new NavienDeviceStatusParser(false);
    const status = parser.parseStatusFrom({
      connected: true,
      heater: { left: { enable: true, temperature: { set: 36 } } },
    } as unknown as NavienReportedState);

    expect(status.isEnabled).toBe(true);
    expect(status.targetTemperature).toBe(36);
  });

  it('should parse double device reporting as single', () => {
    const parser = new NavienDeviceStatusParser(true);
    const status = parser.parseStatusFrom({
      connected: true,
      heater: { single: { enable: true, temperature: { set: 36 } } },
    } as unknown as NavienReportedState);

    expect(status.targetTemperature).toBe(36);
    expect(status.targetTemperature2).toBe(36);
  });

  it('should not parse other properties when disconnected', () => {
    const parser = new NavienDeviceStatusParser(false);
    expect(parser.parseStatusFrom({ connected: false } as unknown as NavienReportedState)).toEqual({ isConnected: false });
  });
});
