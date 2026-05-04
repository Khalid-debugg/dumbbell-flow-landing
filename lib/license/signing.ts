import crypto from 'crypto';

/**
 * Create a signed license data object for offline validation in Electron app
 * This allows the app to validate licenses without constant server connection
 */
export function signLicenseData(data: {
  licenseKey: string;
  deviceId: string;
  subscriptionEndsAt: Date | null;
  subscriptionStatus: string;
}): string {
  const secret = process.env.LICENSE_SIGNING_SECRET;

  if (!secret) {
    throw new Error('LICENSE_SIGNING_SECRET environment variable is not set');
  }

  const payload = JSON.stringify({
    key: data.licenseKey,
    device: data.deviceId,
    subEnd: data.subscriptionEndsAt?.toISOString() || null,
    status: data.subscriptionStatus,
    timestamp: Date.now(),
  });

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);

  const signature = hmac.digest('hex');

  // Return both payload and signature as base64 for easy transmission
  return Buffer.from(
    JSON.stringify({
      payload,
      signature,
    })
  ).toString('base64');
}

/**
 * Verify a signed license data object
 * This would be used on the Electron side with a public verification method
 */
export function verifyLicenseSignature(signedData: string): {
  valid: boolean;
  data?: {
    licenseKey: string;
    deviceId: string;
    subscriptionEndsAt: Date | null;
    subscriptionStatus: string;
    timestamp: number;
  };
} {
  try {
    const secret = process.env.LICENSE_SIGNING_SECRET;

    if (!secret) {
      throw new Error('LICENSE_SIGNING_SECRET environment variable is not set');
    }

    const decoded = JSON.parse(Buffer.from(signedData, 'base64').toString('utf-8'));
    const { payload, signature } = decoded;

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    if (
      !crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))
    ) {
      return { valid: false };
    }

    const parsedPayload = JSON.parse(payload);

    return {
      valid: true,
      data: {
        licenseKey: parsedPayload.key,
        deviceId: parsedPayload.device,
        subscriptionEndsAt: parsedPayload.subEnd ? new Date(parsedPayload.subEnd) : null,
        subscriptionStatus: parsedPayload.status,
        timestamp: parsedPayload.timestamp,
      },
    };
  } catch (error) {
    console.error('License signature verification error:', error);
    return { valid: false };
  }
}

/**
 * Generate a verification hash for client-side validation
 * This creates a simpler hash that can be verified without the secret
 */
export function generateVerificationHash(licenseKey: string, deviceId: string): string {
  const data = `${licenseKey}:${deviceId}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}
