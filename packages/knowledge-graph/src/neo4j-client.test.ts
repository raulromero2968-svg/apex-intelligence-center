/**
 * Neo4j Client Unit Tests
 *
 * Tests for the Neo4jClient class and helper functions.
 * Uses mocking to avoid requiring an actual Neo4j instance.
 */

import neo4j from 'neo4j-driver';
import {
  Neo4jClient,
  Neo4jConfig,
  createNeo4jClient,
  CardNode,
  ResearchNode,
  ConceptNode,
} from './neo4j-client';

// Mock neo4j-driver
jest.mock('neo4j-driver', () => {
  const mockSession = {
    run: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  };

  const mockDriver = {
    session: jest.fn().mockReturnValue(mockSession),
    close: jest.fn().mockResolvedValue(undefined),
  };

  return {
    __esModule: true,
    default: {
      driver: jest.fn().mockReturnValue(mockDriver),
      auth: {
        basic: jest.fn().mockReturnValue({ scheme: 'basic' }),
      },
      isInt: jest.fn().mockReturnValue(false),
    },
  };
});

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid-1234'),
}));

describe('Neo4jClient', () => {
  let client: Neo4jClient;
  let mockSession: any;
  let mockDriver: any;

  const testConfig: Neo4jConfig = {
    uri: 'bolt://localhost:7687',
    username: 'neo4j',
    password: 'password',
    database: 'test',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Get mocks
    mockDriver = (neo4j.driver as jest.Mock).mock.results[0]?.value || {
      session: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };
    mockSession = {
      run: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };
    mockDriver.session = jest.fn().mockReturnValue(mockSession);

    // Re-mock driver to ensure fresh instance
    (neo4j.driver as jest.Mock).mockReturnValue(mockDriver);

    client = new Neo4jClient(testConfig);
  });

  afterEach(async () => {
    await client.close();
  });

  describe('constructor', () => {
    it('should create a driver with correct config', () => {
      expect(neo4j.driver).toHaveBeenCalledWith(
        testConfig.uri,
        expect.anything()
      );
      expect(neo4j.auth.basic).toHaveBeenCalledWith(
        testConfig.username,
        testConfig.password
      );
    });

    it('should use default database if not provided', () => {
      const configWithoutDb: Neo4jConfig = {
        uri: 'bolt://localhost:7687',
        username: 'neo4j',
        password: 'password',
      };
      const clientWithoutDb = new Neo4jClient(configWithoutDb);
      // The database should default to 'neo4j'
      expect(clientWithoutDb).toBeDefined();
    });
  });

  describe('verifyConnectivity', () => {
    it('should return true when connection succeeds', async () => {
      mockSession.run.mockResolvedValue({ records: [] });

      const result = await client.verifyConnectivity();

      expect(result).toBe(true);
      expect(mockSession.run).toHaveBeenCalledWith('RETURN 1');
      expect(mockSession.close).toHaveBeenCalled();
    });

    it('should return false when connection fails', async () => {
      mockSession.run.mockRejectedValue(new Error('Connection refused'));

      const result = await client.verifyConnectivity();

      expect(result).toBe(false);
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('read', () => {
    it('should execute a read query and transform results', async () => {
      const mockRecords = [
        {
          keys: ['name', 'count'],
          get: jest.fn((key: string) => (key === 'name' ? 'Test' : 10)),
        },
      ];
      mockSession.run.mockResolvedValue({ records: mockRecords });

      const results = await client.read('MATCH (n) RETURN n.name as name, count(n) as count');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ name: 'Test', count: 10 });
      expect(mockSession.close).toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      mockSession.run.mockResolvedValue({ records: [] });

      const results = await client.read('MATCH (n:NonExistent) RETURN n');

      expect(results).toHaveLength(0);
    });

    it('should pass parameters to query', async () => {
      mockSession.run.mockResolvedValue({ records: [] });

      await client.read('MATCH (n {id: $id}) RETURN n', { id: '123' });

      expect(mockSession.run).toHaveBeenCalledWith(
        'MATCH (n {id: $id}) RETURN n',
        { id: '123' }
      );
    });
  });

  describe('write', () => {
    it('should execute a write query and return results', async () => {
      const mockRecords = [
        {
          keys: ['n'],
          get: jest.fn().mockReturnValue({
            labels: ['Card'],
            properties: { id: 'test-id', name: 'Test Card' },
            identity: { toNumber: () => 1 },
          }),
        },
      ];
      mockSession.run.mockResolvedValue({ records: mockRecords });

      const results = await client.write('CREATE (n:Card {name: $name}) RETURN n', {
        name: 'Test Card',
      });

      expect(results).toHaveLength(1);
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('createCard', () => {
    it('should create a card with all fields', async () => {
      const cardInput = {
        name: 'Charizard',
        set: 'Base Set',
        rarity: 'Holo Rare',
        cardNumber: '4/102',
        releaseDate: new Date('1999-01-09'),
        description: 'A fire-breathing dragon',
        type: 'Pokemon',
        attributes: { hp: 120, type: 'Fire' },
        imageUrl: 'https://example.com/charizard.png',
      };

      const mockCardResult = {
        keys: ['c'],
        get: jest.fn().mockReturnValue({
          labels: ['Card'],
          properties: {
            id: 'test-uuid-1234',
            ...cardInput,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          identity: { toNumber: () => 1 },
        }),
      };
      mockSession.run.mockResolvedValue({ records: [mockCardResult] });

      const result = await client.createCard(cardInput);

      expect(mockSession.run).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findCardsByName', () => {
    it('should use fulltext search for card names', async () => {
      const mockRecords = [
        {
          keys: ['c', 'score'],
          get: jest.fn((key: string) => {
            if (key === 'c') {
              return {
                labels: ['Card'],
                properties: { id: '1', name: 'Charizard' },
                identity: { toNumber: () => 1 },
              };
            }
            return 0.95;
          }),
        },
      ];
      mockSession.run.mockResolvedValue({ records: mockRecords });

      const results = await client.findCardsByName('Charizard');

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('db.index.fulltext.queryNodes'),
        { searchTerm: 'Charizard~' }
      );
      expect(results).toHaveLength(1);
    });
  });

  describe('getCardPriceHistory', () => {
    it('should return price history for a card', async () => {
      const mockRecords = [
        {
          keys: ['date', 'price', 'grading', 'condition'],
          get: jest.fn((key: string) => {
            const values: Record<string, any> = {
              date: new Date('2025-01-01'),
              price: 350.0,
              grading: 'PSA 10',
              condition: 'Near Mint',
            };
            return values[key];
          }),
        },
      ];
      mockSession.run.mockResolvedValue({ records: mockRecords });

      const history = await client.getCardPriceHistory('card-123', 10);

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('PRICED_AT'),
        { cardId: 'card-123', limit: 10 }
      );
      expect(history).toHaveLength(1);
    });
  });

  describe('createResearch', () => {
    it('should create a research paper node', async () => {
      const researchInput = {
        title: 'Test Paper',
        abstract: 'This is a test abstract',
        authors: ['Author 1', 'Author 2'],
        year: 2025,
        venue: 'NeurIPS',
        url: 'https://arxiv.org/abs/12345',
        keywords: ['AI', 'ML'],
        citationCount: 10,
      };

      const mockResult = {
        keys: ['r'],
        get: jest.fn().mockReturnValue({
          labels: ['Research'],
          properties: { id: 'test-uuid-1234', ...researchInput },
          identity: { toNumber: () => 1 },
        }),
      };
      mockSession.run.mockResolvedValue({ records: [mockResult] });

      const result = await client.createResearch(researchInput);

      expect(mockSession.run).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('createCitation', () => {
    it('should create a citation relationship between papers', async () => {
      mockSession.run.mockResolvedValue({ records: [] });

      await client.createCitation(
        'paper-1',
        'paper-2',
        'Relevant prior work',
        'Related Work'
      );

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CITES'),
        expect.objectContaining({
          citingPaperId: 'paper-1',
          citedPaperId: 'paper-2',
          context: 'Relevant prior work',
          section: 'Related Work',
        })
      );
    });
  });

  describe('findCitingPapers', () => {
    it('should find papers that cite a given paper', async () => {
      const mockRecords = [
        {
          keys: ['paper'],
          get: jest.fn().mockReturnValue({
            labels: ['Research'],
            properties: { id: 'citing-paper', title: 'Citing Paper' },
            identity: { toNumber: () => 1 },
          }),
        },
      ];
      mockSession.run.mockResolvedValue({ records: mockRecords });

      const results = await client.findCitingPapers('cited-paper-id');

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CITES'),
        { paperId: 'cited-paper-id' }
      );
      expect(results).toHaveLength(1);
    });
  });

  describe('createConcept', () => {
    it('should create or merge a concept node', async () => {
      const conceptInput = {
        name: 'machine learning',
        definition: 'A subset of AI',
        category: 'technology',
        frequency: 1,
      };

      const mockResult = {
        keys: ['c'],
        get: jest.fn().mockReturnValue({
          labels: ['Concept'],
          properties: { id: 'test-uuid-1234', ...conceptInput },
          identity: { toNumber: () => 1 },
        }),
      };
      mockSession.run.mockResolvedValue({ records: [mockResult] });

      const result = await client.createConcept(conceptInput);

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('MERGE'),
        expect.objectContaining({ name: 'machine learning' })
      );
      expect(result).toBeDefined();
    });
  });

  describe('createConceptCoOccurrence', () => {
    it('should create co-occurrence relationship between concepts', async () => {
      mockSession.run.mockResolvedValue({ records: [] });

      await client.createConceptCoOccurrence('concept-1', 'concept-2', 'paper-123');

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CO_OCCURS_WITH'),
        expect.objectContaining({
          concept1Name: 'concept-1',
          concept2Name: 'concept-2',
          paperId: 'paper-123',
        })
      );
    });
  });

  describe('findRelatedConcepts', () => {
    it('should find concepts that co-occur with a given concept', async () => {
      const mockRecords = [
        {
          keys: ['concept', 'frequency'],
          get: jest.fn((key: string) => (key === 'concept' ? 'related-concept' : 5)),
        },
      ];
      mockSession.run.mockResolvedValue({ records: mockRecords });

      const results = await client.findRelatedConcepts('test-concept', 5);

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CO_OCCURS_WITH'),
        { conceptName: 'test-concept', limit: 5 }
      );
      expect(results).toHaveLength(1);
      expect(results[0].concept).toBe('related-concept');
      expect(results[0].frequency).toBe(5);
    });
  });

  describe('close', () => {
    it('should close the driver connection', async () => {
      await client.close();

      expect(mockDriver.close).toHaveBeenCalled();
    });
  });
});

describe('createNeo4jClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create client from environment variables', () => {
    process.env.NEO4J_URI = 'bolt://custom:7687';
    process.env.NEO4J_USERNAME = 'custom-user';
    process.env.NEO4J_PASSWORD = 'custom-pass';
    process.env.NEO4J_DATABASE = 'custom-db';

    const client = createNeo4jClient();

    expect(client).toBeDefined();
    expect(neo4j.driver).toHaveBeenCalledWith(
      'bolt://custom:7687',
      expect.anything()
    );
  });

  it('should use default values when env vars not set', () => {
    delete process.env.NEO4J_URI;
    delete process.env.NEO4J_USERNAME;
    delete process.env.NEO4J_PASSWORD;
    delete process.env.NEO4J_DATABASE;

    const client = createNeo4jClient();

    expect(client).toBeDefined();
    expect(neo4j.driver).toHaveBeenCalledWith(
      'bolt://localhost:7687',
      expect.anything()
    );
  });
});
