import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

/**
 * Postio — UK address, email and phone validation.
 *
 * Declarative (routing-based) node: every operation is a GET against
 * api.postio.co.uk/v1 with the key in the x-api-key header, so there is no
 * runtime code and no runtime dependency. Endpoints and parameters mirror the
 * public OpenAPI spec at https://postio.co.uk/openapi.json.
 */
export class Postio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Postio',
		name: 'postio',
		icon: { light: 'file:../../icons/postio.svg', dark: 'file:../../icons/postio.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'UK address lookup, postcode autocomplete, email validation and phone validation on official Royal Mail PAF data',
		defaults: {
			name: 'Postio',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'postioApi', required: true }],
		requestDefaults: {
			baseURL: 'https://api.postio.co.uk/v1',
			headers: {
				Accept: 'application/json',
				'x-postio-client': '@postio/n8n-nodes-postio/0.1.2',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Address', value: 'address' },
					{ name: 'Email', value: 'email' },
					{ name: 'Phone', value: 'phone' },
				],
				default: 'address',
			},

			// ---------- Address ----------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['address'] } },
				options: [
					{
						name: 'Search',
						value: 'search',
						action: 'Search UK addresses',
						description: 'Typeahead search — turns a partial address or postcode into suggestions, each with a UDPRN',
						routing: { request: { method: 'GET', url: '/address/search' } },
					},
					{
						name: 'Get by UDPRN',
						value: 'udprn',
						action: 'Get a full address by UDPRN',
						description: 'Resolve one full Royal Mail PAF address from its UDPRN (billable on a result)',
						routing: { request: { method: 'GET', url: '=/address/udprn/{{$parameter["udprn"]}}' } },
					},
					{
						name: 'List by Postcode',
						value: 'postcode',
						action: 'List every address on a postcode',
						description: 'Every delivery point on a UK postcode (billable on a result)',
						routing: {
							request: {
								method: 'GET',
								url: '=/address/postcode/{{encodeURIComponent($parameter["postcode"])}}',
							},
						},
					},
				],
				default: 'search',
			},
			{
				displayName: 'Query',
				name: 'q',
				type: 'string',
				required: true,
				default: '',
				placeholder: '57 wimpole',
				description: 'What the user has typed — a partial address, street or postcode',
				displayOptions: { show: { resource: ['address'], operation: ['search'] } },
				routing: { send: { type: 'query', property: 'q' } },
			},
			{
				displayName: 'Max Results',
				name: 'max_results',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 100 },
				displayOptions: { show: { resource: ['address'], operation: ['search', 'postcode'] } },
				routing: { send: { type: 'query', property: 'max_results' } },
			},
			{
				displayName: 'UDPRN',
				name: 'udprn',
				type: 'string',
				required: true,
				default: '',
				placeholder: '50905588',
				description: 'Royal Mail Unique Delivery Point Reference Number, as returned by Search',
				displayOptions: { show: { resource: ['address'], operation: ['udprn'] } },
			},
			{
				displayName: 'Postcode',
				name: 'postcode',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'W1G 8YW',
				displayOptions: { show: { resource: ['address'], operation: ['postcode'] } },
			},

			// ---------- Email ----------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['email'] } },
				options: [
					{
						name: 'Validate',
						value: 'validate',
						action: 'Validate an email address',
						description: 'Syntax, MX, live SMTP probe, disposable and role-address flags, typo suggestion',
						routing: {
							request: {
								method: 'GET',
								url: '=/email/{{encodeURIComponent($parameter["address"])}}',
							},
						},
					},
				],
				default: 'validate',
			},
			{
				displayName: 'Email Address',
				name: 'address',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'name@example.com',
				displayOptions: { show: { resource: ['email'] } },
			},

			// ---------- Phone ----------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['phone'] } },
				options: [
					{
						name: 'Validate',
						value: 'validate',
						action: 'Validate a UK phone number',
						description: 'Parses and formats to E.164, then a live carrier lookup: line type, carrier, reachability',
						routing: {
							request: {
								method: 'GET',
								url: '=/phone/{{encodeURIComponent($parameter["number"])}}',
							},
						},
					},
				],
				default: 'validate',
			},
			{
				displayName: 'Phone Number',
				name: 'number',
				type: 'string',
				required: true,
				default: '',
				placeholder: '+44 20 7946 0000',
				displayOptions: { show: { resource: ['phone'] } },
			},
		],
	};
}
