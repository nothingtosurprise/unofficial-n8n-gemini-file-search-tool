/**
 * E2E Test Framework - Workflow Runner
 * Simulates n8n workflow execution for end-to-end testing
 */

import {
  IExecuteFunctions,
  INodeExecutionData,
  INode,
  INodeType,
  IWorkflowExecuteAdditionalData,
  INodeParameters,
  ICredentialDataDecryptedObject,
  NodeHelpers,
  NodeOperationError,
  IGetNodeParameterOptions,
} from 'n8n-workflow';
import { GeminiFileSearchStores } from '../../../nodes/GeminiFileSearchStores/GeminiFileSearchStores.node';
import { GeminiFileSearchDocuments } from '../../../nodes/GeminiFileSearchDocuments/GeminiFileSearchDocuments.node';

/**
 * Mock execution context for n8n nodes
 * Implements IExecuteFunctions interface for realistic testing
 */
class MockExecuteFunctions {
  private inputData: INodeExecutionData[];
  private parameters: Record<string, any>;
  private credentials: Record<string, ICredentialDataDecryptedObject>;
  private nodeData: INode;
  private itemIndex: number;
  private mode: 'manual' | 'trigger' | 'internal';
  private previousNodeOutputs: Map<string, INodeExecutionData[]>;

  constructor(
    node: INode,
    inputData: INodeExecutionData[],
    parameters: Record<string, any>,
    credentials: Record<string, ICredentialDataDecryptedObject>,
    previousNodeOutputs: Map<string, INodeExecutionData[]>,
    mode: 'manual' | 'trigger' | 'internal' = 'manual',
  ) {
    this.nodeData = node;
    this.inputData = inputData;
    this.parameters = parameters;
    this.credentials = credentials;
    this.itemIndex = 0;
    this.mode = mode;
    this.previousNodeOutputs = previousNodeOutputs;
  }

  /**
   * Get node parameter with expression resolution
   */
  getNodeParameter(
    parameterName: string,
    itemIndex: number,
    fallbackValue?: any,
    options?: IGetNodeParameterOptions,
  ): any {
    const value = this.parameters[parameterName];

    if (value === undefined) {
      return fallbackValue;
    }

    // Resolve n8n expressions like ={{$node['NodeName'].json.field}}
    if (typeof value === 'string' && value.includes('={{')) {
      return this.resolveExpression(value, itemIndex);
    }

    // Recursively resolve expressions in objects/arrays
    if (typeof value === 'object' && value !== null) {
      return this.resolveParameterObject(value, itemIndex);
    }

    return value;
  }

