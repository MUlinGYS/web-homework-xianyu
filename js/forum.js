// 给登录按钮添加点击事件监听器
document.getElementById('login-btn').addEventListener('click', function () {
    // 获取输入框中的用户名
    const username = document.getElementById('username').value;

    // 发起 HTTP 请求检查用户名是否存在
    fetch('http://localhost:7777/api/users')
        // 将响应体中的 JSON 数据解析为 JavaScript 对象
        .then(response => response.json())
        .then(data => {
            // 查找与输入用户名匹配的用户对象
            const user = data.find(user => user.username === username);

            if (user) {
                // 更新浏览器历史记录
                history.pushState({ username: user.username }, 'Index Page', `?username=${encodeURIComponent(user.username)}`);

                // 显示内容并隐藏登录框，传入用户的全名
                showContent(user.name);
            } else {
                // 用户名不存在时提示错误
                alert('Invalid username');
            }
        })
        .catch(error => {
            // 捕获请求错误并提示
            console.error('Error fetching data:', error);
            alert('An error occurred while fetching data');
        });
});

// 显示内容并隐藏登录框
function showContent(username) {
    // 确认元素存在再设置文本
    const welcomeUsernameElement = document.getElementById('welcome-username');
    if (welcomeUsernameElement) {
        welcomeUsernameElement.textContent = username;
    }
    fetchThreadsData();

    // 显示内容框
    document.getElementById('content-box').style.display = 'block';

    // 隐藏登录框
    document.getElementById('login-box').style.display = 'none';
}

// 隐藏内容并显示登录框
function hideContent() {
    // 隐藏内容框
    document.getElementById('content-box').style.display = 'none';

    // 显示登录框
    document.getElementById('login-box').style.display = 'block';
}

// 监听浏览器历史记录的变化
window.onpopstate = function (event) {
    const state = event.state;
    if (state && state.username) {
        // 显示内容
        showContent(state.username);
    } else {
        // 隐藏内容
        hideContent();
    }
};

// 清除 URL 中的查询参数
function clearURLParams() {
    history.replaceState({}, document.title, window.location.pathname);
}

// 页面加载时处理 URL 参数
const urlParams = new URLSearchParams(window.location.search);
const usernameFromURL = urlParams.get('username');

if (usernameFromURL) {
    // 发起 HTTP 请求查找对应用户的 name
    fetch('http://localhost:7777/api/users')
        .then(response => response.json())
        .then(data => {
            // 查找与输入用户名匹配的用户对象
            const user = data.find(user => user.username === usernameFromURL);

            if (user) {
                // 显示内容
                showContent(user.name);
            } else {
                // 隐藏内容
                hideContent();
                // 清除 URL 中的查询参数
                clearURLParams();
            }
        })
} else {
    // 隐藏内容
    hideContent();
}

// 当前线程 ID
let currentThreadId;

function fetchThreadsData() {
    fetch('http://localhost:7777/api/threads')
        .then(response => response.json())
        .then(data => {
            const threadsContainer = document.getElementById('threads-container');
            threadsContainer.innerHTML = ''; // 清空现有内容

            data.forEach(thread => {
                const threadDiv = document.createElement('div');
                threadDiv.className = 'Threads-p';
                threadDiv.id = thread.id;

                const threadTitle = document.createElement('p');
                threadTitle.textContent = `${thread.icon} ${thread.thread_title}`;
                threadTitle.style.margin = '0 0 2px 0'; // 设置 p 标签的 margin

                const threadUser = document.createElement('p');
                threadUser.textContent = `By: ${thread.user}`;
                threadUser.style.margin = '0'; // 设置 p 标签的 margin

                threadDiv.appendChild(threadTitle);
                threadDiv.appendChild(threadUser);
                threadsContainer.appendChild(threadDiv);

                // 添加点击事件
                threadDiv.addEventListener('click', function () {
                    const threadId = this.id;
                    fetchThreadDetails(threadId);
                });
            });
        })
        .catch(error => {
            console.error('Error fetching threads data:', error);
            alert('An error occurred while fetching threads data');
        });
}

