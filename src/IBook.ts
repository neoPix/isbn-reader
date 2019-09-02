export interface IBookIdentifiers {
	isbn13?: string[];
	isbn10?: string[];
	oclc?: string[];
	lccn?: string[];
}

export enum BookProvider {
	OpenLibrary = 'OpenLibrary',
	GoogleBooks = 'GoogleBooks'
}

export default interface IBook {
	provider: BookProvider;
	identifiers: IBookIdentifiers;
	title: string;
	subtitle?: string;
	notes?: string;
	pages: number;
	publishDate: Date | string;
	authors: string[];
	subjects: string[];
}
