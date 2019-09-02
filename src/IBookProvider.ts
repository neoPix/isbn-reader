import IBook from './IBook';

export interface IBookProviderGetISBN {
	isbn: string;
}

export type IBookProviderGet = IBookProviderGetISBN;

export interface IBookProviderGets {
	isbns?: string[];
}

export default interface IBookProvider {
	gets(options: IBookProviderGets): Promise<Map<string, IBook | undefined>>;
	get(options: IBookProviderGet): Promise<IBook | undefined>;
}
