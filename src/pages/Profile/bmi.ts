export function calculateBMI(heightCm: number, weightKg: number): number {
  if (heightCm <= 0) {
    throw new Error("Height must be greater than zero.");
  }
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return parseFloat(bmi.toFixed(2));
}

export function classifyBMI(bmi: number): string {
  if (bmi < 18.5) {
    return "Underweight";
  } else if (bmi >= 18.5 && bmi < 24.9) {
    return "Normal weight";
  } else if (bmi >= 25 && bmi < 29.9) {
    return "Overweight";
  } else {
    return "Obesity";
  }
}