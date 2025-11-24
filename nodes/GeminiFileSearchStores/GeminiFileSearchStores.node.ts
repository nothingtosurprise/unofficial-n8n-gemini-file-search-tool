import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { storeFields } from './descriptions/StoreDescription';
import * as store from './operations/store';

export class GeminiFileSearchStores implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Gemini File Search Stores',
    name: 'geminiFileSearchStores',
    icon: 'file:gemini.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Manage File Search stores for Gemini RAG operations',
    defaults: {
      name: 'Gemini File Search Stores',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'geminiApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Create',
            value: 'create',
            description: 'Create a new File Search store',
            action: 'Create a store',
          },
          {
            name: 'Delete',
            value: 'delete',
            description: 'Delete a File Search store',
            action: 'Delete a store',
          },
          {
            name: 'Get',
            value: 'get',
            description: 'Get a File Search store',
            action: 'Get a store',
          },
          {
            name: 'Get Operation Status',
            value: 'getOperation',
            description: 'Get status of a long-running operation',
            action: 'Get operation status',
          },
          {
            name: 'List',
            value: 'list',
            description: 'List all File Search stores',
            action: 'List stores',
          },
        ],
        default: 'create',
      },
      ...storeFields,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0);

    for (let i = 0; i < items.length; i++) {
      try {
        // Store operations return different types (FileSearchStore, Operation, FileSearchStore[], etc.)
        // so we must use 'any' here to handle the dynamic response structure
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let responseData: any;

        if (operation === 'create') {
          responseData = await store.create.call(this, i);
        } else if (operation === 'delete') {
          responseData = await store.deleteStore.call(this, i);
        } else if (operation === 'get') {
          responseData = await store.get.call(this, i);
        } else if (operation === 'getOperation') {
          responseData = await store.getOperation.call(this, i);
        } else if (operation === 'list') {
          responseData = await store.list.call(this, i);
        }

        const executionData = this.helpers.constructExecutionMetaData(
          // returnJsonArray expects 'any' type as it processes dynamic data structures
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this.helpers.returnJsonArray(responseData),
          { itemData: { item: i } },
        );

        returnData.push(...executionData);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: (error as Error).message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
