import {getRequestConfig} from 'next-intl/server';
// Unificar fonte das mensagens: usar os arquivos completos em apps/frontend/messages/
// para garantir que chaves como routes, events, settings etc. existam em ambas línguas.
import pt from '../../messages/pt.json';
import en from '../../messages/en.json';

export default getRequestConfig(async ({locale}) => {
  const lc = (locale === 'en' ? 'en' : 'pt') as 'en' | 'pt';
  const messages = lc === 'en' ? en : pt;

  return {
    locale: lc,
    messages,
  };
});
