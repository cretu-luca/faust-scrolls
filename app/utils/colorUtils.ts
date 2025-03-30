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
  // Prevent division by zero
  if (min === max) return '#ffff00'; // Yellow as default if there's no range
  
  // Calculate the percentage (0-1) where the value falls in the range
  let percentage = (value - min) / (max - min);
  
  // If inverse is true, flip the percentage
  if (inverse) {
    percentage = 1 - percentage;
  }
  
  // Clamp between 0-1 to handle edge cases
  percentage = Math.max(0, Math.min(1, percentage));
  
  // Generate RGB values for a red-to-green gradient
  // Red component decreases as percentage increases
  // Green component increases as percentage increases
  const r = Math.floor(255 * (1 - percentage));
  const g = Math.floor(255 * percentage);
  const b = 0; // No blue for red-to-green
  
  // Convert RGB to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
} 