  /**
   * Resolve expressions in objects and arrays
   */
  private resolveParameterObject(obj: any, itemIndex: number): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.resolveParameterObject(item, itemIndex));
    }

    if (typeof obj === 'object' && obj !== null) {
      const resolved: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.includes('={{')) {
          resolved[key] = this.resolveExpression(value, itemIndex);
        } else if (typeof value === 'object') {
          resolved[key] = this.resolveParameterObject(value, itemIndex);
        } else {
          resolved[key] = value;
        }
      }
      return resolved;
    }

    return obj;
  }

  /**
   * Resolve n8n expressions
   * Supports: $node['NodeName'].json.field, $json.field, $input.item.json.field
   */
  private resolveExpression(expression: string, itemIndex: number): any {
    // Remove {{ }} wrapper
    const cleanExpr = expression
      .replace(/^\=?\{\{/, '')
      .replace(/\}\}$/, '')
      .trim();

    // Handle $node['NodeName'].json.field
    const nodeMatch = cleanExpr.match(/\$node\['([^']+)'\]\.json\.(\w+)/);
    if (nodeMatch) {
      const [, nodeName, field] = nodeMatch;
      const nodeData = this.previousNodeOutputs.get(nodeName);
      if (nodeData && nodeData.length > itemIndex) {
        return nodeData[itemIndex].json[field];
      }
      return undefined;
    }

    // Handle $json.field (current node's input)
    const jsonMatch = cleanExpr.match(/\$json\.(\w+)/);
    if (jsonMatch) {
      const field = jsonMatch[1];
      if (this.inputData.length > itemIndex) {
        return this.inputData[itemIndex].json[field];
      }
      return undefined;
    }

    // Handle $input.item.json.field
    const inputMatch = cleanExpr.match(/\$input\.item\.json\.(\w+)/);
    if (inputMatch) {
      const field = inputMatch[1];
      if (this.inputData.length > itemIndex) {
        return this.inputData[itemIndex].json[field];
      }
      return undefined;
    }

    // Return original if can't parse
    return expression;
  }

  /**
   * Get input data for the node
   */
  getInputData(inputIndex = 0, inputName = 'main'): INodeExecutionData[] {
    return this.inputData;
  }

  /**
   * Get the current node
   */
  getNode(): INode {
    return this.nodeData;
  }

  /**
   * Get credentials
   */
  async getCredentials<T extends object = ICredentialDataDecryptedObject>(
    type: string,
    itemIndex?: number,
  ): Promise<T> {
    if (!this.credentials[type]) {
      throw new Error(`Credentials of type '${type}' not found`);
    }
    return this.credentials[type] as T;
  }

  /**
   * Get execution mode
   */
  getMode(): 'manual' | 'trigger' | 'internal' {
    return this.mode;
  }

  /**
   * Get workflow static data
   */
  getWorkflowStaticData(type: string): any {
    return {};
  }

  /**
   * Continue on fail option
   */
  continueOnFail(): boolean {
    return this.parameters.continueOnFail === true;
  }

  /**
   * Helpers object with common utilities
   */
  get helpers(): IExecuteFunctions['helpers'] {
    return {
      // Request helper for API calls
      request: async (options: any) => {
        throw new Error('HTTP requests not supported in E2E tests. Use mocked API responses.');
      },

      httpRequest: async (options: any) => {
        throw new Error('HTTP requests not supported in E2E tests.');
      },

      httpRequestWithAuthentication: async (credentialsType: string, options: any) => {
        throw new Error('HTTP requests not supported in E2E tests.');
      },

      requestWithAuthenticationPaginated: async (
        credentialsType: string,
        options: any,
        itemIndex?: number,
        propertyName?: string,
      ) => {
        throw new Error('Paginated requests not supported in E2E tests.');
      },

      requestWithAuthentication: async (
        credentialsType: string,
        options: any,
        additionalCredentialOptions?: any,
      ) => {
        throw new Error('Authenticated requests not supported in E2E tests.');
      },

      requestOAuth2: async (credentialsType: string, options: any, oAuth2Options?: any) => {
        throw new Error('OAuth2 requests not supported in E2E tests.');
      },

      requestOAuth1: async (credentialsType: string, options: any) => {
        throw new Error('OAuth1 requests not supported in E2E tests.');
      },

      // Construct execution metadata
      constructExecutionMetaData: (
        inputData: INodeExecutionData[],
        options?: { itemData?: any },
      ): INodeExecutionData[] => {
        return inputData.map((item, index) => ({
          ...item,
          pairedItem:
            options?.itemData?.item !== undefined
              ? { item: options.itemData.item }
              : { item: index },
        }));
      },

      // Return JSON array helper
      returnJsonArray: (jsonData: any): INodeExecutionData[] => {
        const returnData: INodeExecutionData[] = [];
        if (Array.isArray(jsonData)) {
          for (const item of jsonData) {
            returnData.push({ json: item });
          }
        } else {
          returnData.push({ json: jsonData });
        }
        return returnData;
      },

      // Assert binary data exists
      assertBinaryData: (itemIndex: number, propertyName: string): void => {
        if (
          !this.inputData[itemIndex]?.binary ||
          !this.inputData[itemIndex].binary![propertyName]
        ) {
          throw new NodeOperationError(
            this.nodeData,
            `No binary data property "${propertyName}" exists on item ${itemIndex}!`,
          );
        }
      },

      // Get binary data buffer
      getBinaryDataBuffer: async (itemIndex: number, propertyName: string): Promise<Buffer> => {
        const binaryData = this.inputData[itemIndex]?.binary?.[propertyName];
        if (!binaryData) {
          throw new NodeOperationError(
            this.nodeData,
            `No binary data property "${propertyName}" exists on item ${itemIndex}!`,
          );
        }

        // Return mock buffer for testing
        if (binaryData.data) {
          return Buffer.from(binaryData.data, 'base64');
        }

        return Buffer.from('mock binary data');
      },
    } as any as IExecuteFunctions['helpers'];
  }

  // Additional required IExecuteFunctions properties
  getExecutionId(): string {
    return 'test-execution-id';
  }

  getWorkflowId(): string {
    return 'test-workflow-id';
  }

  getRestApiUrl(): string {
    return 'http://localhost:5678';
  }

  getInstanceBaseUrl(): string {
    return 'http://localhost:5678';
  }

  getTimezone(): string {
    return 'America/New_York';
  }

  // Additional FunctionsBase methods
  logger: any = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  };

  getCredentialsProperties(type: string): any {
    return {};
  }

  getWorkflow(): any {
    return {
      id: 'test-workflow',
      name: 'Test Workflow',
      active: false,
      nodes: [],
      connections: {},
    };
  }

  getInstanceId(): string {
    return 'test-instance-id';
  }

  evaluateExpression(expression: string, itemIndex: number): any {
    return expression;
  }

  getContext(type: string): any {
    return {};
  }

  getExecuteData(): any {
    return {
      node: this.nodeData,
      data: { main: [this.inputData] },
      source: null,
    };
  }

  getNodeInputs(): any[] {
    return ['main'];
  }

  getNodeOutputs(): any[] {
    return ['main'];
  }

  getParentCallbackManager(): any {
    return undefined;
  }

  getChildNodes(nodeName: string): any[] {
    return [];
  }

  getKnownNodeTypes(): any {
    return {};
  }

  addInputData(connectionType: string, data: INodeExecutionData[][]): void {
    // No-op
  }

  addOutputData(
    connectionType: string,
    currentNodeRunIndex: number,
    data: INodeExecutionData[][],
  ): void {
    // No-op
  }

  getInputSourceData(): any {
    return { main: [this.inputData] };
  }
}