let timerId; // 存储计时器ID的全局变量关于帖子详情的计时

// 展开对应的帖子
function fetchThreadDetails(threadId) {
    fetch(`http://localhost:7777/api/threads/${threadId}`)
        .then(response => response.json())
        .then(data => {
            // 展示详细数据
            showThreadDetails(data);

            // 更新当前线程 ID
            currentThreadId = threadId;

            // 如果计时器已经存在，则先清除
            if (timerId) {
                clearInterval(timerId);
            }

            // 启动一个新的计时器关于帖子
            timerId = setInterval(function () {
                fetchThreadDetails(currentThreadId);
            }, 10000);
        })
}

let canDelete; // 存储用户是否有权限删除帖子的标志

// 显示详细数据
function showThreadDetails(data) {
    // 显示详细数据
    // 标题
    document.getElementById('thread-title').textContent = `${data.icon} ${data.thread_title}`;
    // 用户
    document.getElementById('thread-user').textContent = `By: ${data.user}`;

    //标题旁是否展示按钮的判断
    const threadUserElement = document.getElementById('thread-user');
    const deleteThreadBtn = document.getElementById('delete-thread-btn');

    canDelete = data.user === window.globalUsername; // 设置 canDelete 标志
    if (canDelete) {
        deleteThreadBtn.style.display = 'inline'; // 显示按钮
    } else {
        deleteThreadBtn.style.display = 'none'; // 隐藏按钮
    }

    const threadPosts = document.getElementById('thread-posts');
    threadPosts.innerHTML = ''; // 清空现有内容

    function shouldShowDeleteImage(postUser) {
        // 检查当前帖子的作者是否与全局用户名相匹配
        return postUser === window.globalUsername;
    }


    data.posts.forEach(post => {
        const postItem = document.createElement('li');
        const deleteImageHtml = shouldShowDeleteImage(post.user) ? `
            <img src="./img/delete.png" alt="Delete" class="delete-image" style="margin-top: -2px;">
            ` : ``; // 如果条件满足，则显示删除图标
        postItem.innerHTML = `
            <div style="display: flex;justify-content: space-between;width: 100%;">
                <div style="display: flex; align-items: center;">
                    <img src="./img/recommend.png" alt="Recommend" class="post-image">
                    <span class="post-text">${post.text}</span>
                </div>
                <span class="post-user">- ${post.user}</span>
            </div>
            <div style="width: 50px;height: 26px;">
            <button class="delete-post-btn">${deleteImageHtml}</button>
            </div>
        `;
        threadPosts.appendChild(postItem);
    });

    // 显示弹出窗口并添加 .details-show 类
    document.getElementById('thread-details').classList.add('details-show');
}

