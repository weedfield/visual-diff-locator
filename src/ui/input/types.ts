import * as puppeteer from 'puppeteer';

export interface InputParams {
  demoUrl: string;
  prodUrl: string;
  isManualShot: boolean;
  selectedDevice: {
    name: string;
    device: puppeteer.Device;
  };
}
