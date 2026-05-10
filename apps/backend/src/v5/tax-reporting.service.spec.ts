import { TaxReportingService } from './tax-reporting.service';

describe('TaxReportingService', () => {
  let service: TaxReportingService;
  let mockSorobanService: any;

  beforeEach(() => {
    mockSorobanService = {
      queryTransactions: jest.fn().mockResolvedValue([
        { date: '2026-02-10', asset: 'RWA-GOLD', action: 'SELL', amount: 15000 },
        { date: '2026-03-15', asset: 'STLT-USD', action: 'SWAP', amount: 2400 },
      ]),
      calculateGains: jest.fn().mockResolvedValue(125000),
    };

    service = new TaxReportingService(mockSorobanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('generateReport returns tax report with required fields', async () => {
    const report = await service.generateReport('user123', 2026);
    expect(report).toHaveProperty('userId');
    expect(report).toHaveProperty('period');
    expect(report).toHaveProperty('totalVolume');
    expect(report).toHaveProperty('capitalGains');
    expect(report).toHaveProperty('pendingLiabilities');
    expect(report).toHaveProperty('transactions');
    expect(report.userId).toBe('user123');
    expect(report.period).toContain('2026');
  });

  it('generateReport includes transaction details', async () => {
    const report = await service.generateReport('user456', 2026);
    expect(Array.isArray(report.transactions)).toBe(true);
    expect(report.transactions.length).toBeGreaterThan(0);
    expect(report.transactions[0]).toHaveProperty('date');
    expect(report.transactions[0]).toHaveProperty('asset');
    expect(report.transactions[0]).toHaveProperty('action');
    expect(report.transactions[0]).toHaveProperty('gain');
  });

  it('calculateCapitalGains returns positive value', async () => {
    const report = await service.generateReport('user789', 2026);
    expect(report.capitalGains).toBeGreaterThanOrEqual(0);
    expect(typeof report.capitalGains).toBe('number');
  });

  it('generateReport includes pending tax liabilities', async () => {
    const report = await service.generateReport('user', 2026);
    expect(report.pendingLiabilities).toBeGreaterThanOrEqual(0);
  });

  it('exportToPdf generates downloadable link', async () => {
    const report = await service.generateReport('user', 2026);
    const pdfUrl = await service.exportToPdf(report);
    expect(pdfUrl).toContain('https://');
    expect(pdfUrl).toContain('pdf');
    expect(pdfUrl).toContain('user');
  });

  it('exportToPdf includes period in filename', async () => {
    const report = await service.generateReport('user123', 2026);
    const pdfUrl = await service.exportToPdf(report);
    expect(pdfUrl).toContain('FY 2026');
  });
});
