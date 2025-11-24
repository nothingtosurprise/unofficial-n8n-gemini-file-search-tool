/**
 * Test Helper Utilities
 * Provides common utilities for testing n8n nodes
 */

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

/**
 * Creates a mock IExecuteFunctions object for testing
 */
export function createMockExecuteFunction(
  nodeParameters: any = {},
  inputData: INodeExecutionData[] = [],
): Partial<IExecuteFunctions> {
  return {
    getNodeParameter: (parameterName: string, itemIndex: number, fallbackValue?: any) => {
      return nodeParameters[parameterName] ?? fallbackValue;
    },
    getInputData: () => inputData,
    helpers: {
      request: jest.fn(),
    } as any,
    getNode: () => ({
      id: 'test-node-id',
      name: 'Test Node',
      type: 'n8n-nodes-base.test',
      typeVersion: 1,
      position: [0, 0],
      parameters: nodeParameters,
    }),
  };
}

/**
 * Creates mock node execution data
 */
export function createMockNodeExecutionData(json: any = {}, binary: any = {}): INodeExecutionData {
  return {
    json,
    binary,
  };
}

/**
 * Asserts that a value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected value to be defined');
  }
}

/**
 * Creates a delay for async testing
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
