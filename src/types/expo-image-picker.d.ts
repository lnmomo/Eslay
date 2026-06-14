declare module "expo-image-picker" {
  export const MediaTypeOptions: { Images: unknown };
  export type ImagePickerAsset = { uri: string; base64?: string | null; mimeType?: string | null };
  export type ImagePickerResult = { canceled: boolean; assets?: ImagePickerAsset[] };
  export function requestMediaLibraryPermissionsAsync(): Promise<{ granted: boolean }>;
  export function launchImageLibraryAsync(options?: {
    mediaTypes?: unknown;
    allowsMultipleSelection?: boolean;
    quality?: number;
    base64?: boolean;
  }): Promise<ImagePickerResult>;
}