/**
 * Workflow execution result
 */
export interface IWorkflowExecutionResult {
  success: boolean;
  nodeResults: Map<string, INodeExecutionData[]>;
  error?: Error;
  executionTime: number;
}

/**
 * Simulates n8n workflow execution for E2E testing
 */
export class WorkflowRunner {
  private nodes: Map<string, INodeType> = new Map();
  private credentials: Record<string, ICredentialDataDecryptedObject> = {};
  private mode: 'manual' | 'trigger' | 'internal' = 'manual';

  constructor() {
    // Register available node types
    this.nodes.set('geminiFileSearchStores', new GeminiFileSearchStores());
    this.nodes.set('geminiFileSearchDocuments', new GeminiFileSearchDocuments());
  }

  /**
   * Set credentials for workflow execution
   */
  setCredentials(credentialType: string, credentials: ICredentialDataDecryptedObject): void {
    this.credentials[credentialType] = credentials;
  }

  /**
   * Set execution mode
   */
  setMode(mode: 'manual' | 'trigger' | 'internal'): void {
    this.mode = mode;
  }

  /**
   * Execute a single node
   */
  async executeNode(
    nodeType: string,
    nodeName: string,
    parameters: Record<string, any>,
    inputData: INodeExecutionData[] = [],
    previousNodeOutputs: Map<string, INodeExecutionData[]> = new Map(),
  ): Promise<INodeExecutionData[]> {
    const nodeImpl = this.nodes.get(nodeType);
    if (!nodeImpl) {
      throw new Error(`Node type '${nodeType}' not registered`);
    }

    const nodeData: INode = {
      id: `node-${nodeName}`,
      name: nodeName,
      type: nodeType,
      typeVersion: 1,
      position: [0, 0],
      parameters: parameters as INodeParameters,
    };

    const mockContext = new MockExecuteFunctions(
      nodeData,
      inputData,
      parameters,
      this.credentials,
      previousNodeOutputs,
      this.mode,
    );

    // Execute node
    if (!nodeImpl.execute) {
      throw new Error(`Node type '${nodeType}' has no execute method`);
    }

    const result = await nodeImpl.execute.call(mockContext as any);
    if (!result || !Array.isArray(result)) {
      return [];
    }
    return result[0] || [];
  }

