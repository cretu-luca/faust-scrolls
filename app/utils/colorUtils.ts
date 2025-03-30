/**
 * Generates a color on a red-to-green gradient based on a value's position within a range
 * @param value The value to generate a color for
 * @param min The minimum value in the range
 * @param max The maximum value in the range
 * @param inverse If true, higher values are red and lower values are green
 * @returns A CSS color string in hex format
 */
export function getGradientColor(
  value: number, 
  min: number, 
  max: number, 
  inverse: boolean = false
): string {
  if (min === max) return '#ffff00';
  
  let percentage = (value - min) / (max - min);
  
  if (inverse) {
    percentage = 1 - percentage;
  }
  
  percentage = Math.max(0, Math.min(1, percentage));
  
  const r = Math.floor(255 * (1 - percentage));
  const g = Math.floor(255 * percentage);
  const b = 0;
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
} 