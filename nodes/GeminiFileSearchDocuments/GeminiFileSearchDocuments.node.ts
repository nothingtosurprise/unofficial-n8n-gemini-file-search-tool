import {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodeListSearchItems,
  INodeListSearchResult,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { documentFields, documentOperations } from './descriptions/DocumentDescription';
import { executeDocumentOperation } from './operations/document';
import { geminiApiRequestAllItems } from '../../utils/apiClient';
import { FileSearchStore } from '../../utils/types';

export class GeminiFileSearchDocuments implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Gemini File Search Documents',
    name: 'geminiFileSearchDocuments',
    icon: 'file:gemini.svg',
    group: ['transform'],
    version: [1],
    defaultVersion: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Manage and query documents in Gemini File Search stores',
    defaults: {
      name: 'Gemini File Search Documents',
    },
    inputs: ['main'],
    outputs: ['main'],
    usableAsTool: true,
    credentials: [
      {
        name: 'geminiApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'hidden',
        noDataExpression: true,
        default: 'document',
        options: [
          {
            name: 'Document',
            value: 'document',
          },
        ],
      },
      ...documentOperations,
      ...documentFields,
    ],
  };

  methods = {
    // listSearch is used by resourceLocator fields (upload, import, list, replaceUpload operations)
    listSearch: {
      async getStores(
        this: ILoadOptionsFunctions,
        filter?: string,
      ): Promise<INodeListSearchResult> {
        const stores = (await geminiApiRequestAllItems.call(
          this,
          'fileSearchStores',
          'GET',
          '/fileSearchStores',
        )) as FileSearchStore[];

        let results: INodeListSearchItems[] = stores.map((store) => ({
          name: store.displayName || store.name.split('/').pop() || store.name,
          value: store.name,
          url: `https://aistudio.google.com/prompts?state=%7B%22fileSearchStoreName%22:%22${encodeURIComponent(store.name)}%22%7D`,
        }));

        // Apply filter if provided
        if (filter) {
          const lowerFilter = filter.toLowerCase();
          results = results.filter(
            (item) =>
              item.name.toLowerCase().includes(lowerFilter) ||
              String(item.value).toLowerCase().includes(lowerFilter),
          );
        }

        return { results };
      },
    },
    // loadOptions is used by multiOptions field (Query operation's storeNames)
    loadOptions: {
      async getStores(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const stores = (await geminiApiRequestAllItems.call(
          this,
          'fileSearchStores',
          'GET',
          '/fileSearchStores',
        )) as FileSearchStore[];

        return stores.map((store) => ({
          name: store.displayName || store.name.split('/').pop() || store.name,
          value: store.name,
          description: `Created: ${new Date(store.createTime).toLocaleDateString()}`,
        }));
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0);

    for (let i = 0; i < items.length; i++) {
      try {
        // executeDocumentOperation returns different types based on operation (Document, Operation, Document[], etc.)
        // so we must use 'any' here to handle the dynamic response structure
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        const responseData: any = await executeDocumentOperation.call(this, operation, i);

        // Handle array responses (like list operations)
        if (Array.isArray(responseData)) {
          // Array items are dynamic based on operation (Document, FileSearchStore, etc.)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          returnData.push(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...responseData.map((item: any) => ({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              json: item,
              pairedItem: { item: i },
            })),
          );
        } else {
          returnData.push({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            json: responseData,
            pairedItem: { item: i },
          });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: (error as Error).message,
            },
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
