import axios from 'axios';
import cheerio from 'cheerio';
import IBook, { BookProvider } from '../interfaces/IBook';
import IBookProvider, {
	IBookProviderGet,
	IBookProviderGets,
} from '../interfaces/IBookProvider';
import formatISBN from '../tools/formatISBN';

const http = axios.create({
	baseURL: 'https://isbnsearch.org/isbn',
});

export const addIfEmpty = (
	size: number = 13,
	items: Array<string> | undefined,
	item: string
): Array<string> => {
	if (!Array.isArray(items)) {
		return [item];
	}
	if (item.length == size && !items.includes(item)) {
		return [...items, item];
	}
	return items;
};

export const ISBNSearchResult = (data: string, selector: string): IBook | undefined => {
	const $ = cheerio.load(data);
	const captcha = $('#recaptcha');
	if (captcha.length) {
		return;
	}
	const book = $('#book');
	return {
		authors: [],
		identifiers: {
			isbn10: [$('p strong+a', book).text()],
			isbn13: [$('p strong+a', book).text()],
		},
		pages: 0,
		publishDate: new Date().toUTCString(),
		sources: [BookProvider.ISBNSEARCH],
		subjects: [],
		title: $('.bookinfo', book).text(),
	};
};

export default class ISBNSearchProvider implements IBookProvider {
	public async gets(
		options: IBookProviderGets
	): Promise<Map<string, IBook | undefined>> {
		if (!options.isbns || !options.isbns.length) {
			throw new Error('No isbn defined');
		}
		options.isbns = options.isbns.map(formatISBN);
		const results = await Promise.all(
			options.isbns.map(isbn =>
				http.get(`${isbn}`).then(({ data }) => ({ isbn, dom: data }))
			)
		);
		const books = results.reduce((results, { isbn, dom }) => {
			return results.set(isbn, ISBNSearchResult(dom, isbn));
		}, options.isbns.reduce((map, key) => map.set(key, undefined), new Map<string, IBook | undefined>()));
		return books;
	}
	public async get(options: IBookProviderGet): Promise<IBook | undefined> {
		const books = await this.gets({ isbns: [options.isbn] });
		return books.get(options.isbn.toUpperCase());
	}
}
