const config = require("../utils/config");
const { getCollection } = require("../utils/db");
const { sendResponse, RESPONSE_CODES } = require("../utils/response");
const { sendWelcomeEmail } = require("../utils/mailer");

const loginController = {
    login: async (req, res) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const { account, password } = JSON.parse(body);
            const usersCollection = await getCollection(config.db_collection.users);

            const user = await usersCollection.findOne({
                account: account,
                password: password
            });

            if (user) {
                sendResponse(res, 200, RESPONSE_CODES.SUCCESS, 'Login success', {
                    user: {
                        id: user.id,
                        username: user.name,
                    },
                    token: user.id
                });
            } else {
                sendResponse(res, 401, RESPONSE_CODES.NOT_LOGIN, 'The username or password is incorrect');
            }
        });
    },
    register: async (req, res) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const userData = JSON.parse(body);
            const usersCollection = await getCollection(config.db_collection.users);

            const existingUser = await usersCollection.findOne({
                $or: [
                    { account: userData.account },
                    { email: userData.email }
                ]
            });

            if (existingUser) {
                if (existingUser.account === userData.account) {
                    return sendResponse(res, 400, RESPONSE_CODES.PARAM_ERROR, 'The account already exists.');
                } else {
                    return sendResponse(res, 400, RESPONSE_CODES.PARAM_ERROR, 'The email is already in use.');
                }
            }

            try {
                await sendWelcomeEmail(userData.email, userData.account);

                const newUser = {
                    ...userData,
                    isVerified: true
                };

                const result = await usersCollection.insertOne(newUser);
                sendResponse(res, 201, RESPONSE_CODES.SUCCESS, 'Registration successful.', {
                    userId: result.insertedId
                });
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                sendResponse(res, 500, RESPONSE_CODES.SERVER_ERROR, 'Registration completed but email sending failed');
            }
        });
    }
}

module.exports = loginController;