  /**
   * Execute a complete workflow from JSON definition
   */
  async executeWorkflow(workflowJson: any): Promise<IWorkflowExecutionResult> {
    const startTime = Date.now();
    const results = new Map<string, INodeExecutionData[]>();

    try {
      // Sort nodes in execution order (topological sort)
      const sortedNodes = this.topologicalSort(workflowJson.nodes, workflowJson.connections);

      console.log(`\n🚀 Executing workflow: ${workflowJson.name}`);
      console.log(`📋 Nodes to execute: ${sortedNodes.map((n) => n.name).join(' → ')}\n`);

      for (const node of sortedNodes) {
        console.log(`▶️  Executing node: ${node.name} (${node.type})`);

        // Get input data from connected nodes
        const inputData = this.getNodeInputData(node, results, workflowJson.connections);

        // Execute node with resolved expressions
        try {
          const output = await this.executeNode(
            node.type,
            node.name,
            node.parameters,
            inputData,
            results,
          );

          results.set(node.name, output);
          console.log(`   ✅ Completed: ${output.length} items returned`);
        } catch (error: any) {
          console.error(`   ❌ Failed: ${error.message}`);
          throw error;
        }
      }

      const executionTime = Date.now() - startTime;
      console.log(`\n✨ Workflow completed successfully in ${executionTime}ms\n`);

      return {
        success: true,
        nodeResults: results,
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      console.error(`\n💥 Workflow failed after ${executionTime}ms\n`);

      return {
        success: false,
        nodeResults: results,
        error,
        executionTime,
      };
    }
  }

  /**
   * Get input data for a node from connected nodes
   */
  private getNodeInputData(
    node: any,
    results: Map<string, INodeExecutionData[]>,
    connections: any,
  ): INodeExecutionData[] {
    const inputData: INodeExecutionData[] = [];

    // Find nodes that connect to this node
    for (const [sourceName, outputs] of Object.entries(connections)) {
      const outputConnections = outputs as any;
      if (outputConnections.main) {
        for (const connectionGroup of outputConnections.main) {
          for (const connection of connectionGroup) {
            if (connection.node === node.name) {
              const sourceData = results.get(sourceName);
              if (sourceData) {
                inputData.push(...sourceData);
              }
            }
          }
        }
      }
    }

    return inputData;
  }

  /**
   * Topological sort for workflow execution order
   * Ensures nodes execute in correct dependency order
   */
  private topologicalSort(nodes: any[], connections: any): any[] {
    const sorted: any[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (node: any) => {
      if (temp.has(node.name)) {
        throw new Error(`Circular dependency detected at node: ${node.name}`);
      }
      if (visited.has(node.name)) {
        return;
      }

      temp.add(node.name);

      // Visit dependencies (nodes that this node depends on)
      const deps = this.getNodeDependencies(node.name, connections);
      for (const depName of deps) {
        const depNode = nodes.find((n) => n.name === depName);
        if (depNode) {
          visit(depNode);
        }
      }

      temp.delete(node.name);
      visited.add(node.name);
      sorted.push(node);
    };

    // Find nodes with no dependencies (start nodes)
    const startNodes = nodes.filter((node) => {
      const deps = this.getNodeDependencies(node.name, connections);
      return deps.length === 0;
    });

    // If no start nodes found, take first node
    if (startNodes.length === 0 && nodes.length > 0) {
      startNodes.push(nodes[0]);
    }

    // Visit all nodes starting from start nodes
    for (const node of startNodes) {
      visit(node);
    }

    // Visit any remaining unvisited nodes
    for (const node of nodes) {
      if (!visited.has(node.name)) {
        visit(node);
      }
    }

    return sorted;
  }

  /**
   * Get dependencies for a node
   */
  private getNodeDependencies(nodeName: string, connections: any): string[] {
    const deps: string[] = [];

    for (const [sourceName, outputs] of Object.entries(connections)) {
      const outputConnections = outputs as any;
      if (outputConnections.main) {
        for (const connectionGroup of outputConnections.main) {
          for (const connection of connectionGroup) {
            if (connection.node === nodeName) {
              deps.push(sourceName);
            }
          }
        }
      }
    }

    return deps;
  }
}
