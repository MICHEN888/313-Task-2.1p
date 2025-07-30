function sendResponse(res, httpStatus, code, message, data = {}) {
    res.writeHead(httpStatus, {
        'Content-Type': 'application/json; charset=utf-8'
    });

    res.end(JSON.stringify({
        code,
        message,
        data
    }));
}

const RESPONSE_CODES = {
    SUCCESS: 1000,
    NOT_LOGIN: 1001,
    INVALID_TOKEN: 1002,
    PARAM_ERROR: 1003,
    SYSTEM_ERROR: 1099
};

module.exports = {
    sendResponse,
    RESPONSE_CODES
};