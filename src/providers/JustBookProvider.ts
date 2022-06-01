import axios from 'axios';
import cheerio from 'cheerio';
import IBook, { BookProvider } from '../interfaces/IBook';
import IBookProvider, {
	IBookProviderGet,
	IBookProviderGets,
} from '../interfaces/IBookProvider';
import formatISBN from '../tools/formatISBN';

const http = axios.create({
	baseURL: 'https://www.justbooks.co.uk/search',
});

export const manageEmptyString = (str: string): string | undefined =>
	str && str.length ? str : undefined;

export const split = (str: string, char: string): string[] => {
	if (str && str.length) {
		return str.split(char).map(str => str.trim());
	}
	return [];
};

export const JustBookResult = (data: Buffer): IBook | undefined => {
	const $ = cheerio.load(data, {
		decodeEntities: false,
	});
	const book = $('.attributes');
	const [isbn13, isbn10] = split($('h1', book).text(), '/');
	const publishers = split($('span[itemprop="publisher"]', book).text(), ',');
	const authors = split($('span[itemprop="author"]', book).text(), ';');
	const image = $('#coverImage').attr('src');
	const year = publishers.pop();
	return {
		authors,
		description: manageEmptyString($('#bookSummary').text()),
		identifiers: {
			isbn10: [isbn10],
			isbn13: [isbn13],
		},
		images: [],
		pages: 0,
		publishDate: year,
		publishers,
		sources: [BookProvider.JUSTBOOK],
		subjects: image ? [image] : [],
		title: $('#describe-isbn-title', book).text(),
	};
};

export default class JustBookProvider implements IBookProvider {
	public async gets(
		options: IBookProviderGets
	): Promise<Map<string, IBook | undefined>> {
		if (!options.isbns || !options.isbns.length) {
			throw new Error('No isbn defined');
		}
		options.isbns = options.isbns.map(formatISBN);
		const results = await Promise.all(
			options.isbns.map(isbn =>
				http
					.get(`?isbn=${isbn}&mode=isbn&st=sr&ac=qr`, {
						responseType: 'arraybuffer',
					})
					.then(response => ({ isbn, dom: response.data.toString('latin1') }))
			)
		);
		const books = results.reduce((results, { isbn, dom }) => {
			return results.set(isbn, JustBookResult(dom));
		}, options.isbns.reduce((map, key) => map.set(key, undefined), new Map<string, IBook | undefined>()));
		return books;
	}
	public async get(options: IBookProviderGet): Promise<IBook | undefined> {
		const books = await this.gets({ isbns: [options.isbn] });
		return books.get(options.isbn.toUpperCase());
	}
}
