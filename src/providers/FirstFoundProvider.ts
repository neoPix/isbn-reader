import IBook from '../interfaces/IBook';
import IBookProvider, {
	IBookProviderGet,
	IBookProviderGets,
} from '../interfaces/IBookProvider';

export interface IFirstFoundProviderConstructorOptions {
	providers: IBookProvider[];
}

export default class FirstFoundProvider implements IBookProvider {
	constructor(private options: IFirstFoundProviderConstructorOptions) {}
	public async gets(
		options: IBookProviderGets
	): Promise<Map<string, IBook | undefined>> {
		if (!options.isbns || !options.isbns.length) {
			throw new Error('No isbn defined');
		}
		return this.options.providers.reduce(async (previous, current) => {
			const previousMap = await previous;
			const missingISBN = [...previousMap.entries()]
				.filter(([, book]) => !Boolean(book))
				.map(([isbn]) => isbn);
			if (missingISBN.length > 0) {
				const resultMap = await current.gets({
					isbns: missingISBN,
				});
				for (const [isbn, book] of resultMap) {
					if (book) {
						previousMap.set(isbn, book);
					}
				}
			}
			return previousMap;
		}, Promise.resolve(options.isbns.reduce((map, key) => map.set(key, undefined), new Map<string, IBook | undefined>())));
	}
	public async get(options: IBookProviderGet): Promise<IBook | undefined> {
		const books = await this.gets({ isbns: [options.isbn] });
		return books.get(options.isbn.toUpperCase());
	}
}
