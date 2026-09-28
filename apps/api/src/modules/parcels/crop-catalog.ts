export interface CropCatalogEntry {
  value: string;
  label: string;
  // Humedad objetivo típica para este cultivo (0-100), usada para sugerir
  // humidityThreshold al crear una zona. Valores de referencia general, no
  // de un dataset específico — ajustables (constitution.md #8, mismo
  // criterio que otros umbrales "documentados, ajustables a futuro").
  suggestedHumidityThreshold: number;
}

export const CROP_CATALOG: CropCatalogEntry[] = [
  { value: 'MAIZ', label: 'Maíz', suggestedHumidityThreshold: 60 },
  { value: 'VID', label: 'Vid', suggestedHumidityThreshold: 45 },
  { value: 'TOMATE', label: 'Tomate', suggestedHumidityThreshold: 65 },
  { value: 'TRIGO', label: 'Trigo', suggestedHumidityThreshold: 50 },
  { value: 'FRIJOL', label: 'Frijol', suggestedHumidityThreshold: 55 },
  { value: 'CHILE', label: 'Chile', suggestedHumidityThreshold: 60 },
  { value: 'AGUACATE', label: 'Aguacate', suggestedHumidityThreshold: 55 },
  { value: 'CAFE', label: 'Café', suggestedHumidityThreshold: 65 },
];
