export enum AnimationType {
  None = 'None',
  FadeIn = 'FadeIn',
  SlideUp = 'SlideUp',
  PopUp = 'PopUp',
  Karaoke = 'Karaoke',
}

export enum FontFamily {
  Arial = 'Arial, sans-serif',
  Poppins = 'Poppins, sans-serif',
  Roboto = 'Roboto, sans-serif',
  BebasNeue = "'Bebas Neue', cursive",
  Lobster = 'Lobster, cursive',
}

export interface CaptionStyle {
  fontFamily: FontFamily;
  fontSize: number;
  primaryColor: string;
  outlineColor: string;
  outlineWidth: number;
  backgroundColor: string;
  backgroundOpacity: number;
  showBackground: boolean;
  textTransform: 'none' | 'uppercase';
  glowColor: string;
  glowStrength: number;
  position: { x: number; y: number }; // x, y as percentages
}

export interface Caption {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  style: CaptionStyle;
  animation: AnimationType;
}