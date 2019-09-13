import axios, { AxiosInstance } from 'axios';
import querystring from 'querystring';
import IBook, { BookProvider } from '../interfaces/IBook';
import IBookProvider, {
	IBookProviderGet,
	IBookProviderGets,
} from '../interfaces/IBookProvider';
import formatISBN from '../tools/formatISBN';

/**
 * The industry identifiers of google
 */
export enum IndustryIdentifier {
	ISBN_10 = 'ISBN_10',
	ISBN_13 = 'ISBN_13',
}

/**
 * The format of a google book API return
 */
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

/**
 * Formats the google results to our format
 * @param googleBook The JSON object from the google API
 */
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
		description,
		identifiers: {
			isbn10: industryByType.get(IndustryIdentifier.ISBN_10),
			isbn13: industryByType.get(IndustryIdentifier.ISBN_13),
		},
		pages: pageCount,
		publishDate: publishedDate,
		sources: [BookProvider.GoogleBooks],
		subjects: categories,
		subtitle,
		title,
	};
};

const http = axios.create({
	baseURL: `https://www.googleapis.com/books/v1/volumes`,
});

export default class OpenLibraryBookProvider implements IBookProvider {
	constructor(private apiKey: string) {}

	public async gets(
		options: IBookProviderGets
	): Promise<Map<string, IBook | undefined>> {
		if (!options.isbns || !options.isbns.length) {
			throw new Error('No isbn defined');
		}
		options.isbns = options.isbns.map(formatISBN);
		const promises = options.isbns.map(async isbn => {
			const { data } = await http.get(
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
