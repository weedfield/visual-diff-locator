import * as puppeteer from 'puppeteer';

export type DeviceCategory = 'PC' | 'Mobile';
export type DeviceList = Record<string, puppeteer.Device>;