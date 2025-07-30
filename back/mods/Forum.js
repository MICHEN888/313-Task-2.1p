const { ObjectId } = require("mongodb");
const config = require("../utils/config");
const { getCollection } = require("../utils/db");
const { sendResponse, RESPONSE_CODES } = require("../utils/response");

const forumController = {
    getAll: async (req, res) => {
        const postsCollection = await getCollection(config.db_collection.posts);
        const posts = await postsCollection.find().toArray();

        const formattedPosts = posts.map(post => {
            return {
                id: post._id.toString(),
                account: post.account,
                message: post.message,
                replies: post.reply || []
            };
        });

        sendResponse(res, 200, RESPONSE_CODES.SUCCESS, 'Posts retrieved', {
            posts: formattedPosts
        });
    },
    postReply: async (req, res) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const { postId, account, message } = JSON.parse(body);

            if (!account || !message) {
                return sendResponse(res, 400, RESPONSE_CODES.PARAM_ERROR, 'Account and message are required');
            }

            const postsCollection = await getCollection(config.db_collection.posts);

            const result = await postsCollection.updateOne(
                { _id: new ObjectId(postId) },
                {
                    $push: {
                        reply: {
                            account: account,
                            message: message
                        }
                    }
                }
            );

            if (result.modifiedCount === 1) {
                sendResponse(res, 200, RESPONSE_CODES.SUCCESS, 'Reply added successfully');
            } else {
                sendResponse(res, 404, RESPONSE_CODES.NOT_FOUND, 'Post not found');
            }
        });
    },
    postForum: async (req, res) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const { account, message } = JSON.parse(body);

            if (!account || !message) {
                return sendResponse(res, 400, RESPONSE_CODES.PARAM_ERROR, 'Account and message are required');
            }

            const postsCollection = await getCollection(config.db_collection.posts);

            const newPost = {
                account: account,
                message: message,
                reply: []
            };

            const result = await postsCollection.insertOne(newPost);

            sendResponse(res, 201, RESPONSE_CODES.SUCCESS, 'Post created successfully', {
                postId: result.insertedId
            });
        });
    }
};

module.exports = forumController;
