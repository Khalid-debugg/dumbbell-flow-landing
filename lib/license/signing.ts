import crypto from 'crypto';

// LICENSE_SIGNING_PUBLIC_KEY is the matching public key — embedded in the Electron binary for offline verification.
// The private key is in LICENSE_SIGNING_PRIVATE_KEY env var (server-only).
function getPrivateKey(): string {
  const raw = process.env.LICENSE_SIGNING_PRIVATE_KEY;
  if (!raw) throw new Error('LICENSE_SIGNING_PRIVATE_KEY environment variable is not set');
  return raw.replace(/\\n/g, '\n');
}

export function signLicenseData(data: {
  licenseKey: string;
  deviceId: string;
  subscriptionEndsAt: Date | null;
  subscriptionStatus: string;
  planTier: string | null;
}): string {
  const payload = JSON.stringify({
    key: data.licenseKey,
    device: data.deviceId,
    subEnd: data.subscriptionEndsAt?.toISOString() || null,
    status: data.subscriptionStatus,
    tier: data.planTier ?? (data.subscriptionStatus === 'trial' ? 'trial' : 'basic'),
    timestamp: Date.now(),
  });

  const sign = crypto.createSign('SHA256');
  sign.update(payload);
  const signature = sign.sign(getPrivateKey(), 'base64');

  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
}

