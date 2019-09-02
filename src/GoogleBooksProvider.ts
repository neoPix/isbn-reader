import axios, { AxiosInstance } from 'axios';
import querystring from 'querystring';
import formatISBN from './formatISBN';
import IBook, { BookProvider } from './IBook';
import IBookProvider, {
	IBookProviderGet,
	IBookProviderGets,
} from './IBookProvider';

export enum IndustryIdentifier {
	ISBN_10 = 'ISBN_10',
	ISBN_13 = 'ISBN_13',
}

export interface IGoogleBook {
	volumeInfo: {
		title: string;
		subtitle?: string;
		authors: string[];
		publishedDate: string;
		description: string;
		pageCount: number;
		categories: string[];
		industryIdentifiers: Array<{
			type: IndustryIdentifier;
			identifier: string;
		}>;
		imageLinks: {
			smallThumbnail: string;
			thumbnail: string;
		};
		language: string;
	};
}

export const mapGoogleBooksResult = (googleBook: any): IBook => {
	if (!(googleBook instanceof Object)) {
		throw new Error('Cannot mapGoogleBooksResult');
	}
	const {
		volumeInfo: {
			title,
			subtitle,
			authors,
			publishedDate,
			description,
			pageCount,
			categories,
			industryIdentifiers,
		},
	} = googleBook as IGoogleBook;
	const industryByType = industryIdentifiers.reduce(
		(acc, { type, identifier }) => {
			const existing = acc.get(type);
			if (existing) {
				existing.push(identifier);
				return acc;
			}
			return acc.set(type, [identifier]);
		},
		new Map<IndustryIdentifier, string[]>()
	);
	return {
		authors,
		identifiers: {
			isbn10: industryByType.get(IndustryIdentifier.ISBN_10),
			isbn13: industryByType.get(IndustryIdentifier.ISBN_13),
		},
		notes: description,
		pages: pageCount,
		provider: BookProvider.GoogleBooks,
		publishDate: publishedDate,
		subjects: categories,
		subtitle,
		title,
	};
};

export default class OpenLibraryBookProvider implements IBookProvider {
	private http: AxiosInstance;
	constructor(private apiKey: string) {
		this.http = axios.create({
			baseURL: `https://www.googleapis.com/books/v1/volumes`,
		});
	}

	public async gets(
		options: IBookProviderGets
	): Promise<Map<string, IBook | undefined>> {
		if (!options.isbns || !options.isbns.length) {
			throw new Error('No isbn defined');
		}
		options.isbns = options.isbns.map(formatISBN);
		const promises = options.isbns.map(async isbn => {
			const { data } = await this.http.get(
				`?${querystring.stringify({ key: this.apiKey, q: `isbn:${isbn}` })}`
			);
			if (data.totalItems === 0) {
				return [isbn, undefined];
			}
			return [isbn, data.items[0]];
		});
		const resolved = await Promise.all(promises);
		const books = resolved.reduce(
			(results, [isbn, book]) =>
				results.set(isbn, book ? mapGoogleBooksResult(book) : undefined),
			options.isbns.reduce(
				(map, key) => map.set(key, undefined),
				new Map<string, IBook | undefined>()
			)
		);
		return books;
	}
	public async get(options: IBookProviderGet): Promise<IBook | undefined> {
		const books = await this.gets({ isbns: [options.isbn] });
		return books.get(options.isbn.toUpperCase());
	}
}
