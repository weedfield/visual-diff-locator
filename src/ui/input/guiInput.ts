import { InputParams } from './types';
import { CUSTOM_DEVICES } from '../../config/devices';
import { DeviceCategory } from '../../config/types';

export async function getInputFromGui(
  message: any
): Promise<InputParams | null> {
  const { command, demoUrl, prodUrl, mode, deviceCategory, deviceName } =
    message;

  if (
    typeof demoUrl === 'string' &&
    typeof prodUrl === 'string' &&
    typeof mode === 'string' &&
    typeof deviceCategory === 'string' &&
    typeof deviceName === 'string'
  ) {
    const category = deviceCategory as DeviceCategory;
    const device = CUSTOM_DEVICES[category]?.[deviceName];

    return {
      demoUrl,
      prodUrl,
      isManualShot: mode === 'manual',
      selectedDevice: {
        name: deviceName,
        device
      }
    };
  }

  return null;
}
