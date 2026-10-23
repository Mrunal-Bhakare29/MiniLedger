/**
 * Android emulator talks to the Windows host through 10.0.2.2, not localhost.
 * localhost inside the emulator is the emulator itself.
 *
 * Physical device: replace this with your PC LAN IP, for example:
 *   http://192.168.1.24:5000
 * Then allow TCP 5000 through Windows Firewall.
 */
export const API_BASE_URL = 'http://192.168.43.105:5000';

export const APP_NAME = 'MiniLedger';
export const APP_TAGLINE = 'Lend smart. Track simply. Get repaid.';
