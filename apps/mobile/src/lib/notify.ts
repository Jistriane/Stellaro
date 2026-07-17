import { Alert, Platform } from 'react-native';

export function notify(title: string, message?: string) {
  const safeTitle = String(title || 'Aviso');
  const safeMessage = message ? String(message) : '';

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const text = safeMessage ? `${safeTitle}\n\n${safeMessage}` : safeTitle;
    window.alert(text);
    return;
  }

  Alert.alert(safeTitle, safeMessage);
}
