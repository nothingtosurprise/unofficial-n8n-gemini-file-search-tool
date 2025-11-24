import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

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
