export interface IBookIdentifiers {
	isbn13?: string[];
	isbn10?: string[];
	oclc?: string[];
	lccn?: string[];
}

export enum BookProvider {
	OpenLibrary = 'OpenLibrary',
	GoogleBooks = 'GoogleBooks',
	ISBNSEARCH = 'ISBNSearch',
	JUSTBOOK = 'JustBook',
}

export default interface IBook {
	sources: BookProvider[];
	identifiers: IBookIdentifiers;
	title: string;
	subtitle?: string;
	notes?: string;
	description?: string;
	pages: number;
	publishDate?: Date | string;
	editors?: string[];
	publishers?: string[];
	authors: string[];
	subjects: string[];
}
