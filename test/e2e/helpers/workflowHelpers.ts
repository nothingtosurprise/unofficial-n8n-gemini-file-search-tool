/**
 * E2E Test Framework - Workflow Helpers
 * Utility functions for workflow manipulation and validation
 */

import { INodeExecutionData } from 'n8n-workflow';

/**
 * Workflow definition interface
 */
export interface IWorkflowDefinition {
  name: string;
  nodes: IWorkflowNode[];
  connections: Record<string, IWorkflowConnections>;
  active?: boolean;
  settings?: Record<string, any>;
}

/**
 * Workflow node definition
 */
export interface IWorkflowNode {
  id?: string;
  name: string;
  type: string;
  typeVersion?: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, string>;
}

/**
 * Workflow connections
 */
export interface IWorkflowConnections {
  main?: IWorkflowConnection[][];
}

/**
 * Single connection
 */
export interface IWorkflowConnection {
  node: string;
  type: string;
  index: number;
}

/**
 * Create a simple workflow from nodes
 * Automatically creates linear connections between nodes
 */
export function createSimpleWorkflow(name: string, nodes: IWorkflowNode[]): IWorkflowDefinition {
  const connections: Record<string, IWorkflowConnections> = {};

  // Create linear connections: node[0] -> node[1] -> node[2] -> ...
  for (let i = 0; i < nodes.length - 1; i++) {
    const currentNode = nodes[i];
    const nextNode = nodes[i + 1];

    connections[currentNode.name] = {
      main: [[{ node: nextNode.name, type: 'main', index: 0 }]],
    };
  }

  return {
    name,
    nodes,
    connections,
    active: false,
    settings: {},
  };
}

/**
 * Create a workflow with custom connections
 */
export function createCustomWorkflow(
  name: string,
  nodes: IWorkflowNode[],
  connections: Record<string, IWorkflowConnections>,
): IWorkflowDefinition {
  return {
    name,
    nodes,
    connections,
    active: false,
    settings: {},
  };
}

/**
 * Validate workflow structure
 */
export function validateWorkflowStructure(workflow: any): boolean {
  if (!workflow.name || typeof workflow.name !== 'string') {
    return false;
  }

  if (!Array.isArray(workflow.nodes)) {
    return false;
  }

  if (typeof workflow.connections !== 'object' || workflow.connections === null) {
    return false;
  }

  // Validate each node
  for (const node of workflow.nodes) {
    if (!node.name || !node.type || !Array.isArray(node.position)) {
      return false;
    }
  }

  return true;
}

/**
 * Extract output from a specific node
 */
export function extractNodeOutput(
  results: Map<string, INodeExecutionData[]>,
  nodeName: string,
  field: string,
): any {
  const data = results.get(nodeName);
  if (!data || data.length === 0) {
    return undefined;
  }
  return data[0].json[field];
}

/**
 * Extract all outputs from a node
 */
export function extractNodeOutputs(
  results: Map<string, INodeExecutionData[]>,
  nodeName: string,
): any[] {
  const data = results.get(nodeName);
  if (!data || data.length === 0) {
    return [];
  }
  return data.map((item) => item.json);
}

/**
 * Get node by name from workflow
 */
export function getNodeByName(
  workflow: IWorkflowDefinition,
  nodeName: string,
): IWorkflowNode | undefined {
  return workflow.nodes.find((node) => node.name === nodeName);
}

/**
 * Get node connections
 */
export function getNodeConnections(
  workflow: IWorkflowDefinition,
  nodeName: string,
): IWorkflowConnection[] {
  const connections = workflow.connections[nodeName];
  if (!connections || !connections.main || connections.main.length === 0) {
    return [];
  }
  return connections.main[0] || [];
}

/**
 * Find nodes that connect to a specific node (parents)
 */
export function findParentNodes(workflow: IWorkflowDefinition, nodeName: string): string[] {
  const parents: string[] = [];

  for (const [sourceNode, connections] of Object.entries(workflow.connections)) {
    if (connections.main) {
      for (const connectionGroup of connections.main) {
        for (const connection of connectionGroup) {
          if (connection.node === nodeName) {
            parents.push(sourceNode);
          }
        }
      }
    }
  }

  return parents;
}

