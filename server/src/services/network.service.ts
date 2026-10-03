import os from 'node:os';
import QRCode from 'qrcode';

export interface NetworkAddressInfo {
  name: string;
  address: string;
  netmask: string;
  family: string;
  mac: string;
  internal: boolean;
}

export function getLocalIpAddresses(): NetworkAddressInfo[] {
  const interfaces = os.networkInterfaces();
  const results: NetworkAddressInfo[] = [];

  for (const [name, netInterface] of Object.entries(interfaces)) {
    if (!netInterface) continue;
    for (const info of netInterface) {
      // Look for IPv4 non-internal and non-link-local addresses
      if (info.family === 'IPv4' && !info.internal && !info.address.startsWith('169.254.')) {
        results.push({
          name,
          address: info.address,
          netmask: info.netmask,
          family: info.family,
          mac: info.mac,
          internal: info.internal
        });
      }
    }
  }

  return results;
}

export function getPrimaryLocalIp(preferredIp?: string): string {
  if (preferredIp && preferredIp.trim().length > 0) {
    return preferredIp.trim();
  }

  const addresses = getLocalIpAddresses();
  if (addresses.length === 0) {
    return '127.0.0.1';
  }

  // Prioritize Wi-Fi or Wireless or Ethernet
  const wifi = addresses.find(a => /wi-?fi|wlan|wireless/i.test(a.name));
  if (wifi) return wifi.address;

  const ethernet = addresses.find(a => /ethernet|eth|en/i.test(a.name));
  if (ethernet) return ethernet.address;

  return addresses[0].address;
}

export async function generateQrCodeDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#0c2419', // Dark forest green
      light: '#ffffff'
    },
    width: 400
  });
}

export async function generateQrCodeSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#0c2419',
      light: '#ffffff'
    }
  });
}
