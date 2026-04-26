# 🛠️ Stellaro Developer SDK & API Spec

O Stellaro é construído para ser uma plataforma aberta. Desenvolvedores externos podem integrar seus aplicativos e serviços utilizando nossa infraestrutura de APIs e Webhooks.

## 📡 Webhooks

Fique por dentro de tudo o que acontece no protocolo em tempo real.

### Eventos Disponíveis:
- `LIQUIDATION`: Disparado quando um empréstimo é liquidado.
- `SWAP_COMPLETE`: Disparado após um rebalanceamento de portfólio.
- `PROPOSAL_CREATED`: Nova proposta na DAO.
- `VC_ISSUED`: Emissão de nova Verifiable Credential.

### Exemplo de Payload:
```json
{
  "event": "LIQUIDATION",
  "timestamp": 1714115400000,
  "data": {
    "userId": "G...",
    "asset": "RWA-GOLD",
    "amount": 50.5
  }
}
```

## 🏗️ SDK Integration (Frontend)

Para integrar a carteira Stellaro em seu dApp:

```typescript
import { StellaroWallet } from '@stellaro/sdk';

const wallet = new StellaroWallet();
await wallet.connect();

// Assinar transação via Passkey (iOS/Android)
const tx = await wallet.signTransaction(xdr);
```

## 🔐 Auth & Security

Todas as chamadas à API exigem um `X-Stellaro-Key` ou uma assinatura válida da carteira do usuário. 
Consulte nosso [Security Guide](./SECURITY_BEST_PRACTICES.md) para detalhes sobre o modelo de permissões.

---
*Construa o futuro das finanças com o Stellaro.*
