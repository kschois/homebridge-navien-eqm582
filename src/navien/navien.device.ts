/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { Device } from './interfaces/index.js';
import { DeviceOverride, findModelProfile, normalizeHeatControl, toFiniteNumber } from './navien.model.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NavienDevice extends Device { }

export class NavienDevice {
  /** user defined overrides from config.json */
  override?: DeviceOverride;

  constructor(json: Device, override?: DeviceOverride) {
    Object.assign(this, json);
    this.override = override;
  }

  get id() {
    return this.deviceId;
  }

  get name() {
    return this.Properties.nickName.mainItem;
  }

  /**
   * Model name of the device, e.g. `EME520`, `EQM582`.
   * Some models do not have `modelName`, so fallback to `model` in the registry.
   */
  get model(): string {
    return this.modelName || this.Properties?.registry?.attributes?.model || this.modelCode;
  }

  get profile() {
    return findModelProfile(this.model);
  }

  get nicknames() {
    const { mainItem, side } = this.Properties.nickName;
    return {
      main: mainItem,
      left: side?.left,
      right: side?.right,
    };
  }

  get isDouble() {
    switch (this.override?.zones) {
      case 'single':
        return false;
      case 'double':
        return true;
    }

    /*
     * XXX(junbongwe): There is no explicit field or way to query whether a device is double or single.
     * For now, just check if there exists field `side` in `Properties.nickName`.
     */
    return this.Properties.nickName.side !== undefined;
  }

  get functions() {
    const heatControl = this.Properties?.registry?.attributes?.functions?.heatControl;
    const { rangeMin, rangeMax, step } = normalizeHeatControl(heatControl, this.profile);

    // `min` is used as "off" level, so it is one step lower than `rangeMin`.
    const min = toFiniteNumber(this.override?.heatMin) ?? rangeMin;
    const max = toFiniteNumber(this.override?.heatMax) ?? rangeMax;
    const unit = toFiniteNumber(this.override?.heatStep) ?? step;
    const heatRange = {
      min: min - unit,
      max: max,
      step: unit,
    };

    return {
      heatRange,
    };
  }
}