// 删除帖子按钮
// 删除按钮点击事件
document.getElementById('delete-thread-btn').addEventListener('click', function () {
    if (canDelete) {
        // 获取当前线程的ID
        const threadId = currentThreadId; // 确保有一个变量存储当前线程的ID

        // 构造请求体
        const requestBody = {
            user: window.globalUsername // 使用全局变量中的用户名
        };

        // 发送DELETE请求到服务器
        fetch(`http://localhost:7777/api/threads/${threadId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody) // 将请求体转换为JSON字符串
        })
            .then(response => {
                if (response.ok) {
                    console.log('Thread deleted successfully');
                    // 刷新线程列表
                    fetchThreadsData();
                    // 隐藏详情帖子
                    document.getElementById('thread-details').classList.remove('details-show');
                }
            })
            .catch(error => {
                console.error('Error deleting thread:', error);
                alert('An error occurred while deleting the thread.');
            });
    } else {
        alert('You do not have permission to delete this thread.');
    }
});
// 关闭按钮点击事件
document.getElementById('close-button').addEventListener('click', function () {
    // 移除 .details-show 类
    document.getElementById('thread-details').classList.remove('details-show');
    // 如果计时器存在，则清除
    if (timerId) {
        clearInterval(timerId);
        timerId = null; // 重置计时器ID
    }
});

document.getElementById('Send-button').addEventListener('click', function () {
    sendReply(currentThreadId);
});

// 获取当前页面的 URL
const currentUrl = new URL(window.location.href);

// 创建 URLSearchParams 对象
const queryParams = new URLSearchParams(currentUrl.search);

// 获取 username 参数
const username = queryParams.get('username');
if (username) {
    // 存储到全局变量
    window.globalUsername = username;
}

// 当页面完全加载后执行====发布页的名称
window.onload = function () {
    // 获取从 URL 参数获取到的用户名
    const username = window.globalUsername || 'DefaultUsername';

    // 更新包含用户名的 <p> 标签的内容
    const usernameParagraph = document.querySelector('.publish p');
    if (usernameParagraph) {
        usernameParagraph.textContent = `- ${username}`;
    }
};

// 发送回复的文本
function sendReply(currentThreadId) {
    // 获取回复文本
    const replyText = document.getElementById('Send').value.trim();
    if (!replyText) {
        alert('Please enter a reply message.');
        return;
    }

    // 使用全局变量作为用户名
    const user = window.globalUsername || 'DefaultUsername';

    // 拼接 URL 并发送 POST 请求
    fetch(`http://localhost:7777/api/threads/${currentThreadId}/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: replyText,
            user: user // 使用全局变量或默认用户名
        })
    })
        .then(response => response.json())
        .then(data => {
            // 处理回复成功
            console.log('Reply sent successfully:', data);

            // 清空输入框
            document.getElementById('Send').value = '';

            // 刷新帖子列表
            fetchThreadDetails(currentThreadId);
        })
        .catch(error => {
            // 处理错误情况
            console.error('Error sending reply:', error);
            alert('An error occurred while sending your reply.');
        });
}

// 发布按钮和取消按钮
// 获取发布按钮和关闭按钮的 DOM 元素
const publishBtn = document.querySelector('.publish-btn-blue');
const closeButton = document.getElementById('close-publish-button');
const publishDiv = document.getElementById('publish');

// 发布按钮点击事件
publishBtn.addEventListener('click', function () {
    // 设置发布页的 display 为 block 来显示它
    publishDiv.style.display = 'block';
});

// 关闭按钮点击事件
closeButton.addEventListener('click', function () {
    // 设置发布页的 display 为 none 来隐藏它
    publishDiv.style.display = 'none';
});


//发布逻辑
document.getElementById('publish-button').addEventListener('click', function () {
    // 获取输入框中的值
    const iconInput = document.querySelector('input[placeholder="Icon"]');
    const threadTitleInput = document.querySelector('input[placeholder="thread_title"]');
    const textInput = document.querySelector('textarea[placeholder="text"]');
    const username = window.globalUsername;

    // 构造请求体
    const requestBody = {
        user: username,
        thread_title: threadTitleInput.value,
        icon: iconInput.value,
        text: textInput.value
    };

    // 发送 POST 请求
    fetch('http://localhost:7777/api/threads', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Network response was not ok.');
            }
        })
        .then(data => {
            // 刷新帖子列表
            fetchThreadsData();
            // 清空发布页的输入框
            iconInput.value = '';
            threadTitleInput.value = '';
            textInput.value = '';
            // 关闭发布页
            const publishDiv = document.getElementById('publish');
            publishDiv.style.display = 'none';
        })
        .catch(error => {
            console.error('Error creating thread:', error);
            alert('An error occurred while creating the thread.');
        });
});


//Thread返回的数据每十秒刷新
function updateThreads() {
    fetchThreadsData();
}

// 页面加载完成后设置定时器
window.onload = function () {
    // 每10秒更新线程列表
    setInterval(updateThreads, 10000);
};

document.getElementById('icon-input').addEventListener('input', function (e) {
    // e.target是事件对象的一个属性，它指向触发事件的元素
    const inputField = e.target;
    // 检查输入的字符长度
    if (inputField.value.length > 2) {
        alert('Please enter only one character or emoji.');
        inputField.value = inputField.value.slice(0, 2); // 限制为两个个字符（一个emoji）
    }
});