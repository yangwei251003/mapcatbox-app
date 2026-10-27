/** All public previews are offline unless the owner explicitly rebuilds a private cloud instance. */
export const cloudEnabled = process.env.NEXT_PUBLIC_CLOUD_MODE === 'true';
export const deviceLocationEnabled = cloudEnabled && process.env.NEXT_PUBLIC_ALLOW_DEVICE_LOCATION === 'true';
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const assetPath = (path: string) => `${basePath}/${path.replace(/^\//, '')}`;
