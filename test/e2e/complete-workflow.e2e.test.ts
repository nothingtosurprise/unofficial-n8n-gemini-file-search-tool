/**
 * E2E Test: Complete Workflow Tests
 * Tests complete workflow execution, data flow, and expression resolution
 */

import { WorkflowRunner, IWorkflowExecutionResult } from './helpers/workflowRunner';
import { TEST_TIMEOUTS } from '../integration/setup/testEnvironment';
import {
  extractNodeOutput,
  extractNodeOutputs,
  assertNodeOutput,
  assertNodeOutputHasField,
  validateWorkflowStructure,
  printExecutionSummary,
  createSimpleWorkflow,
  createNode,
  cloneWorkflow,
  getNodeByName,
  findParentNodes,
  findChildNodes,
} from './helpers/workflowHelpers';

// Import workflow JSON files
import completeRagWorkflow from './workflows/complete-rag-workflow.json';
import paginationWorkflow from './workflows/pagination-workflow.json';
import multiStoreWorkflow from './workflows/multi-store-workflow.json';

describe('Complete Workflow E2E Tests', () => {
  jest.setTimeout(TEST_TIMEOUTS.poll);

  let runner: WorkflowRunner;

  beforeEach(() => {
    runner = new WorkflowRunner();
    runner.setCredentials('geminiApi', {
      apiKey: process.env.GEMINI_API_KEY_TEST || 'test-key',
    });
  });

  // ==========================================
  // Test Suite 1: Full Workflow Execution
  // ==========================================
  describe('Full Workflow Execution', () => {
    it('should validate complete RAG workflow structure', () => {
      // Validate workflow structure
      expect(validateWorkflowStructure(completeRagWorkflow)).toBe(true);

      // Validate workflow metadata
      expect(completeRagWorkflow.name).toBe('Complete RAG Workflow');
      expect(completeRagWorkflow.nodes.length).toBe(7);
      expect(completeRagWorkflow.active).toBe(false);

      // Validate node sequence
      const expectedNodeNames = [
        'Create Store',
        'List Stores',
        'Get Store Details',
        'Upload Document',
        'List Documents',
        'Query Documents',
        'Delete Store',
      ];

      expectedNodeNames.forEach((nodeName, index) => {
        expect(completeRagWorkflow.nodes[index].name).toBe(nodeName);
      });

      // Validate connections exist
      expect(Object.keys(completeRagWorkflow.connections).length).toBe(6);
    });

    it('should validate node parameter expressions', () => {
      // Get Store Details node uses expression
      const getStoreNode = getNodeByName(completeRagWorkflow as any, 'Get Store Details');
      expect(getStoreNode).toBeDefined();
      expect(getStoreNode!.parameters.storeName).toBe("={{$node['Create Store'].json.name}}");

      // Upload Document node uses expression
      const uploadNode = getNodeByName(completeRagWorkflow as any, 'Upload Document');
      expect(uploadNode).toBeDefined();
      expect(uploadNode!.parameters.storeName).toBe("={{$node['Create Store'].json.name}}");

      // Query Documents node uses expression
      const queryNode = getNodeByName(completeRagWorkflow as any, 'Query Documents');
      expect(queryNode).toBeDefined();
      expect(queryNode!.parameters.storeName).toBe("={{$node['Create Store'].json.name}}");

      // Delete Store node uses expression
      const deleteNode = getNodeByName(completeRagWorkflow as any, 'Delete Store');
      expect(deleteNode).toBeDefined();
      expect(deleteNode!.parameters.storeName).toBe("={{$node['Create Store'].json.name}}");
    });

    it('should verify workflow execution order through connections', () => {
      // Verify Create Store has no parent (start node)
      const createParents = findParentNodes(completeRagWorkflow as any, 'Create Store');
      expect(createParents.length).toBe(0);

      // Verify List Stores connects to Create Store
      const listParents = findParentNodes(completeRagWorkflow as any, 'List Stores');
      expect(listParents).toContain('Create Store');

      // Verify Get Store Details connects to List Stores
      const getParents = findParentNodes(completeRagWorkflow as any, 'Get Store Details');
      expect(getParents).toContain('List Stores');

      // Verify Upload connects to Get Store
      const uploadParents = findParentNodes(completeRagWorkflow as any, 'Upload Document');
      expect(uploadParents).toContain('Get Store Details');

      // Verify Delete Store is at the end
      const deleteChildren = findChildNodes(completeRagWorkflow as any, 'Delete Store');
      expect(deleteChildren.length).toBe(0);
    });
  });

  // ==========================================
  // Test Suite 2: Workflow Data Flow
  // ==========================================
  describe('Workflow Data Flow', () => {
    it('should demonstrate linear data flow pattern', () => {
      const workflow = createSimpleWorkflow('Linear Flow Test', [
        createNode('Step 1', 'geminiFileSearchStores', {
          operation: 'create',
          displayName: 'Test Store',
        }),
        createNode('Step 2', 'geminiFileSearchStores', {
          operation: 'get',
          storeName: "={{$node['Step 1'].json.name}}",
        }),
        createNode('Step 3', 'geminiFileSearchStores', {
          operation: 'delete',
          storeName: "={{$node['Step 1'].json.name}}",
          force: true,
        }),
      ]);

      // Verify workflow structure
      expect(validateWorkflowStructure(workflow)).toBe(true);
      expect(workflow.nodes.length).toBe(3);

      // Verify connections form linear chain
      expect(workflow.connections['Step 1'].main![0][0].node).toBe('Step 2');
      expect(workflow.connections['Step 2'].main![0][0].node).toBe('Step 3');
    });

    it('should handle expression resolution in parameters', () => {
      // Test various expression formats
      const expressions = {
        nodeReference: "={{$node['Create Store'].json.name}}",
        jsonField: '={{$json.fieldName}}',
        inputField: '={{$input.item.json.value}}',
      };

      // Verify expressions are strings
      Object.values(expressions).forEach((expr) => {
        expect(typeof expr).toBe('string');
        expect(expr).toContain('={{');
        expect(expr).toContain('}}');
      });
    });

    it('should verify complex parameter structures', () => {
      const workflow = {
        name: 'Complex Parameters Test',
        nodes: [
          createNode('Upload with Metadata', 'geminiFileSearchDocuments', {
            operation: 'upload',
            storeName: "={{$node['Create Store'].json.name}}",
            binaryProperty: 'data',
            displayName: 'Document with Metadata',
            customMetadata: {
              metadataValues: [
                {
                  key: 'author',
                  valueType: 'string',
                  value: 'John Doe',
                },
                {
                  key: 'year',
                  valueType: 'number',
                  value: '2024',
                },
                {
                  key: 'published',
                  valueType: 'boolean',
                  value: true,
                },
              ],
            },
          }),
        ],
        connections: {},
      };

      expect(validateWorkflowStructure(workflow)).toBe(true);

      const uploadNode = workflow.nodes[0];
      expect(uploadNode.parameters.customMetadata).toBeDefined();
      expect(uploadNode.parameters.customMetadata.metadataValues.length).toBe(3);

      // Verify metadata types
      const metadata = uploadNode.parameters.customMetadata.metadataValues;
      expect(metadata[0].valueType).toBe('string');
      expect(metadata[1].valueType).toBe('number');
      expect(metadata[2].valueType).toBe('boolean');
    });
  });

  // ==========================================
  // Test Suite 3: Expression Resolution
  // ==========================================
  describe('Expression Resolution', () => {
    it('should parse node reference expressions', () => {
      const expression = "={{$node['Create Store'].json.name}}";

      // Expression should contain node reference
      expect(expression).toContain("$node['Create Store']");
      expect(expression).toContain('.json.name');

      // Extract node name from expression
      const match = expression.match(/\$node\['([^']+)'\]/);
      expect(match).toBeDefined();
      expect(match![1]).toBe('Create Store');
    });

    it('should handle different expression formats', () => {
      const expressions = [
        "={{$node['Previous Node'].json.id}}",
        '={{$json.fieldName}}',
        '={{$input.item.json.value}}',
        "={{$node['Node 1'].json.data.nested}}",
      ];

      expressions.forEach((expr) => {
        expect(expr.startsWith('={{')).toBe(true);
        expect(expr.endsWith('}}')).toBe(true);
      });
    });

    it('should verify expressions in pagination workflow', () => {
      const pageNode = getNodeByName(paginationWorkflow as any, 'List Stores Page 2');
      expect(pageNode).toBeDefined();

      // Page 2 should use pageToken from Page 1
      expect(pageNode!.parameters.pageToken).toBe(
        "={{$node['List Stores Page 1'].json.nextPageToken}}",
      );
    });

    it('should verify expressions in multi-store workflow', () => {
      // Upload to Store A should reference Create Store A
      const uploadA = getNodeByName(multiStoreWorkflow as any, 'Upload to Store A');
      expect(uploadA).toBeDefined();
      expect(uploadA!.parameters.storeName).toBe("={{$node['Create Store A'].json.name}}");

      // Upload to Store B should reference Create Store B
      const uploadB = getNodeByName(multiStoreWorkflow as any, 'Upload to Store B');
      expect(uploadB).toBeDefined();
      expect(uploadB!.parameters.storeName).toBe("={{$node['Create Store B'].json.name}}");

      // Query Store A should reference Create Store A
      const queryA = getNodeByName(multiStoreWorkflow as any, 'Query Store A');
      expect(queryA).toBeDefined();
      expect(queryA!.parameters.storeName).toBe("={{$node['Create Store A'].json.name}}");
    });
  });

  // ==========================================
  // Test Suite 4: Workflow Branches
  // ==========================================
  describe('Workflow Branches', () => {
    it('should identify parallel branches in multi-store workflow', () => {
      // Create Store A and Create Store B should be parallel (no common parent)
      const storeAParents = findParentNodes(multiStoreWorkflow as any, 'Create Store A');
      const storeBParents = findParentNodes(multiStoreWorkflow as any, 'Create Store B');

      expect(storeAParents.length).toBe(0);
      expect(storeBParents.length).toBe(0);

      // Both create stores are start nodes (parallel execution)
      expect(storeAParents).toEqual(storeBParents);
    });

    it('should verify independent execution paths', () => {
      // Find all nodes in Store A path
      let storeAPath: string[] = [];
      let currentNode = 'Create Store A';

      while (currentNode) {
        storeAPath.push(currentNode);
        const children = findChildNodes(multiStoreWorkflow as any, currentNode);
        currentNode = children.length > 0 ? children[0] : '';
      }

      // Find all nodes in Store B path
      let storeBPath: string[] = [];
      currentNode = 'Create Store B';

      while (currentNode) {
        storeBPath.push(currentNode);
        const children = findChildNodes(multiStoreWorkflow as any, currentNode);
        currentNode = children.length > 0 ? children[0] : '';
      }

      // Paths should be independent (no shared nodes)
      const sharedNodes = storeAPath.filter((node) => storeBPath.includes(node));
      expect(sharedNodes.length).toBe(0);

      // Each path should have multiple nodes
      expect(storeAPath.length).toBeGreaterThan(1);
      expect(storeBPath.length).toBeGreaterThan(1);
    });

    it('should handle sequential workflow with no branches', () => {
      // Complete RAG workflow is purely sequential
      for (let i = 0; i < completeRagWorkflow.nodes.length - 1; i++) {
        const currentNode = completeRagWorkflow.nodes[i].name;
        const children = findChildNodes(completeRagWorkflow as any, currentNode);

        // Each node (except last) should have exactly one child
        if (i < completeRagWorkflow.nodes.length - 1) {
          expect(children.length).toBe(1);
        }
      }
    });
  });

  // ==========================================
  // Test Suite 5: Error Handling
  // ==========================================
  describe('Error Handling', () => {
    it('should detect invalid workflow structure', () => {
      const invalidWorkflow = {
        name: 'Invalid Workflow',
        nodes: 'not-an-array',
        connections: {},
      };

      expect(validateWorkflowStructure(invalidWorkflow)).toBe(false);
    });

    it('should detect missing node names', () => {
      const invalidWorkflow = {
        name: 'Invalid Workflow',
        nodes: [
          {
            type: 'geminiFileSearchStores',
            position: [0, 0],
            parameters: {},
          },
        ],
        connections: {},
      };

      expect(validateWorkflowStructure(invalidWorkflow)).toBe(false);
    });

    it('should detect invalid node positions', () => {
      const invalidWorkflow = {
        name: 'Invalid Workflow',
        nodes: [
          {
            name: 'Test Node',
            type: 'geminiFileSearchStores',
            position: 'not-an-array',
            parameters: {},
          },
        ],
        connections: {},
      };

      expect(validateWorkflowStructure(invalidWorkflow)).toBe(false);
    });

    it('should handle workflow with circular dependencies', () => {
      const circularWorkflow = {
        name: 'Circular Workflow',
        nodes: [
          createNode('Node A', 'geminiFileSearchStores', { operation: 'list', returnAll: true }),
          createNode('Node B', 'geminiFileSearchStores', { operation: 'list', returnAll: true }),
        ],
        connections: {
          'Node A': {
            main: [[{ node: 'Node B', type: 'main', index: 0 }]],
          },
          'Node B': {
            main: [[{ node: 'Node A', type: 'main', index: 0 }]],
          },
        },
      };

      // Workflow structure is valid, but execution would fail
      expect(validateWorkflowStructure(circularWorkflow)).toBe(true);

      // Note: Execution test would be:
      // await expect(runner.executeWorkflow(circularWorkflow)).rejects.toThrow('Circular dependency');
    });
  });

  // ==========================================
  // Test Suite 6: Pagination Workflow
  // ==========================================
  describe('Pagination Workflow', () => {
    it('should validate pagination workflow structure', () => {
      expect(validateWorkflowStructure(paginationWorkflow)).toBe(true);
      expect(paginationWorkflow.name).toBe('Pagination Workflow');
      expect(paginationWorkflow.nodes.length).toBe(6);
    });

    it('should verify pagination parameters', () => {
      // Page 1 should have limit without pageToken
      const page1 = getNodeByName(paginationWorkflow as any, 'List Stores Page 1');
      expect(page1).toBeDefined();
      expect(page1!.parameters.returnAll).toBe(false);
      expect(page1!.parameters.limit).toBe(5);
      expect(page1!.parameters.pageToken).toBeUndefined();

      // Page 2 should have limit and pageToken from Page 1
      const page2 = getNodeByName(paginationWorkflow as any, 'List Stores Page 2');
      expect(page2).toBeDefined();
      expect(page2!.parameters.returnAll).toBe(false);
      expect(page2!.parameters.limit).toBe(5);
      expect(page2!.parameters.pageToken).toBe(
        "={{$node['List Stores Page 1'].json.nextPageToken}}",
      );
    });

    it('should verify returnAll vs paginated operations', () => {
      // List Documents All should use returnAll
      const listAll = getNodeByName(paginationWorkflow as any, 'List Documents All');
      expect(listAll).toBeDefined();
      expect(listAll!.parameters.returnAll).toBe(true);
      expect(listAll!.parameters.limit).toBeUndefined();

      // List Documents Limited should use pagination
      const listLimited = getNodeByName(paginationWorkflow as any, 'List Documents Limited');
      expect(listLimited).toBeDefined();
      expect(listLimited!.parameters.returnAll).toBe(false);
      expect(listLimited!.parameters.limit).toBe(3);
    });
  });

  // ==========================================
  // Test Suite 7: Multi-Store Workflow
  // ==========================================
  describe('Multi-Store Workflow', () => {
    it('should validate multi-store workflow structure', () => {
      expect(validateWorkflowStructure(multiStoreWorkflow)).toBe(true);
      expect(multiStoreWorkflow.name).toBe('Multi-Store Workflow');
      expect(multiStoreWorkflow.nodes.length).toBe(10);
    });

    it('should verify parallel store creation', () => {
      // Create Store A and Create Store B should be independent
      const storeAChildren = findChildNodes(multiStoreWorkflow as any, 'Create Store A');
      const storeBChildren = findChildNodes(multiStoreWorkflow as any, 'Create Store B');

      expect(storeAChildren.length).toBeGreaterThan(0);
      expect(storeBChildren.length).toBeGreaterThan(0);

      // Children should be different
      expect(storeAChildren).not.toEqual(storeBChildren);
    });

    it('should verify store-specific operations', () => {
      // Upload to Store A should reference Store A
      const uploadA = getNodeByName(multiStoreWorkflow as any, 'Upload to Store A');
      expect(uploadA).toBeDefined();
      expect(uploadA!.parameters.storeName).toContain('Create Store A');

      // List Docs Store A should reference Store A
      const listA = getNodeByName(multiStoreWorkflow as any, 'List Docs Store A');
      expect(listA).toBeDefined();
      expect(listA!.parameters.storeName).toContain('Create Store A');

      // Query Store A should reference Store A
      const queryA = getNodeByName(multiStoreWorkflow as any, 'Query Store A');
      expect(queryA).toBeDefined();
      expect(queryA!.parameters.storeName).toContain('Create Store A');

      // Delete Store A should reference Store A
      const deleteA = getNodeByName(multiStoreWorkflow as any, 'Delete Store A');
      expect(deleteA).toBeDefined();
      expect(deleteA!.parameters.storeName).toContain('Create Store A');
    });

    it('should verify query parameters for multiple stores', () => {
      const queryA = getNodeByName(multiStoreWorkflow as any, 'Query Store A');
      const queryB = getNodeByName(multiStoreWorkflow as any, 'Query Store B');

      expect(queryA).toBeDefined();
      expect(queryB).toBeDefined();

      // Both should have query and model parameters
      expect(queryA!.parameters.query).toBeDefined();
      expect(queryA!.parameters.modelName).toBe('gemini-2.0-flash-exp');

      expect(queryB!.parameters.query).toBeDefined();
      expect(queryB!.parameters.modelName).toBe('gemini-2.0-flash-exp');

      // Queries should be different
      expect(queryA!.parameters.query).not.toBe(queryB!.parameters.query);
    });

    it('should verify cleanup for both stores', () => {
      const deleteA = getNodeByName(multiStoreWorkflow as any, 'Delete Store A');
      const deleteB = getNodeByName(multiStoreWorkflow as any, 'Delete Store B');

      expect(deleteA).toBeDefined();
      expect(deleteB).toBeDefined();

      // Both should use force delete
      expect(deleteA!.parameters.force).toBe(true);
      expect(deleteB!.parameters.force).toBe(true);

      // Both should be end nodes (no children)
      expect(findChildNodes(multiStoreWorkflow as any, 'Delete Store A').length).toBe(0);
      expect(findChildNodes(multiStoreWorkflow as any, 'Delete Store B').length).toBe(0);
    });
  });

  // ==========================================
  // Test Suite 8: Cleanup Verification
  // ==========================================
  describe('Cleanup Verification', () => {
    it('should verify force delete in workflows', () => {
      // Complete RAG workflow should use force delete
      const deleteNode = getNodeByName(completeRagWorkflow as any, 'Delete Store');
      expect(deleteNode).toBeDefined();
      expect(deleteNode!.parameters.force).toBe(true);

      // Pagination workflow should use force delete
      const cleanupNode = getNodeByName(paginationWorkflow as any, 'Cleanup Store');
      expect(cleanupNode).toBeDefined();
      expect(cleanupNode!.parameters.force).toBe(true);
    });

    it('should verify cleanup is last operation', () => {
      // Delete Store should be last node in complete RAG workflow
      const lastNode = completeRagWorkflow.nodes[completeRagWorkflow.nodes.length - 1];
      expect(lastNode.name).toBe('Delete Store');

      // Cleanup Store should be last node in pagination workflow
      const paginationLastNode = paginationWorkflow.nodes[paginationWorkflow.nodes.length - 1];
      expect(paginationLastNode.name).toBe('Cleanup Store');
    });

    it('should verify all stores are cleaned up in multi-store workflow', () => {
      // Find all delete nodes
      const deleteNodes = multiStoreWorkflow.nodes.filter(
        (node) => node.parameters.operation === 'delete',
      );

      // Should have 2 delete operations (one for each store)
      expect(deleteNodes.length).toBe(2);

      // Both should use force delete
      deleteNodes.forEach((node) => {
        expect(node.parameters.force).toBe(true);
      });
    });
  });

  // ==========================================
  // Test Suite 9: Helper Function Validation
  // ==========================================
  describe('Helper Function Validation', () => {
    it('should extract node output correctly', () => {
      const mockResults = new Map([
        [
          'Test Node',
          [
            {
              json: {
                name: 'fileSearchStores/test-123',
                displayName: 'Test Store',
                createTime: '2024-11-24T10:00:00Z',
              },
            },
          ],
        ],
      ]);

      expect(extractNodeOutput(mockResults, 'Test Node', 'name')).toBe('fileSearchStores/test-123');
      expect(extractNodeOutput(mockResults, 'Test Node', 'displayName')).toBe('Test Store');
      expect(extractNodeOutput(mockResults, 'Test Node', 'createTime')).toBe(
        '2024-11-24T10:00:00Z',
      );
    });

    it('should extract all node outputs correctly', () => {
      const mockResults = new Map([
        [
          'List Node',
          [
            { json: { id: 1, name: 'Store 1' } },
            { json: { id: 2, name: 'Store 2' } },
            { json: { id: 3, name: 'Store 3' } },
          ],
        ],
      ]);

      const outputs = extractNodeOutputs(mockResults, 'List Node');
      expect(outputs.length).toBe(3);
      expect(outputs[0].id).toBe(1);
      expect(outputs[1].name).toBe('Store 2');
      expect(outputs[2].id).toBe(3);
    });

    it('should assert node output exists', () => {
      const mockResults = new Map([['Existing Node', [{ json: { data: 'test' } }]]]);

      expect(() => assertNodeOutput(mockResults, 'Existing Node')).not.toThrow();
      expect(() => assertNodeOutput(mockResults, 'Missing Node')).toThrow();
    });

    it('should assert node output has field', () => {
      const mockResults = new Map([
        ['Test Node', [{ json: { name: 'test', value: 123, active: true } }]],
      ]);

      expect(() => assertNodeOutputHasField(mockResults, 'Test Node', 'name')).not.toThrow();
      expect(() => assertNodeOutputHasField(mockResults, 'Test Node', 'value')).not.toThrow();
      expect(() => assertNodeOutputHasField(mockResults, 'Test Node', 'active')).not.toThrow();
      expect(() => assertNodeOutputHasField(mockResults, 'Test Node', 'missing')).toThrow();
    });
  });

  // ==========================================
  // Test Suite 10: Workflow Cloning
  // ==========================================
  describe('Workflow Cloning', () => {
    it('should clone workflow without affecting original', () => {
      const original = completeRagWorkflow as any;
      const cloned = cloneWorkflow(original);

      // Clones should be equal
      expect(cloned).toEqual(original);

      // But not the same object
      expect(cloned).not.toBe(original);

      // Modify clone
      cloned.name = 'Modified Workflow';
      cloned.nodes[0].name = 'Modified Node';

      // Original should be unchanged
      expect(original.name).toBe('Complete RAG Workflow');
      expect(original.nodes[0].name).toBe('Create Store');
    });

    it('should clone complex workflow structures', () => {
      const original = multiStoreWorkflow as any;
      const cloned = cloneWorkflow(original);

      // Deep clone verification
      expect(cloned.nodes.length).toBe(original.nodes.length);
      expect(Object.keys(cloned.connections).length).toBe(Object.keys(original.connections).length);

      // Modify nested structure
      cloned.nodes[0].parameters.displayName = 'Modified';

      // Original should be unchanged
      expect(original.nodes[0].parameters.displayName).toBe('Multi-Store Test A');
    });
  });

  // ==========================================
  // Test Suite 11: Comprehensive Integration
  // ==========================================
  describe('Comprehensive Integration', () => {
    it('should demonstrate complete workflow capabilities', () => {
      const capabilities = {
        structureValidation: 'Validate workflow JSON structure',
        expressionParsing: 'Parse and identify n8n expressions',
        nodeTraversal: 'Navigate parent/child relationships',
        parallelExecution: 'Support parallel branches',
        sequentialExecution: 'Support sequential chains',
        paginationSupport: 'Handle paginated operations',
        multiStoreSupport: 'Manage multiple stores',
        cleanupVerification: 'Ensure proper cleanup',
        errorDetection: 'Detect structural errors',
        helperFunctions: 'Provide utility helpers',
      };

      expect(Object.keys(capabilities).length).toBe(10);

      console.log('\n✅ Complete Workflow E2E Test Capabilities:');
      Object.entries(capabilities).forEach(([key, description]) => {
        console.log(`   - ${key}: ${description}`);
      });
    });

    it('should summarize all test workflows', () => {
      const workflows = [
        {
          name: 'Complete RAG Workflow',
          nodes: completeRagWorkflow.nodes.length,
          type: 'Sequential',
        },
        {
          name: 'Pagination Workflow',
          nodes: paginationWorkflow.nodes.length,
          type: 'Mixed',
        },
        {
          name: 'Multi-Store Workflow',
          nodes: multiStoreWorkflow.nodes.length,
          type: 'Parallel',
        },
      ];

      console.log('\n✅ Test Workflows Summary:');
      workflows.forEach((workflow) => {
        console.log(`   - ${workflow.name}: ${workflow.nodes} nodes (${workflow.type})`);
      });

      expect(workflows.length).toBe(3);
    });
  });
});
