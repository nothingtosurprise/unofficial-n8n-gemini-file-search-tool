import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/**
 * Credential type for authenticating with Google Gemini API
 *
 * This credential stores the API key required to access Gemini services including
 * File Search Stores, Documents, and generative AI models. The API key is automatically
 * added to requests via the x-goog-api-key header.
 *
 * @example
 * ```typescript
 * // In n8n workflow, users configure:
 * // - API Key: Their Google AI Studio or Vertex AI API key
 *
 * // The credential is then referenced by nodes:
 * const credentials = await this.getCredentials('geminiApi');
 * const apiKey = credentials.apiKey as string;
 * ```
 *
 * @see {@link https://ai.google.dev/gemini-api/docs/api-key | Gemini API Key Documentation}
 */
export class GeminiApi implements ICredentialType {
  name = 'geminiApi';
  displayName = 'Gemini API';
  documentationUrl = 'https://ai.google.dev/gemini-api/docs/api-key';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'Your Google Gemini API Key',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'x-goog-api-key': '={{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      url: '/fileSearchStores',
      qs: {
        pageSize: 1,
      },
    },
  };
}
