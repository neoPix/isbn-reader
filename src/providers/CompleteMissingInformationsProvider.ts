import IBook, { IBookIdentifiers } from '../interfaces/IBook';
import IBookProvider, {
	IBookProviderGet,
	IBookProviderGets,
} from '../interfaces/IBookProvider';

type BookMergeCallback = (a: IBook, b: IBook) => IBook;

export interface IFirstFoundProviderConstructorOptions {
	providers: IBookProvider[];
	merge?: BookMergeCallback;
}

const merge = (a: any, b: any, keys: string[]): any => {
	for (const key of keys) {
		const value = a[key];
		if (!value) {
			a[key] = b[key];
		}
	}
	return a;
};

export const mergeOnUndefined = (a: IBook, b: IBook): IBook => {
    const book = merge(a, b, ['title', 'subtitle', 'notes', 'description', 'pages', 'publishDate']) as IBook;
    book.identifiers = merge(a.identifiers, b.identifiers, ['isbn13', 'isbn10', 'oclc', 'lccn']) as IBookIdentifiers;
	book.sources = [...a.sources, ...b.sources];
	return book;
};

export default class CompleteMissingInfirmationsProvider
	implements IBookProvider {
	constructor(private options: IFirstFoundProviderConstructorOptions) {
		if (!this.options.merge) {
			this.options.merge = mergeOnUndefined;
		}
	}
	public async gets(
		options: IBookProviderGets
	): Promise<Map<string, IBook | undefined>> {
		if (!options.isbns || !options.isbns.length) {
			throw new Error('No isbn defined');
		}
		return this.options.providers.reduce(async (previous, current) => {
			const previousMap = await previous;
			const ISBNs = [...previousMap.entries()].map(([isbn]) => isbn);
			const resultMap = await current.gets({
				isbns: ISBNs,
			});
			for (const [isbn, book] of resultMap) {
				const previousBook = previousMap.get(isbn);
				if (book && previousBook) {
					previousMap.set(isbn, this.getMerge()(previousBook, book));
				} else if (book) {
					previousMap.set(isbn, book);
				}
			}
			return previousMap;
		}, Promise.resolve(options.isbns.reduce((map, key) => map.set(key, undefined), new Map<string, IBook | undefined>())));
	}
	public async get(options: IBookProviderGet): Promise<IBook | undefined> {
		const books = await this.gets({ isbns: [options.isbn] });
		return books.get(options.isbn.toUpperCase());
	}
	private getMerge(): BookMergeCallback {
		if (!this.options.merge) {
			return mergeOnUndefined;
		}
		return this.options.merge;
	}
}
