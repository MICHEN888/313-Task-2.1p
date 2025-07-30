const userController = require('../mods/login');
const forumController = require('../mods/Forum');

module.exports = {
    '/api/login': {
        method: 'POST',
        handler: userController.login
    },
    '/api/register': {
        method: 'POST',
        handler: userController.register
    },
    '/api/getAll': {
        method: 'GET',
        handler: forumController.getAll
    },
    '/api/postForum': {
        method: 'POST',
        handler: forumController.postForum
    },
    '/api/postReply': {
        method: 'POST',
        handler: forumController.postReply
    },
};