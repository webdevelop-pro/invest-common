export function getBlogAssetUrl(fileName: string) {
  const modules = import.meta.glob('@/assets/images/resources/*.{png,jpg}', { eager: true, import: 'default' });
  const moduleKeys = Object.keys(modules);
  const fileSrc = moduleKeys.find((key) => key.includes(fileName));

  return fileSrc ? modules[fileSrc] as string : '';
}
