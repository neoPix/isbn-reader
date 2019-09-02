import { config as configEnv } from 'dotenv';
import GoogleBooksProvider from './src/GoogleBooksProvider';

configEnv();

if (!process.env.GOOGLE_BOOKS_API_KEY) {
	throw new Error('No book api key');
}
console.log({ a: process.env.GOOGLE_BOOKS_API_KEY });
const provider = new GoogleBooksProvider(process.env.GOOGLE_BOOKS_API_KEY);

provider
	.gets({
		isbns: [
			'0201558025',
			'9781491904152',
			'9782016252109',
			'9782263154355',
			'9782746052949',
		],
	})
	.then(data => console.log(data))
	.catch(e => console.error(e.response));