/**
 * Find nodes that a specific node connects to (children)
 */
export function findChildNodes(workflow: IWorkflowDefinition, nodeName: string): string[] {
  const children: string[] = [];
  const connections = workflow.connections[nodeName];

  if (connections && connections.main) {
    for (const connectionGroup of connections.main) {
      for (const connection of connectionGroup) {
        children.push(connection.node);
      }
    }
  }

  return children;
}

/**
 * Create a node definition
 */
export function createNode(
  name: string,
  type: string,
  parameters: Record<string, any>,
  position: [number, number] = [0, 0],
): IWorkflowNode {
  return {
    name,
    type,
    typeVersion: 1,
    position,
    parameters,
  };
}

/**
 * Clone a workflow definition
 */
export function cloneWorkflow(workflow: IWorkflowDefinition): IWorkflowDefinition {
  return JSON.parse(JSON.stringify(workflow));
}

/**
 * Merge workflow execution results
 */
export function mergeExecutionResults(
  ...resultMaps: Map<string, INodeExecutionData[]>[]
): Map<string, INodeExecutionData[]> {
  const merged = new Map<string, INodeExecutionData[]>();

  for (const resultMap of resultMaps) {
    for (const [key, value] of resultMap.entries()) {
      merged.set(key, value);
    }
  }

  return merged;
}

/**
 * Create mock node execution data
 */
export function createMockExecutionData(json: any): INodeExecutionData {
  return {
    json,
  };
}

/**
 * Create mock binary execution data
 */
export function createMockBinaryData(
  json: any,
  binaryPropertyName: string,
  data: string,
  mimeType: string = 'application/octet-stream',
): INodeExecutionData {
  return {
    json,
    binary: {
      [binaryPropertyName]: {
        data,
        mimeType,
        fileName: 'test-file.bin',
        fileExtension: 'bin',
      },
    },
  };
}

/**
 * Assert node output exists
 */
export function assertNodeOutput(
  results: Map<string, INodeExecutionData[]>,
  nodeName: string,
): void {
  if (!results.has(nodeName)) {
    throw new Error(`Node '${nodeName}' not found in execution results`);
  }

  const output = results.get(nodeName);
  if (!output || output.length === 0) {
    throw new Error(`Node '${nodeName}' produced no output`);
  }
}

/**
 * Assert node output count
 */
export function assertNodeOutputCount(
  results: Map<string, INodeExecutionData[]>,
  nodeName: string,
  expectedCount: number,
): void {
  assertNodeOutput(results, nodeName);

  const output = results.get(nodeName)!;
  if (output.length !== expectedCount) {
    throw new Error(
      `Node '${nodeName}' output count mismatch. Expected ${expectedCount}, got ${output.length}`,
    );
  }
}

/**
 * Assert node output contains field
 */
export function assertNodeOutputHasField(
  results: Map<string, INodeExecutionData[]>,
  nodeName: string,
  field: string,
): void {
  assertNodeOutput(results, nodeName);

  const output = results.get(nodeName)![0];
  if (!(field in output.json)) {
    throw new Error(`Node '${nodeName}' output missing field '${field}'`);
  }
}

/**
 * Print workflow execution summary
 */
export function printExecutionSummary(results: Map<string, INodeExecutionData[]>): void {
  console.log('\n📊 Workflow Execution Summary:');
  console.log('================================');

  for (const [nodeName, outputs] of results.entries()) {
    console.log(`\n${nodeName}:`);
    console.log(`  Items: ${outputs.length}`);

    if (outputs.length > 0) {
      const firstItem = outputs[0].json;
      const keys = Object.keys(firstItem);
      console.log(`  Fields: ${keys.join(', ')}`);

      // Show sample data for first item
      if (keys.length > 0) {
        console.log(`  Sample data:`);
        for (const key of keys.slice(0, 3)) {
          const value = firstItem[key];
          const displayValue =
            typeof value === 'string' && value.length > 50
              ? value.substring(0, 50) + '...'
              : JSON.stringify(value);
          console.log(`    ${key}: ${displayValue}`);
        }
      }
    }
  }

  console.log('\n================================\n');
}
