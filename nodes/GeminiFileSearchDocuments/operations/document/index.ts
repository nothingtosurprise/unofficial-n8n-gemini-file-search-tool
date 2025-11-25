import { IExecuteFunctions } from 'n8n-workflow';
import { deleteDocument } from './delete';
import { get } from './get';
import { importFile } from './import';
import { list } from './list';
import { query } from './query';
import { replaceUpload } from './replaceUpload';
import { upload } from './upload';

// Return type must be 'any' as operations return different types (Document, Operation, Document[], etc.)
// and the calling code needs to handle various response structures dynamically
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeDocumentOperation(
  this: IExecuteFunctions,
  operation: string,
  index: number,
): Promise<any> {
  switch (operation) {
    case 'upload':
      return upload.call(this, index);
    case 'import':
      return importFile.call(this, index);
    case 'list':
      return list.call(this, index);
    case 'get':
      return get.call(this, index);
    case 'delete':
      return deleteDocument.call(this, index);
    case 'query':
      return query.call(this, index);
    case 'replaceUpload':
      return replaceUpload.call(this, index);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
