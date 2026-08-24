export interface QtiPlayerMetadata {
  identifier: string;
  mimeType: string;
  [key: string]: any; // items, sections, previewUrl, sessionControl, timeLimitSeconds, context, ...
}

export interface QtiPlayerEvent {
  type: string;
  data: any;
  playerId: string;
  timestamp: number;
}