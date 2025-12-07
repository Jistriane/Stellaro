import { Test, TestingModule } from '@nestjs/testing';
import { GovernanceService } from './governance.service';
import { ChainService } from '../chain/chain.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GovernanceService', () => {
  let service: GovernanceService;
  let chain: jest.Mocked<ChainService>;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovernanceService,
        {
          provide: ChainService,
          useValue: {
            simulateContractCallReal: jest.fn(),
            submitTxReal: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            governanceAudit: {
              create: jest.fn(),
            },
            proposal: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            vote: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<GovernanceService>(GovernanceService);
    chain = module.get(ChainService) as jest.Mocked<ChainService>;
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setPause', () => {
    it('should set pause with dry run', async () => {
      const params = {
        stablecoin: 'STLT',
        paused: true,
        dryRun: true,
      };
      chain.simulateContractCallReal.mockResolvedValueOnce({
        ok: true,
        estimatedFee: 100,
      } as any);

      const result = await service.setPause(params);

      expect(result.ok).toBe(true);
      expect(result.method).toBe('set_paused');
      expect(result.dryRun?.estimatedFee).toBe(100);
      expect(chain.simulateContractCallReal).toHaveBeenCalled();
    });

    it('should submit pause transaction', async () => {
      const params = {
        stablecoin: 'STLT',
        paused: true,
      };
      chain.submitTxReal.mockResolvedValueOnce({
        ok: true,
        txHash: 'tx_123456',
      } as any);

      const result = await service.setPause(params);

      expect(result.ok).toBe(true);
      expect(result.txHash).toBe('tx_123456');
      expect(chain.submitTxReal).toHaveBeenCalled();
    });

    it('should handle pause transaction error', async () => {
      const params = {
        stablecoin: 'STLT',
        paused: true,
      };
      chain.submitTxReal.mockResolvedValueOnce({
        ok: false,
        error: 'Network error',
      } as any);

      const result = await service.setPause(params);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('setMintEnabled', () => {
    it('should set mint enabled with dry run', async () => {
      const params = {
        stablecoin: 'STLT',
        enabled: true,
        dryRun: true,
      };
      chain.simulateContractCallReal.mockResolvedValueOnce({
        ok: true,
        estimatedFee: 150,
      } as any);

      const result = await service.setMintEnabled(params);

      expect(result.ok).toBe(true);
      expect(result.method).toBe('set_mint_enabled');
      expect(result.dryRun?.estimatedFee).toBe(150);
    });

    it('should submit mint enabled transaction', async () => {
      const params = {
        stablecoin: 'STLT',
        enabled: false,
      };
      chain.submitTxReal.mockResolvedValueOnce({
        ok: true,
        txHash: 'tx_789012',
      } as any);

      const result = await service.setMintEnabled(params);

      expect(result.ok).toBe(true);
      expect(result.txHash).toBe('tx_789012');
    });
  });

  describe('setFeeRate', () => {
    it('should set fee rate with dry run', async () => {
      const params = {
        stablecoin: 'STLT',
        newRate: 50,
        dryRun: true,
      };
      chain.simulateContractCallReal.mockResolvedValueOnce({
        ok: true,
        estimatedFee: 120,
      } as any);

      const result = await service.setFeeRate(params);

      expect(result.ok).toBe(true);
      expect(result.method).toBe('set_fee_rate');
      expect(result.dryRun?.estimatedFee).toBe(120);
    });

    it('should submit fee rate transaction', async () => {
      const params = {
        stablecoin: 'STLT',
        newRate: 75,
      };
      chain.submitTxReal.mockResolvedValueOnce({
        ok: true,
        txHash: 'tx_345678',
      } as any);

      const result = await service.setFeeRate(params);

      expect(result.ok).toBe(true);
      expect(result.txHash).toBe('tx_345678');
    });
  });

  describe('createProposal', () => {
    it('should create governance proposal', async () => {
      const proposalData = {
        title: 'Increase Fee Rate',
        description: 'Proposal to increase fee rate to 0.5%',
        actionType: 'SET_FEE_RATE',
        actionParams: { rate: 50 },
      };
      prisma.proposal.create.mockResolvedValueOnce({
        id: 'prop_123',
        ...proposalData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.createProposal(proposalData);

      expect(result.id).toBe('prop_123');
      expect(result.title).toBe('Increase Fee Rate');
      expect(prisma.proposal.create).toHaveBeenCalled();
    });
  });

  describe('getProposal', () => {
    it('should get proposal by id', async () => {
      const proposalId = 'prop_456';
      const proposal = {
        id: proposalId,
        title: 'Test Proposal',
        status: 'ACTIVE',
        votesFor: 100,
        votesAgainst: 20,
      };
      prisma.proposal.findUnique.mockResolvedValueOnce(proposal as any);

      const result = await service.getProposal(proposalId);

      expect(result.id).toBe(proposalId);
      expect(result.title).toBe('Test Proposal');
      expect(result.status).toBe('ACTIVE');
    });

    it('should return null for non-existent proposal', async () => {
      prisma.proposal.findUnique.mockResolvedValueOnce(null);

      const result = await service.getProposal('invalid_id');

      expect(result).toBeNull();
    });
  });

  describe('listProposals', () => {
    it('should list active proposals', async () => {
      const proposals = [
        { id: 'prop_1', title: 'Proposal 1', status: 'ACTIVE' },
        { id: 'prop_2', title: 'Proposal 2', status: 'ACTIVE' },
      ];
      prisma.proposal.findMany.mockResolvedValueOnce(proposals as any);

      const result = await service.listProposals({ status: 'ACTIVE' });

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('prop_1');
      expect(prisma.proposal.findMany).toHaveBeenCalled();
    });

    it('should list all proposals when no filter provided', async () => {
      const proposals = [
        { id: 'prop_1', title: 'Proposal 1' },
        { id: 'prop_2', title: 'Proposal 2' },
        { id: 'prop_3', title: 'Proposal 3' },
      ];
      prisma.proposal.findMany.mockResolvedValueOnce(proposals as any);

      const result = await service.listProposals();

      expect(result.length).toBe(3);
    });
  });

  describe('vote', () => {
    it('should vote for proposal', async () => {
      const voteData = {
        proposalId: 'prop_123',
        userId: 'user_456',
        support: true,
      };
      prisma.vote.create.mockResolvedValueOnce({
        id: 'vote_789',
        ...voteData,
        createdAt: new Date(),
      } as any);

      const result = await service.vote(voteData);

      expect(result.id).toBe('vote_789');
      expect(result.support).toBe(true);
      expect(prisma.vote.create).toHaveBeenCalled();
    });

    it('should vote against proposal', async () => {
      const voteData = {
        proposalId: 'prop_123',
        userId: 'user_456',
        support: false,
      };
      prisma.vote.create.mockResolvedValueOnce({
        id: 'vote_790',
        ...voteData,
        createdAt: new Date(),
      } as any);

      const result = await service.vote(voteData);

      expect(result.support).toBe(false);
    });
  });

  describe('getProposalVotes', () => {
    it('should get votes for proposal', async () => {
      const proposalId = 'prop_123';
      const votes = [
        { id: 'vote_1', support: true, weight: 100 },
        { id: 'vote_2', support: false, weight: 50 },
      ];
      prisma.vote.findMany.mockResolvedValueOnce(votes as any);

      const result = await service.getProposalVotes(proposalId);

      expect(result.length).toBe(2);
      expect(result[0].support).toBe(true);
      expect(prisma.vote.findMany).toHaveBeenCalled();
    });
  });
});
