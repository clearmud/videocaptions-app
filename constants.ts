
import type { AnimationType, FontFamily } from './types';
import { AnimationType as AnimationTypeEnum, FontFamily as FontFamilyEnum } from './types';


export const FONT_OPTIONS: { label: string; value: FontFamily }[] = [
  { label: 'Poppins', value: FontFamilyEnum.Poppins },
  { label: 'Roboto', value: FontFamilyEnum.Roboto },
  { label: 'Bebas Neue', value: FontFamilyEnum.BebasNeue },
  { label: 'Lobster', value: FontFamilyEnum.Lobster },
  { label: 'Arial', value: FontFamilyEnum.Arial },
];

export const ANIMATION_OPTIONS: { label: string; value: AnimationType }[] = [
  { label: 'None', value: AnimationTypeEnum.None },
  { label: 'Fade In', value: AnimationTypeEnum.FadeIn },
  { label: 'Slide Up', value: AnimationTypeEnum.SlideUp },
  { label: 'Pop Up', value: AnimationTypeEnum.PopUp },
  { label: 'Karaoke', value: AnimationTypeEnum.Karaoke },
];

export const COLOR_PALETTE: string[] = [
  '#FFFFFF',
  '#000000',
  '#FFD700', // Yellow
  '#1E90FF', // Blue
  '#FF69B4', // Pink
  '#32CD32', // Green
  '#FF4500', // Red
  '#9400D3', // Purple
];
