import {getRequestConfig} from 'next-intl/server';
// Use complete message files from apps/frontend/messages/
import en from '../../messages/en.json';

export default getRequestConfig(async ({locale}) => {
  // Force English always
  return {
    locale: 'en',
    messages: en,
  };
});
