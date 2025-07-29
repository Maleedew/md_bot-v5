const API_KEY = "AIzaSyA1uhX9Hytf7BktmV3dqt7EzbZ0HQ3Ycfs";
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");

function showMessage(text, sender, isImageOrVideo = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;

  if (isImageOrVideo && sender === "bot") {
    if (text.endsWith(".mp4")) {
      messageDiv.innerHTML = `<video controls width="100%"><source src="${text}" type="video/mp4">Your browser does not support video.</video>`;
    } else {
      messageDiv.innerHTML = `<img src="${text}" alt="Generated Media" style="max-width:100%; border-radius:10px;" />`;
    }
  } else {
    messageDiv.innerText = text;
  }

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage(message) {
  showMessage(message, "user");

  // Typing animation
  const typingDiv = document.createElement("div");
  typingDiv.className = "message bot";
  typingDiv.innerText = "✍️ Bot is typing...";
  typingDiv.id = "typing";
  chatBox.appendChild(typingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: message,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    let reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "😓 Sorry, no response.";

    // Remove typing animation
    document.getElementById("typing").remove();

    // Check for image/video prompts
    if (reply.startsWith("https://") && (reply.endsWith(".jpg") || reply.endsWith(".png") || reply.endsWith(".mp4"))) {
      showMessage(reply, "bot", true);
    } else {
      showMessage(reply, "bot");
    }
  } catch (err) {
    document.getElementById("typing")?.remove();
    showMessage("😓 Error contacting Gemini API!", "bot");
    console.error(err);
  }
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (message) {
    sendMessage(message);
    userInput.value = "";
  }
});
