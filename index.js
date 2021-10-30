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

app.get('/leaflet.css', function (req, res) {
	res.sendFile(path.join(__dirname, './leaflet/leaflet.css'));
});

app.get('/leaflet.js', function (req, res) {
	res.sendFile(path.join(__dirname, './leaflet/leaflet.js'));
});

app.get('/images/:image', function (req, res) {
	const image = req.params.image
	res.sendFile(path.join(__dirname, './leaflet/images/'+image));
});

app.get('/favicon.ico', function (req, res) {
	res.sendFile(path.join(__dirname, './favicon.ico'));
});


let last5Users = []
app.post('/location', (req, res) => {
	if(!req.oidc.user) return res.status(200).json(null)
	const mail = req?.oidc?.user.email
	if(mail) {
		const index = last5Users.findIndex(user=> user.mail === mail)
		if(index !== -1) last5Users.splice(index, 1)
		const jitter = Math.random()*0.0005*(Math.random > 0.5 ? 1 : -1) // dodan jitter kako bi se vidjeli preklapajući markeri s istog kompjutera
		const position = {longitude: jitter+req.body.longitude, latitude: jitter+req.body.latitude}
		last5Users.push({date: new Date(), position, mail, name: req.oidc.user.name})
	}
	while(last5Users.length > 5) last5Users.shift()
	res.status(200).json({me:req.oidc.user, list: last5Users})
});

app.set('trust proxy', true);
app.use((err, req, res, next) => {
	if (res.statusCode.toString().match(/^2.{2}$/)) {
		res.status(500);
	}
	res.send(err.message);
});

console.log("Server started at: 3000")