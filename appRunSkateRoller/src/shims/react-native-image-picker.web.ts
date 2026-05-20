export type ImagePickerResponse = {
  assets?: Array<{
    uri?: string;
    fileName?: string;
    type?: string;
    fileSize?: number;
    width?: number;
    height?: number;
  }>;
  didCancel?: boolean;
  errorCode?: string;
  errorMessage?: string;
};

type Callback = (response: ImagePickerResponse) => void;

export function launchImageLibrary(_options: any, callback?: Callback): Promise<ImagePickerResponse> {
  const resp: ImagePickerResponse = {
    didCancel: true,
    errorCode: 'web_unsupported',
    errorMessage: 'react-native-image-picker no está disponible en Web.',
  };
  if (callback) callback(resp);
  return Promise.resolve(resp);
}

export function launchCamera(_options: any, callback?: Callback): Promise<ImagePickerResponse> {
  const resp: ImagePickerResponse = {
    didCancel: true,
    errorCode: 'web_unsupported',
    errorMessage: 'react-native-image-picker no está disponible en Web.',
  };
  if (callback) callback(resp);
  return Promise.resolve(resp);
}

