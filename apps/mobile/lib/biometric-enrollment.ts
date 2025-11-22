export const enableBiometricFromSettings = async () => { return true; };
export const disableBiometrics = async () => { return true; };
export const isBiometricEnrolled = async () => { return false; };
export const getBiometricStatus = async () => { return { enabled: false, available: false, type: 'none' }; };
