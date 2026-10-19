import { DoubleHeaterState, NavienReportedState, OperationMode, SingleHeaterState } from '../aws/interfaces/index.js';
import { toFiniteNumber } from './navien.model.js';

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  const number = toFiniteNumber(value);
  if (number !== undefined) {
    return number !== 0;
  }
  if (value === 'true' || value === 'false') {
    return value === 'true';
  }
  return undefined;
}

export interface NavienDeviceStatus {
  isConnected: boolean;
  isPowerOn?: boolean;
  isEnabled?: boolean;
  isEnabled2?: boolean;
  currentTemperature?: number;
  targetTemperature?: number;
  currentTemperature2?: number;
  targetTemperature2?: number;
  isLocked?: boolean;
}

export class NavienDeviceStatusParser {
  constructor(private readonly isDouble: boolean) { }

  parseStatusFrom(state: NavienReportedState): NavienDeviceStatus {
    // older models (e.g. Navien Mate series like EQM582) may report values as number or string
    const isConnected = toBoolean(state.connected) ?? false;
    const status: NavienDeviceStatus = { isConnected };

    // if device is disconnected,
    // no need to parse other properties
    if (!isConnected) {
      return status;
    }

    // power on/off
    status.isPowerOn = 'operationMode' in state ?
      toFiniteNumber(state.operationMode) === OperationMode.ON :
      undefined;

    // temperature
    if ('heater' in state && state.heater) {
      const { single, left, right } = state.heater as SingleHeaterState & DoubleHeaterState;
      if (this.isDouble) {
        // some double models may report unified state as `single`
        const leftItem = left ?? single;
        const rightItem = right ?? single;

        status.isEnabled = toBoolean(leftItem?.enable);
        status.currentTemperature = toFiniteNumber(leftItem?.temperature?.current);
        status.targetTemperature = toFiniteNumber(leftItem?.temperature?.set);

        status.isEnabled2 = toBoolean(rightItem?.enable);
        status.currentTemperature2 = toFiniteNumber(rightItem?.temperature?.current);
        status.targetTemperature2 = toFiniteNumber(rightItem?.temperature?.set);
      } else {
        // some single models may report its state as `left`
        const item = single ?? left;

        status.isEnabled = toBoolean(item?.enable);
        status.currentTemperature = toFiniteNumber(item?.temperature?.current);
        status.targetTemperature = toFiniteNumber(item?.temperature?.set);
      }
    }

    // locked
    status.isLocked = toBoolean(state.childLock);

    return status;
  }

  // this logic is added on #38 (https://github.com/kyle-seongwoo-jun/homebridge-navien-smart/pull/38)
  // and split from parseStatusFrom() to make it more readable
  //
  // but i don't understand clearly why this logic is needed.
  adjustStatus(
    originalStatus: NavienDeviceStatus,
    targetTemperature: number,
    targetTemperature2: number,
    heatRange: { min: number; max: number; step: number },
  ): NavienDeviceStatus {
    const status = { ...originalStatus };

    // adjust temperatureSet when left is enabled/disabled
    if (status.isEnabled !== undefined) {
      if (status.isEnabled) {
        if (targetTemperature <= heatRange.min) {
          status.targetTemperature = heatRange.min + heatRange.step;
        }
      } else {
        if (targetTemperature > heatRange.min) {
          status.targetTemperature = heatRange.min;
        }
      }
    }

    // adjust isLeftEnabled when temperatureSet is changed
    if (status.targetTemperature !== undefined) {
      status.isEnabled = status.targetTemperature > heatRange.min;
    }

    // adjust temperatureSetRight when right is enabled/disabled
    if (status.isEnabled2 !== undefined) {
      if (status.isEnabled2) {
        if (targetTemperature2 <= heatRange.min) {
          status.targetTemperature2 = heatRange.min + heatRange.step;
        }
      } else {
        if (targetTemperature2 > heatRange.min) {
          status.targetTemperature2 = heatRange.min;
        }
      }
    }

    // adjust isRightEnabled when temperatureSetRight is changed
    if (status.targetTemperature2 !== undefined) {
      status.isEnabled2 = status.targetTemperature2 > heatRange.min;
    }

    return status;
  }
}
