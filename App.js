```javascript
"use strict";

/*
    IMPORTANT:

    Change this URL to the address of your Node.js server.

    Example:
    const SERVER_URL = "https://your-server.example.com";
*/

const SERVER_URL = "https://YOUR-BACKEND-URL-HERE";

let socket = null;
let username = "";
let currentChannel = "general";

/* Elements */

const usernameScreen =
    document.getElementById("usernameScreen");

const usernameInput =
    document.getElementById("usernameInput");

const usernameError =
    document.getElementById("usernameError");

const joinButton =
    document.getElementById("joinButton");

const app =
    document.getElementById("app");

const myUsername =
    document.getElementById("myUsername");

const myAvatar =
    document.getElementById("myAvatar");

const messages =
    document.getElementById("messages");

const messageForm =
    document.getElementById("messageForm");

const messageInput =
    document.getElementById("messageInput");

const memberList =
    document.getElementById("memberList");

const onlineCount =
    document.getElementById("onlineCount");

const channelName =
    document.getElementById("channelName");

const connectionDot =
    document.getElementById("connectionDot");

const connectionText =
    document.getElementById("connectionText");

/* Join */

joinButton.addEventListener(
    "click",
    joinChat
);

usernameInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {
            joinChat();
        }

    }
);

function joinChat() {

    const value =
        usernameInput.value.trim();

    if (!/^[a-zA-Z0-9_ -]{2,20}$/.test(value)) {

        usernameError.textContent =
            "Username must be 2–20 characters.";

        return;
    }

    usernameError.textContent = "";

    username = value;

    myUsername.textContent = username;

    myAvatar.textContent =
        username.charAt(0).toUpperCase();

    usernameScreen.classList.add("hidden");
    app.classList.remove("hidden");

    connect();
}

/* Connect */

function connect() {

    if (
        SERVER_URL.includes(
            "YOUR-BACKEND-URL-HERE"
        )
    ) {

        setConnection(
            false,
            "Backend not configured"
        );

        addSystemMessage(
            "The chat backend has not been configured yet."
        );

        return;
    }

    socket = io(
        SERVER_URL,
        {
            transports: ["websocket", "polling"]
        }
    );

    socket.on(
        "connect",
        function () {

            setConnection(
                true,
                "Connected"
            );

            socket.emit(
                "join",
                {
                    username: username,
                    channel: currentChannel
                }
            );

        }
    );

    socket.on(
        "disconnect",
        function () {

            setConnection(
                false,
                "Disconnected"
            );
        }
    );

    socket.on(
        "connect_error",
        function () {

            setConnection(
                false,
                "Connection failed"
            );
        }
    );

    socket.on(
        "chatHistory",
        function (history) {

            messages.innerHTML = "";

            history.forEach(
                addMessage
            );
        }
    );

    socket.on(
        "message",
        function (message) {

            addMessage(message);
        }
    );

    socket.on(
        "system",
        function (text) {

            addSystemMessage(text);
        }
    );

    socket.on(
        "users",
        function (users) {

            updateMembers(users);
        }
    );

    socket.on(
        "errorMessage",
        function (text) {

            addSystemMessage(
                "⚠ " + text
            );
        }
    );
}

/* Connection indicator */

function setConnection(
    online,
    text
) {

    connectionText.textContent =
        text;

    connectionDot.classList.toggle(
        "online",
        online
    );
}

/* Sending */

messageForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const text =
            messageInput.value.trim();

        if (!text) {
            return;
        }

        if (!socket || !socket.connected) {

            addSystemMessage(
                "You are not connected."
            );

            return;
        }

        socket.emit(
            "sendMessage",
            {
                text: text,
                channel: currentChannel
            }
        );

        messageInput.value = "";

        messageInput.focus();
    }
);

/* Add message */

function addMessage(message) {

    if (
        !message ||
        message.channel !== currentChannel
    ) {
        return;
    }

    const wrapper =
        document.createElement("div");

    wrapper.className = "message";

    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar";

    avatar.textContent =
        String(
            message.username || "?"
        )
        .charAt(0)
        .toUpperCase();

    const content =
        document.createElement("div");

    content.className =
        "message-content";

    const top =
        document.createElement("div");

    top.className =
        "message-top";

    const name =
        document.createElement("span");

    name.className =
        "message-username";

    name.textContent =
        message.username;

    const time =
        document.createElement("span");

    time.className =
        "message-time";

    time.textContent =
        formatTime(message.timestamp);

    const text =
        document.createElement("div");

    text.className =
        "message-text";

    /*
        textContent is intentionally used instead
        of innerHTML so users cannot inject HTML.
    */

    text.textContent =
        message.text;

    top.appendChild(name);
    top.appendChild(time);

    content.appendChild(top);
    content.appendChild(text);

    wrapper.appendChild(avatar);
    wrapper.appendChild(content);

    messages.appendChild(wrapper);

    messages.scrollTop =
        messages.scrollHeight;
}

/* System message */

function addSystemMessage(text) {

    const element =
        document.createElement("div");

    element.className =
        "system-message";

    element.textContent =
        text;

    messages.appendChild(element);

    messages.scrollTop =
        messages.scrollHeight;
}

/* Time */

function formatTime(timestamp) {

    if (!timestamp) {
        return "";
    }

    return new Date(timestamp)
        .toLocaleTimeString(
            [],
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );
}

/* Members */

function updateMembers(users) {

    memberList.innerHTML = "";

    onlineCount.textContent =
        users.length;

    users.forEach(
        function (user) {

            const row =
                document.createElement("div");

            row.className =
                "member";

            const avatar =
                document.createElement("div");

            avatar.className =
                "member-avatar";

            avatar.textContent =
                String(user)
                    .charAt(0)
                    .toUpperCase();

            const name =
                document.createElement("div");

            name.className =
                "member-name";

            name.textContent =
                user;

            row.appendChild(avatar);
            row.appendChild(name);

            memberList.appendChild(row);
        }
    );
}

/* Channels */

document
    .querySelectorAll(".channel")
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const channel =
                        button.dataset.channel;

                    switchChannel(channel);
                }
            );
        }
    );

function switchChannel(channel) {

    if (
        channel === currentChannel
    ) {
        return;
    }

    currentChannel =
        channel;

    channelName.textContent =
        channel;

    messageInput.placeholder =
        "Message #" + channel;

    document
        .querySelectorAll(".channel")
        .forEach(
            function (button) {

                button.classList.toggle(
                    "active",
                    button.dataset.channel === channel
                );
            }
        );

    messages.innerHTML = "";

    if (socket && socket.connected) {

        socket.emit(
            "switchChannel",
            {
                channel: channel
            }
        );
    }
}

/* Change username */

document
    .getElementById("changeUsername")
    .addEventListener(
        "click",
        function () {

            const newName =
                prompt(
                    "Choose a new username:",
                    username
                );

            if (!newName) {
                return;
            }

            if (
                !/^[a-zA-Z0-9_ -]{2,20}$/
                    .test(newName.trim())
            ) {

                alert(
                    "Username must be 2–20 characters."
                );

                return;
            }

            username =
                newName.trim();

            myUsername.textContent =
                username;

            myAvatar.textContent =
                username
                    .charAt(0)
                    .toUpperCase();

            if (socket && socket.connected) {

                socket.emit(
                    "changeUsername",
                    {
                        username: username
                    }
                );
            }
        }
    );
```
