import * as puppeteer from 'puppeteer';
import { DeviceCategory, DeviceList } from '../types';

export const CUSTOM_DEVICES: Record<DeviceCategory, DeviceList> = {
  PC: {
    'Desktop Default': {
      name: 'Desktop PC',
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false
      }
    } as puppeteer.Device
  },
  Mobile: {
    ...puppeteer.KnownDevices
  }
};
