import { config as configEnv } from 'dotenv';

// import FirstFoundProvider from './src/providers/FirstFoundProvider';
import CompleteMissingInformationsProvider from '../src/providers/CompleteMissingInformationsProvider';
import GoogleBooksProvider from '../src/providers/GoogleBooksProvider';
import OpenLibraryProvider from '../src/providers/OpenLibraryProvider';
import ISBNSearchProvider from '../src/providers/ISBNSearchProvider';
import JustBookProvider from '../src/providers/JustBookProvider';

configEnv();

if (!process.env.GOOGLE_BOOKS_API_KEY) {
	throw new Error('No book api key');
}

const provider = new CompleteMissingInformationsProvider({
	providers: [
		//new OpenLibraryProvider(),
		//new GoogleBooksProvider(process.env.GOOGLE_BOOKS_API_KEY),
		new JustBookProvider()
	],
});

provider
	.gets({
		isbns: [
			'9782016252109'
			/* '9782809481426',
			'0201558025',
			'9781491904152',
			'9782016252109',
			'9782746052949',
			'9782263154355',
			'9782706118852' */
		],
	})
	.then(data => console.log(data.get('9782016252109')))
	.catch(e => console.error(e));
