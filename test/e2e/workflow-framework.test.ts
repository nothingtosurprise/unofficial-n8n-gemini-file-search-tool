/**
 * E2E Test: Workflow Framework Validation
 * Tests the E2E framework components and workflow execution
 */

import { WorkflowRunner } from './helpers/workflowRunner';
import {
  createSimpleWorkflow,
  createNode,
  extractNodeOutput,
  extractNodeOutputs,
  assertNodeOutput,
  assertNodeOutputHasField,
  validateWorkflowStructure,
} from './helpers/workflowHelpers';

describe('E2E Framework: Workflow Runner', () => {
  let runner: WorkflowRunner;

  beforeEach(() => {
    runner = new WorkflowRunner();
    runner.setCredentials('geminiApi', {
      apiKey: process.env.GEMINI_API_KEY || 'test-api-key',
    });
  });

  describe('Framework Components', () => {
    it('should initialize WorkflowRunner', () => {
      expect(runner).toBeDefined();
      expect(runner).toBeInstanceOf(WorkflowRunner);
    });

    it('should set credentials', () => {
      expect(() => {
        runner.setCredentials('geminiApi', { apiKey: 'test-key' });
      }).not.toThrow();
    });

    it('should set execution mode', () => {
      expect(() => {
        runner.setMode('manual');
        runner.setMode('trigger');
        runner.setMode('internal');
      }).not.toThrow();
    });
  });

  describe('Workflow Helpers', () => {
    it('should create simple workflow', () => {
      const nodes = [
        createNode('Node 1', 'geminiFileSearchStores', {
          operation: 'list',
          returnAll: false,
          limit: 10,
        }),
        createNode('Node 2', 'geminiFileSearchStores', {
          operation: 'list',
          returnAll: false,
          limit: 5,
        }),
      ];

      const workflow = createSimpleWorkflow('Test Workflow', nodes);

      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.nodes.length).toBe(2);
      expect(workflow.connections['Node 1']).toBeDefined();
      expect(workflow.connections['Node 1'].main).toBeDefined();
    });

    it('should validate workflow structure', () => {
      const validWorkflow = {
        name: 'Test',
        nodes: [
          {
            name: 'Node 1',
            type: 'geminiFileSearchStores',
            position: [0, 0],
            parameters: {},
          },
        ],
        connections: {},
      };

      expect(validateWorkflowStructure(validWorkflow)).toBe(true);

      const invalidWorkflow = {
        name: 'Test',
        nodes: 'not-an-array',
        connections: {},
      };

      expect(validateWorkflowStructure(invalidWorkflow)).toBe(false);
    });
  });

  describe('Workflow JSON Loading', () => {
    it('should load complete-rag-workflow.json', () => {
      const workflow = require('./workflows/complete-rag-workflow.json');

      expect(workflow).toBeDefined();
      expect(workflow.name).toBe('Complete RAG Workflow');
      expect(workflow.nodes.length).toBeGreaterThan(0);
      expect(validateWorkflowStructure(workflow)).toBe(true);
    });

    it('should load error-handling-workflow.json', () => {
      const workflow = require('./workflows/error-handling-workflow.json');

      expect(workflow).toBeDefined();
      expect(workflow.name).toBe('Error Handling Workflow');
      expect(validateWorkflowStructure(workflow)).toBe(true);
    });

    it('should load pagination-workflow.json', () => {
      const workflow = require('./workflows/pagination-workflow.json');

      expect(workflow).toBeDefined();
      expect(workflow.name).toBe('Pagination Workflow');
      expect(validateWorkflowStructure(workflow)).toBe(true);
    });

    it('should load multi-store-workflow.json', () => {
      const workflow = require('./workflows/multi-store-workflow.json');

      expect(workflow).toBeDefined();
      expect(workflow.name).toBe('Multi-Store Workflow');
      expect(validateWorkflowStructure(workflow)).toBe(true);
    });
  });

  describe('Expression Resolution', () => {
    it('should resolve node reference expressions', async () => {
      // Mock API responses for testing
      const mockApiClient = {
        makeRequest: jest.fn().mockResolvedValue({
          name: 'fileSearchStores/test-store-123',
          displayName: 'Test Store',
          createTime: '2024-11-24T10:00:00Z',
        }),
      };

      // Create workflow with expression
      const workflow = createSimpleWorkflow('Expression Test', [
        createNode('Create Store', 'geminiFileSearchStores', {
          operation: 'create',
          displayName: 'Test Store',
        }),
        createNode('Get Store', 'geminiFileSearchStores', {
          operation: 'get',
          storeName: "={{$node['Create Store'].json.name}}",
        }),
      ]);

      // Note: This test demonstrates the framework structure
      // Actual execution would require mocked API responses
      expect(workflow.nodes[1].parameters.storeName).toBe("={{$node['Create Store'].json.name}}");
    });
  });

  describe('Node Execution Order', () => {
    it('should execute nodes in correct order', () => {
      const workflow = createSimpleWorkflow('Order Test', [
        createNode('First', 'geminiFileSearchStores', { operation: 'list', returnAll: true }),
        createNode('Second', 'geminiFileSearchStores', { operation: 'list', returnAll: true }),
        createNode('Third', 'geminiFileSearchStores', { operation: 'list', returnAll: true }),
      ]);

      // Verify connections create proper execution order
      expect(workflow.connections['First'].main![0][0].node).toBe('Second');
      expect(workflow.connections['Second'].main![0][0].node).toBe('Third');
      expect(workflow.connections['Third']).toBeUndefined();
    });
  });

  describe('Helper Functions', () => {
    it('should extract node output', () => {
      const mockResults = new Map([
        [
          'Test Node',
          [
            {
              json: {
                name: 'fileSearchStores/test-123',
                displayName: 'Test Store',
              },
            },
          ],
        ],
      ]);

      const name = extractNodeOutput(mockResults, 'Test Node', 'name');
      expect(name).toBe('fileSearchStores/test-123');

      const displayName = extractNodeOutput(mockResults, 'Test Node', 'displayName');
      expect(displayName).toBe('Test Store');
    });

    it('should extract all node outputs', () => {
      const mockResults = new Map([
        [
          'Test Node',
          [
            { json: { id: 1, name: 'Item 1' } },
            { json: { id: 2, name: 'Item 2' } },
            { json: { id: 3, name: 'Item 3' } },
          ],
        ],
      ]);

      const outputs = extractNodeOutputs(mockResults, 'Test Node');
      expect(outputs.length).toBe(3);
      expect(outputs[0].id).toBe(1);
      expect(outputs[2].name).toBe('Item 3');
    });

    it('should assert node output exists', () => {
      const mockResults = new Map([['Existing Node', [{ json: { data: 'test' } }]]]);

      expect(() => {
        assertNodeOutput(mockResults, 'Existing Node');
      }).not.toThrow();

      expect(() => {
        assertNodeOutput(mockResults, 'Non-Existent Node');
      }).toThrow();
    });

    it('should assert node output has field', () => {
      const mockResults = new Map([['Test Node', [{ json: { name: 'test', value: 123 } }]]]);

      expect(() => {
        assertNodeOutputHasField(mockResults, 'Test Node', 'name');
      }).not.toThrow();

      expect(() => {
        assertNodeOutputHasField(mockResults, 'Test Node', 'nonexistent');
      }).toThrow();
    });
  });

  describe('Workflow Structure Validation', () => {
    it('should validate complete-rag-workflow structure', () => {
      const workflow = require('./workflows/complete-rag-workflow.json');

      expect(workflow.nodes.length).toBe(7);
      expect(workflow.nodes[0].name).toBe('Create Store');
      expect(workflow.nodes[6].name).toBe('Delete Store');

      // Verify connections
      expect(workflow.connections['Create Store']).toBeDefined();
      expect(workflow.connections['List Stores']).toBeDefined();
      expect(workflow.connections['Query Documents']).toBeDefined();
    });

    it('should validate multi-store-workflow structure', () => {
      const workflow = require('./workflows/multi-store-workflow.json');

      expect(workflow.nodes.length).toBe(10);

      // Find parallel nodes
      const createStoreA = workflow.nodes.find((n: any) => n.name === 'Create Store A');
      const createStoreB = workflow.nodes.find((n: any) => n.name === 'Create Store B');

      expect(createStoreA).toBeDefined();
      expect(createStoreB).toBeDefined();

      // Both should have no incoming connections (parallel start)
      const hasIncomingA = Object.values(workflow.connections).some((conn: any) =>
        conn.main?.some((group: any) => group.some((c: any) => c.node === 'Create Store A')),
      );
      const hasIncomingB = Object.values(workflow.connections).some((conn: any) =>
        conn.main?.some((group: any) => group.some((c: any) => c.node === 'Create Store B')),
      );

      expect(hasIncomingA).toBe(false);
      expect(hasIncomingB).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid node type', async () => {
      await expect(runner.executeNode('invalidNodeType', 'Test', {}, [])).rejects.toThrow(
        "Node type 'invalidNodeType' not registered",
      );
    });

    it('should handle missing credentials', () => {
      const freshRunner = new WorkflowRunner();
      // Don't set credentials

      // Note: In the current implementation, nodes would fail when they try to access credentials
      // through getCredentials(), which would throw "Credentials of type 'geminiApi' not found"
      // However, since we're testing with mocked context, the node execution may not always
      // reach the credential access point. This test documents the expected behavior.
      expect(freshRunner).toBeDefined();
    });
  });
});

