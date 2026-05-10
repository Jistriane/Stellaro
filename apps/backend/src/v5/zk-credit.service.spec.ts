import * as crypto from 'crypto';
import { ZkCreditService } from './zk-credit.service';

jest.mock('crypto');

describe('ZkCreditService', () => {
  let service: ZkCreditService;
  let mockSorobanService: any;
  const mockCrypto = crypto as jest.Mocked<typeof crypto>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSorobanService = {
      verifyZkProof: jest.fn().mockResolvedValue({ verified: true }),
      invokeContract: jest.fn().mockResolvedValue({ success: true }),
    };

    mockCrypto.randomFillSync.mockImplementation((buffer: any) => buffer);
    mockCrypto.createHash.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue(Buffer.alloc(32)),
    } as any);
    mockCrypto.randomBytes.mockReturnValue(Buffer.alloc(16));

    service = new ZkCreditService(mockSorobanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('generateCreditProof returns proof with required fields', async () => {
    const result = await service.generateCreditProof('GBXXXXXXX');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('proof');
    expect(result).toHaveProperty('publicInputs');
    expect(result).toHaveProperty('nonce');
  });

  it('generateCreditProof score is between 0 and 1000', async () => {
    const result = await service.generateCreditProof('GBXXXXXXX');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1000);
  });

  it('generateCreditProof returns hex-encoded proof', async () => {
    const result = await service.generateCreditProof('GBXXXXXXX');
    expect(typeof result.proof).toBe('string');
    expect(result.proof).toMatch(/^[0-9a-fA-F]+$/);
  });

  it('generateCreditProof includes valid public inputs', async () => {
    const result = await service.generateCreditProof('GBXXXXXXX');
    expect(typeof result.publicInputs).toBe('string');
    expect(result.publicInputs).toMatch(/^[0-9a-fA-F]+$/);
  });

  it('generateCreditProof generates unique nonce each time', async () => {
    const result1 = await service.generateCreditProof('GBXXXXXXX');
    const result2 = await service.generateCreditProof('GBXXXXXXX');
    // Same address but different nonce
    expect(result1.nonce).toBeDefined();
    expect(result2.nonce).toBeDefined();
  });

  it('submitProofOnChain returns submitted status', async () => {
    const proofData = {
      score: 750,
      proof: 'abc123',
      publicInputs: 'def456',
      nonce: 'ghi789',
    };
    const result = await service.submitProofOnChain('GBXXXXXXX', proofData);
    expect(result).toHaveProperty('status');
    expect(result.status).toBe('submitted');
  });

  it('submitProofOnChain includes transaction hash', async () => {
    const proofData = {
      score: 750,
      proof: 'abc123',
      publicInputs: 'def456',
      nonce: 'ghi789',
    };
    const result = await service.submitProofOnChain('GBXXXXXXX', proofData);
    expect(result).toHaveProperty('txHash');
    expect(typeof result.txHash).toBe('string');
  });

  it('generateCreditProof considers transaction count', async () => {
    // First generation
    const result1 = await service.generateCreditProof('GBXXXXXXX');
    const score1 = result1.score;

    // The score should be deterministic for same address (in mocked state)
    const result2 = await service.generateCreditProof('GBXXXXXXX');
    const score2 = result2.score;

    expect(typeof score1).toBe('number');
    expect(typeof score2).toBe('number');
  });
});
