import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { documentFields, documentOperations } from './descriptions/DocumentDescription';
import { executeDocumentOperation } from './operations/document';

export class GeminiFileSearchDocuments implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Gemini File Search Documents',
    name: 'geminiFileSearchDocuments',
    icon: 'file:gemini.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Manage and query documents in Gemini File Search stores',
    defaults: {
      name: 'Gemini File Search Documents',
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
