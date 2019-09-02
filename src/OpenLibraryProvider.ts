import axios from 'axios';
import formatISBN from './formatISBN';
import IBook, { BookProvider } from './IBook';
import IBookProvider, {
	IBookProviderGet,
	IBookProviderGets,
} from './IBookProvider';

const http = axios.create({
	baseURL: 'https://openlibrary.org/api/books',
});

export interface IOpenLibraryResult {
	title: string;
	subtitle?: string;
	publish_date: string;
	authors: Array<{ url: string; name: string }>;
	notes: string;
	identifiers: {
		openlibrary: string[];
		isbn_13?: string[];
		isbn_10?: string[];
		lccn?: string[];
		oclc?: string[];
	};
	subjects: Array<{ urm: string; name: string }>;
	number_of_pages: number;
}

export const mapOpenLibraryResult = (data: any): IBook => {
	if (!(data instanceof Object)) {
		throw new Error('Cannot mapOpenApiResult');
	}
	const {
		title,
		publish_date,
		subtitle,
		number_of_pages,
		identifiers: { isbn_10, isbn_13, lccn, oclc },
		authors,
		subjects,
		notes,
	} = data as IOpenLibraryResult;
	return {
		authors: authors.map(({ name }) => name),
		identifiers: {
			isbn10: isbn_10,
			isbn13: isbn_13,
			lccn,
			oclc,
		},
		notes,
		pages: number_of_pages,
		provider: BookProvider.OpenLibrary,
		publishDate: publish_date,
		subjects: subjects.map(({ name }) => name),
		subtitle,
		title,
	};
};

export default class OpenLibraryBookProvider implements IBookProvider {
	public async gets(
		options: IBookProviderGets
	): Promise<Map<string, IBook | undefined>> {
		if (!options.isbns || !options.isbns.length) {
			throw new Error('No isbn defined');
		}
		options.isbns = options.isbns.map(formatISBN);
		const params = `?format=json&jscmd=data&bibkeys=${options.isbns
			.map(isbn => `ISBN:${isbn}`)
			.join(',')}`;
		const { data } = await http.get(params);
		const books = Object.entries(data).reduce(
			(results, [key, value]) =>
				results.set(
					key.split(':')[1].toUpperCase(),
					mapOpenLibraryResult(value)
				),
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
