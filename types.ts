export enum Tone {
  DRAMATIC = 'Dramático & Intenso',
  CINEMATIC = 'Cinematográfico / Blockbuster',
  NOIR = 'Film Noir / Misterio',
  SCI_FI = 'Ciencia Ficción / Cyberpunk',
  WHIMSICAL = 'Fantasía / Estilo Wes Anderson',
  HORROR = 'Terror / Psicológico',
  DOCUMENTARY = 'Documentary / Realistic',
  VINTAGE = 'Vintage / 35mm Retro'
}

export enum Structure {
  VISUAL_PROMPT = 'Prompt Visual (Para IA de Video: Veo, Sora, Midjourney)',
  SCREENPLAY_SCENE = 'Escena de Guion (Formato Estándar)',
  LOGLINE = 'Logline & Pitch de Venta',
  CHARACTER_BIO = 'Perfil de Personaje & Casting',
  STORY_BEATS = 'Estructura Narrativa (Beat Sheet)',
  DIRECTORS_TREATMENT = 'Tratamiento de Director (Visión Artística)'
}

export enum OutputLanguage {
  ENGLISH = 'Inglés (Recomendado para Generadores de Video)',
  SPANISH = 'Español',
  FRENCH = 'Francés',
  JAPANESE = 'Japonés',
  GERMAN = 'Alemán'
}

export interface PromptOptions {
  tone: Tone;
  structure: Structure;
  language: OutputLanguage;
  includeExamples: boolean;
  addReasoning: boolean;
}

export interface OptimizedResult {
  originalText: string;
  optimizedPrompt: string;
  explanation: string; // Directors Note
}

export interface HistoryItem extends OptimizedResult {
  id: string;
  timestamp: number;
}