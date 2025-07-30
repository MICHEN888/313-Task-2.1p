function Ajax(options) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const method = options.method || 'GET';
        let url = options.url;

        if (method === 'GET' && options.data) {
            const params = new URLSearchParams(options.data);
            url += '?' + params.toString();
        }

        xhr.open(method, url, true);

        xhr.setRequestHeader('Content-Type', 'application/json');

        const token = localStorage.getItem('authToken');
        if (token) {
            console.log(token);
            xhr.setRequestHeader('Authorization', token);
        }

        if (options.headers) {
            for (const [key, value] of Object.entries(options.headers)) {
                xhr.setRequestHeader(key, value);
            }
        }

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (e) {
                    resolve(xhr.responseText);
                }
            } else {
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    reject({
                        status: xhr.status,
                        data: xhr.data,
                        message: errorResponse.message || 'Request failed'
                    });
                } catch (e) {
                    reject({
                        status: xhr.status,
                        data: xhr.data,
                        message: xhr.statusText
                    });
                }
            }
        };

        xhr.onerror = function () {
            reject({
                status: 0,
                message: 'Network error'
            });
        };

        if (method === 'POST' || method === 'PUT') {
            xhr.send(JSON.stringify(options.data));
        } else {
            xhr.send();
        }
    })
}

window.onload = async function () {
    await initForum();
    setupEventListeners();
}

const API_BASE = 'http://localhost:3000/api';
const POSTS_ENDPOINT = `${API_BASE}/getAll`;
const REPLY_ENDPOINT = `${API_BASE}/postReply`;
const NEW_POST_ENDPOINT = `${API_BASE}/postForum`;

function getCurrentAccount() {
    return localStorage.getItem('account') || 'Guest';
}

async function initForum() {
    try {
        // Check if user is logged in
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = "../html/Login.html";
            return;
        }

        // Load forum posts
        const response = await Ajax({
            method: 'GET',
            url: POSTS_ENDPOINT
        });

        if (response.code === 1000) {
            renderPosts(response.data.posts);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Forum initialization error:', error);
        alert('Failed to load forum data. Please try again later.');
    }
}

function renderPosts(posts) {
    const postsContainer = document.querySelector('.posts-container');

    // Clear existing content
    postsContainer.innerHTML = '';

    if (!posts || posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="no-posts">
                <i class="fas fa-comment-slash"></i>
                <h3>No posts yet</h3>
                <p>Be the first to start a discussion!</p>
                <button id="createFirstPost" class="submit-btn">Create First Post</button>
            </div>
        `;
        return;
    }

    // Render each post
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post-card';
        postElement.dataset.postId = post.id;

        postElement.innerHTML = `
            <div class="post-header">
                <div class="user-avatar">${post.account.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="post-user">${post.account}</div>
                </div>
            </div>
            
            <div class="post-content">
                <p>${post.message}</p>
            </div>
            
            <div class="replies-section">
                <h3 class="section-title"><i class="fas fa-reply"></i> Replies (${post.replies.length})</h3>
                ${renderReplies(post.replies)}
            </div>
            
            <div class="reply-form">
                <h3><i class="fas fa-pen"></i> Add Your Reply</h3>
                <form class="reply-form-element">
                    <div class="form-group">
                        <textarea class="form-control" placeholder="Type your reply here..." required></textarea>
                    </div>
                    <button type="submit" class="submit-btn">Post Reply</button>
                </form>
            </div>
        `;

        postsContainer.appendChild(postElement);
    });
}

function renderReplies(replies) {
    if (replies.length === 0) {
        return '<p class="no-replies">No replies yet. Be the first to reply!</p>';
    }

    return replies.map(reply => {
        return `
        <div class="reply-card">
            <div class="reply-header">
                <div class="reply-user">${reply.account}</div>
            </div>
            <div class="reply-content">
                ${reply.message}
            </div>
        </div>
        `;
    }).join('');
}

function setupEventListeners() {
    document.addEventListener('submit', async function (e) {
        if (e.target.classList.contains('reply-form-element')) {
            e.preventDefault();
            const form = e.target;
            const textarea = form.querySelector('textarea');
            const message = textarea.value.trim();
            const postCard = form.closest('.post-card');
            const postId = postCard.dataset.postId;

            if (!message) {
                alert('Please enter a reply message');
                return;
            }

            try {
                form.querySelector('.submit-btn').disabled = true;
                form.querySelector('.submit-btn').textContent = 'Posting...';

                await Ajax({
                    method: 'POST',
                    url: REPLY_ENDPOINT,
                    data: {
                        postId: postId,
                        account: getCurrentAccount(),
                        message: message
                    }
                });

                await initForum();
                textarea.value = '';
            } catch (error) {
                console.error('Error posting reply:', error);
                alert('Failed to post reply: ' + (error.message || 'Please try again later'));
            } finally {
                form.querySelector('.submit-btn').disabled = false;
                form.querySelector('.submit-btn').textContent = 'Post Reply';
            }
        }
    });

    const createPostBtn = document.createElement('button');
    createPostBtn.className = 'create-post-btn';
    createPostBtn.innerHTML = '<i class="fas fa-plus"></i> Create New Post';
    document.querySelector('.forum-header').appendChild(createPostBtn);

    createPostBtn.addEventListener('click', function () {
        openNewPostModal();
    });
}

function openNewPostModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2><i class="fas fa-edit"></i> Create New Post</h2>
            <form id="newPostForm">
                <div class="form-group">
                    <textarea id="newPostContent" class="form-control" placeholder="What would you like to discuss?" required></textarea>
                </div>
                <button type="submit" class="submit-btn">Create Post</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close-modal').addEventListener('click', function () {
        modal.remove();
    });

    document.getElementById('newPostForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const textarea = document.getElementById('newPostContent');
        const message = textarea.value.trim();

        if (!message) {
            alert('Please enter post content');
            return;
        }

        const submitBtn = this.querySelector('.submit-btn');
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';

            await Ajax({
                method: 'POST',
                url: NEW_POST_ENDPOINT,
                data: {
                    account: getCurrentAccount(),
                    message: message
                }
            });

            await initForum();
            modal.remove();
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post: ' + (error.message || 'Please try again later'));
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Post';
        }
    });
}