const http = require("http");
const config = require("../utils/config");
const url = require("url");
const routes = require("../router");
const { connectDB, getCollection } = require("../utils/db");
const { sendResponse, RESPONSE_CODES } = require("../utils/response");

connectDB();

const corsMiddleware = (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Expose-Headers', 'Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204); // No Content
        res.end();
        return;
    }

    next();
}

const authMiddleware = async (req, res, next) => {

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    const whitelist = ['/api/login', '/api/register'];

    if (whitelist.includes(pathname)) {
        return next();
    }

    const token = req.headers["authorization"];
    if (!token) {
        return sendResponse(res, 401, RESPONSE_CODES.NOT_LOGIN, "Please log in first");
    }

    const checkToken = await getCollection(config.db_collection.users);
    const user = checkToken.findOne({
        id: token
    })
    if (user) {
        req.user = { id: user.id, name: user.name };
        next();
    } else {
        return sendResponse(res, 401, RESPONSE_CODES.NOT_LOGIN, "Please log in first");
    }

}

const server = http.createServer((req, res) => {
    corsMiddleware(req, res, () => {
        const parsedUrl = url.parse(req.url, true);
        req.pathname = parsedUrl.pathname;
        req.query = parsedUrl.query;
        authMiddleware(req, res, async () => {
            const method = req.method.toUpperCase();

            const route = Object.entries(routes).find(([path, config]) => {
                if (path === req.pathname && config.method === method) return true;
                return false;
            })

            if (route) {
                const [path, routeConfig] = route;
                await routeConfig.handler(req, res);
            } else {
                sendResponse(res, 404, RESPONSE_CODES.RESOURCE_NOT_FOUND, '404');
            }
        })
    })
})

server.listen(config.port, () => {
    console.log(`The server is running at http://localhost:${config.port}`);
    console.log(`Press Ctrl+C to stop the service`);
})