import path from 'path';
import dotenv from 'dotenv';
dotenv.config({
	path: '.env',
});
import express from 'express';
const app = express();

import cookieParser from 'cookie-parser';
app.use(cookieParser());
app.use(express.json());
import { createServer } from 'http';
const server = createServer(app);
export { server, app };
server.listen(process.env.PORT);

import { auth } from 'express-openid-connect';

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.secret,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

const __dirname = path.resolve();
app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, './home.html'));
});

app.get('/leaflet/*', function (req, res) {
	res.sendFile(path.join(__dirname, req.url));
});

app.get('/favicon.ico', function (req, res) {
	res.sendFile(path.join(__dirname, './favicon.ico'));
});

let last5 = []
app.post('/location', (req, res) => {
	if(!req.oidc.user) return res.status(200).json(null)
	const mail = req.oidc.user.email ?? null
	if(mail) { // ako mail postoji korisnik je prijavljen
		const index = last5.findIndex(user=> user.mail === mail)
		if(index !== -1) last5.splice(index, 1)
		const jitter1 = Math.random()*0.0005*(Math.random > 0.5 ? 1 : -1) // dodan jitter kako bi se vidjeli preklapajući markeri s istog kompjutera
		const jitter2 = Math.random()*0.0005*(Math.random > 0.5 ? 1 : -1)
		const position = {longitude: jitter1+req.body.longitude, latitude: jitter2+req.body.latitude}
		last5.push({date: new Date(), position, mail, name: req.oidc.user.name})
	}
	while(last5.length > 5) last5.shift()
	res.status(200).json({me:req.oidc.user, list: last5})
});
