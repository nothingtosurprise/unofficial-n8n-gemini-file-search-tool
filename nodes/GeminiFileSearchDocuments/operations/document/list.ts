import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest, geminiApiRequestAllItems } from '../../../../utils/apiClient';
import { filterDocuments } from '../../../../utils/metadataFilter';
import { Document } from '../../../../utils/types';
import { validateStoreName } from '../../../../utils/validators';

interface ListResponse {
  documents?: Document[];
}

export interface DeletedDuplicateInfo {
  displayName: string;
  deletedDocuments: {
    name: string;
    createTime: string;
    deleted: boolean;
    error?: string;
  }[];
  keptDocument: {
    name: string;
    createTime: string;
  };
}

export interface ListResultWithDuplicates {
  documents: Document[];
  duplicatesDeleted?: {
    totalGroups: number;
    totalDeleted: number;
    totalFailed: number;
    details: DeletedDuplicateInfo[];
  };
}

/**
 * Lists documents in a Gemini File Search Store with optional pagination and metadata filtering
 *
 * Retrieves all documents or a limited number based on node parameters.
 * Supports both paginated and full list retrieval, with optional client-side metadata filtering.
 * Optionally deletes duplicate documents (same display name), keeping only the most recent.
 *
 * @param this - n8n execution context
 * @param index - Item index in the workflow execution
 * @returns Promise resolving to array of Document objects or ListResultWithDuplicates if deleteDuplicates is enabled
 * @throws {NodeOperationError} When store name format is invalid
 * @throws {NodeApiError} When API request fails or store not found
 *
 * @example
 * ```typescript
 * // Get all documents from a store
 * const allDocs = await list.call(this, 0); // returnAll = true
 * console.log(`Total documents: ${allDocs.length}`);
 *
 * // Get first 20 documents with metadata filter
 * const docs = await list.call(this, 0); // returnAll = false, limit = 20, metadataFilter = 'author="Latour"'
 * docs.forEach(doc => {
 *   console.log(`${doc.displayName} (${doc.state})`);
 * });
 *
 * // Delete duplicates and get remaining documents
 * const result = await list.call(this, 0); // deleteDuplicates = true
 * console.log(`Deleted ${result.duplicatesDeleted.totalDeleted} duplicates`);
 * ```
 */
export async function list(
  this: IExecuteFunctions,
  index: number,
): Promise<Document[] | ListResultWithDuplicates> {
  const storeName = this.getNodeParameter('storeName', index) as string;
  const returnAll = this.getNodeParameter('returnAll', index) as boolean;
  const metadataFilter = this.getNodeParameter('metadataFilter', index, '') as string;
  const deleteDuplicates = this.getNodeParameter('deleteDuplicates', index, false) as boolean;
  const forceDeleteDuplicates = deleteDuplicates
    ? (this.getNodeParameter('forceDeleteDuplicates', index, true) as boolean)
    : false;

  validateStoreName.call(this, storeName);

  let documents: Document[];

  // When deleting duplicates, we need all documents to properly identify duplicates
  if (deleteDuplicates || returnAll) {
    // API client returns 'any[]', but we know this endpoint returns Document[]
    documents = (await geminiApiRequestAllItems.call(
      this,
      'documents',
      'GET',
      `/${storeName}/documents`,
    )) as Document[];
  } else {
    const limit = this.getNodeParameter('limit', index);
    const response = (await geminiApiRequest.call(
      this,
      'GET',
      `/${storeName}/documents`,
      {},
      { pageSize: limit },
    )) as ListResponse;
    documents = response.documents || [];
  }

  // The Gemini API LIST endpoint returns all document fields including:
  // name, displayName, customMetadata, createTime, updateTime, state, sizeBytes, mimeType

  // Apply client-side metadata filtering if specified
  if (metadataFilter) {
    documents = filterDocuments(documents, metadataFilter);
  }

  // Handle duplicate deletion if enabled
  if (deleteDuplicates && documents.length > 0) {
    const result = await deleteDuplicateDocuments.call(this, documents, forceDeleteDuplicates);

    // If not returnAll, apply the limit to the remaining documents
    if (!returnAll) {
      const limit = this.getNodeParameter('limit', index);
      result.documents = result.documents.slice(0, Number(limit));
    }

    return result;
  }

  return documents;
}

/**
 * Deletes duplicate documents, keeping only the most recent version for each display name
 *
 * Groups documents by displayName and for each group with more than one document,
 * deletes all but the most recent (based on createTime).
 *
 * @param this - n8n execution context
 * @param documents - Array of documents to process
 * @param forceDelete - Whether to force delete documents
 * @returns Object containing remaining documents and deletion details
 */
async function deleteDuplicateDocuments(
  this: IExecuteFunctions,
  documents: Document[],
  forceDelete: boolean,
): Promise<ListResultWithDuplicates> {
  // Group documents by displayName
  const documentsByName = new Map<string, Document[]>();

  for (const doc of documents) {
    const displayName = doc.displayName || doc.name; // Fallback to resource name if no displayName
    if (!documentsByName.has(displayName)) {
      documentsByName.set(displayName, []);
    }
    documentsByName.get(displayName)!.push(doc);
  }

  // Find groups with duplicates and process them
  const duplicateDetails: DeletedDuplicateInfo[] = [];
  const documentsToKeep: Document[] = [];
  let totalDeleted = 0;
  let totalFailed = 0;

  for (const [displayName, docs] of documentsByName) {
    if (docs.length === 1) {
      // No duplicates, keep the document
      documentsToKeep.push(docs[0]);
    } else {
      // Sort by createTime descending (most recent first)
      docs.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());

      // Keep the most recent document
      const mostRecent = docs[0];
      documentsToKeep.push(mostRecent);

      // Delete the rest
      const duplicatesToDelete = docs.slice(1);
      const deletedDocs: DeletedDuplicateInfo['deletedDocuments'] = [];

      for (const dupDoc of duplicatesToDelete) {
        try {
          const qs: IDataObject = {};
          if (forceDelete) {
            qs.force = true;
          }
          await geminiApiRequest.call(this, 'DELETE', `/${dupDoc.name}`, {}, qs);
          deletedDocs.push({
            name: dupDoc.name,
            createTime: dupDoc.createTime,
            deleted: true,
          });
          totalDeleted++;
        } catch (error) {
          deletedDocs.push({
            name: dupDoc.name,
            createTime: dupDoc.createTime,
            deleted: false,
            error: error instanceof Error ? error.message : String(error),
          });
          totalFailed++;
        }
      }

      duplicateDetails.push({
        displayName,
        keptDocument: {
          name: mostRecent.name,
          createTime: mostRecent.createTime,
        },
        deletedDocuments: deletedDocs,
      });
    }
  }

  return {
    documents: documentsToKeep,
    duplicatesDeleted: {
      totalGroups: duplicateDetails.length,
      totalDeleted,
      totalFailed,
      details: duplicateDetails,
    },
  };
}
