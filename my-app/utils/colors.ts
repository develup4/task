// L4 카테고리별 색상 매핑
const colorPalette = [
  { bg: '#E3F2FD', border: '#2196F3', text: '#0D47A1' }, // Blue
  { bg: '#F3E5F5', border: '#9C27B0', text: '#4A148C' }, // Purple
  { bg: '#E8F5E9', border: '#4CAF50', text: '#1B5E20' }, // Green
  { bg: '#FFF3E0', border: '#FF9800', text: '#E65100' }, // Orange
  { bg: '#FCE4EC', border: '#E91E63', text: '#880E4F' }, // Pink
  { bg: '#E0F7FA', border: '#00BCD4', text: '#006064' }, // Cyan
  { bg: '#FFF9C4', border: '#FFEB3B', text: '#F57F17' }, // Yellow
  { bg: '#EFEBE9', border: '#795548', text: '#3E2723' }, // Brown
];

const categoryColorMap = new Map<string, typeof colorPalette[0]>();
let colorIndex = 0;

export const getColorForCategory = (category: string) => {
  if (!categoryColorMap.has(category)) {
    categoryColorMap.set(category, colorPalette[colorIndex % colorPalette.length]);
    colorIndex++;
  }
  return categoryColorMap.get(category)!;
};

export const resetColorMapping = () => {
  categoryColorMap.clear();
  colorIndex = 0;
};
