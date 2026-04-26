import { PaymentsController } from './payments.controller';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let pixService: { generatePixCharge: jest.Mock };
  let cardService: { tokenizeCard: jest.Mock; chargeCard: jest.Mock };

  beforeEach(() => {
    pixService = {
      generatePixCharge: jest.fn(),
    };
    cardService = {
      tokenizeCard: jest.fn(),
      chargeCard: jest.fn(),
    };
    controller = new PaymentsController(pixService as any, cardService as any);
  });

  it('should call PixService for mintWithPix', async () => {
    const body = {
      userId: 'user-1',
      amountBRL: '120.00',
      stellarAddress: 'GABC',
      cpf: '12345678901',
      name: 'User One',
    };
    pixService.generatePixCharge.mockResolvedValue({ ok: true, payment: { txId: 'TX1' } });

    const result = await controller.mintWithPix(body);

    expect(result).toEqual({ ok: true, payment: { txId: 'TX1' } });
    expect(pixService.generatePixCharge).toHaveBeenCalledWith(body);
  });

  it('should call CardService for tokenizeCard', async () => {
    const body = {
      userId: 'user-1',
      number: '4111111111111111',
      holderName: 'User One',
      expiryMonth: '12',
      expiryYear: '2030',
      cvv: '123',
    };
    cardService.tokenizeCard.mockResolvedValue({ ok: true, token: { id: 'card_tok_1' } });

    const result = await controller.tokenizeCard(body);

    expect(result).toEqual({ ok: true, token: { id: 'card_tok_1' } });
    expect(cardService.tokenizeCard).toHaveBeenCalledWith(body);
  });

  it('should call CardService for chargeCard', async () => {
    const body = {
      userId: 'user-1',
      tokenId: 'card_tok_1',
      amount: 200,
      currency: 'BRL',
    };
    cardService.chargeCard.mockResolvedValue({ ok: true, txHash: 'tx-123' });

    const result = await controller.chargeCard(body);

    expect(result).toEqual({ ok: true, txHash: 'tx-123' });
    expect(cardService.chargeCard).toHaveBeenCalledWith(body);
  });
});
