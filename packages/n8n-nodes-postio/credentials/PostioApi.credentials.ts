import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PostioApi implements ICredentialType {
	name = 'postioApi';

	displayName = 'Postio API';

	icon: Icon = { light: 'file:../icons/postio.svg', dark: 'file:../icons/postio.dark.svg' };

	documentationUrl = 'https://postio.co.uk/docs/authentication';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'Your Postio API key (pk_…). Get one free at https://postio.co.uk/signup — the first 100 lookups are free, no card needed.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.postio.co.uk/v1',
			url: '/connect',
			method: 'GET',
		},
	};
}