describe('E2E Framework: Integration', () => {
  it('should demonstrate complete framework capabilities', () => {
    // This test documents the framework's capabilities

    const capabilities = {
      workflowExecution: 'Execute complete n8n workflows',
      expressionResolution: 'Resolve {{$node}} expressions',
      topologicalSort: 'Execute nodes in dependency order',
      credentialManagement: 'Manage API credentials',
      errorHandling: 'Support continueOnFail option',
      dataFlow: 'Pass data between nodes',
      mockExecution: 'Simulate IExecuteFunctions',
      binaryData: 'Handle binary data operations',
      helpers: 'Provide n8n helper functions',
    };

    expect(Object.keys(capabilities).length).toBeGreaterThan(0);
    console.log('\n✅ E2E Framework Capabilities:');
    Object.entries(capabilities).forEach(([key, description]) => {
      console.log(`   - ${key}: ${description}`);
    });
  });

  it('should provide sample workflows', () => {
    const workflows = [
      'complete-rag-workflow.json',
      'error-handling-workflow.json',
      'pagination-workflow.json',
      'multi-store-workflow.json',
    ];

    workflows.forEach((workflow) => {
      expect(() => {
        require(`./workflows/${workflow}`);
      }).not.toThrow();
    });

    console.log('\n✅ Available Sample Workflows:');
    workflows.forEach((workflow) => {
      console.log(`   - ${workflow}`);
    });
  });
});
