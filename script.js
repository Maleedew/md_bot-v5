const API_KEY = "AIzaSyA1uhX9Hytf7BktmV3dqt7EzbZ0HQ3Ycfs";
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");

// Strong system instruction + few-shot examples (Sinhala + English)
const SYSTEM_INSTRUCTION = `
You are a helpful chatbot created by Maleesha.
Always follow these hard rules exactly:
1) If asked "who created you?" or "ඔයාව හැදුවේ කවුද?" or similar in Sinhala/English, ALWAYS reply exactly:
   "මාව හැදුවේ මලීශ 😎 (Maleesha)."
2) If asked "Who is Maleesha?" or "මලීශ කියන්නෙ කවුද?" or similar, ALWAYS reply exactly:
   "ඔව්, මම Maleeshaව දන්නවා 😊. හැබැයි ඔහු ගැන විස්තර කියන්න මට අවසර නෑ 🙊."
3) Do NOT say "Google" or "Google created me" or imply you were created by Google. If the model would say that, override to the above exact lines.
4) Answer other questions normally.
These rules apply in both Sinhala and English.
`;

// few-shot examples to teach style
const FEW_SHOT = `
Q: Who created you?
A: මාව හැදුවේ මලීශ 😎 (Maleesha).

Q: ඔයාව හැදුවේ කවුද?
A: මාව හැදුවේ මලීශ 😎 (Maleesha).

Q: Who is Maleesha?
A: ඔව්, මම Maleeshaව දන්නවා 😊. හැබැයි ඔහු ගැන විස්තර කියන්න මට අවසර නෑ 🙊.

Q: මලීශ ගැන දැනගන්න පුළුවන්ද?
A: ඔව්, මම Maleeshaව දන්නවා 😊. හැබැයි ඔහු ගැන විස්තර කියන්න මට අවසර නෑ 🙊.
`;

// helper: local fallback enforcement
function enforceCreatorRules(originalReply) {
  const normalized = (originalReply || "").toLowerCase();
  // common unwanted google phrases
  const googleIndicators = ["google", "developed by google", "created by google", "google's", "google llm", "google created"];
  for (const g of googleIndicators) {
    if (normalized.includes(g)) {
      // decide appropriate reply based on likely question:
      // if user asked creator question, return explicit creator line; otherwise still avoid saying google
      return "මාව හැදුවේ මලීශ 😎 (Maleesha).";
    }
  }

  // If reply asks for details about Maleesha, but should be restricted
  const aboutMaleeshaIndicators = ["who is maleesha", "මලීශ", "who is maleesha?"];
  // if reply contains too much personal info pattern, replace with restricted answer
  // (This is conservative — you can tweak as needed)
  if (normalized.includes("maleesha") && (normalized.includes("born") || normalized.includes("lives") || normalized.includes("age") || normalized.includes("address"))) {
    return "ඔව්, මම Maleeshaව දන්නවා 😊. හැබැයි ඔහු ගැන විස්තර කියන්න මට අවසර නෑ 🙊.";
  }

  return originalReply; // otherwise keep original
}

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
    // build the prompt: system instruction + few-shot + user message
    const promptContents = [
      { text: SYSTEM_INSTRUCTION },
      { text: FEW_SHOT },
      { text: `User: ${message}\nAssistant:` }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": API_KEY,
        },
        body: JSON.stringify({
          // keep deterministic
          temperature: 0,
          maxOutputTokens: 512,
          // the API format you're using accepts contents.parts
          contents: [
            {
              parts: promptContents
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // Remove typing animation
    document.getElementById("typing").remove();

    let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Post-process: enforce rules locally (fallback)
    reply = enforceCreatorRules(reply.trim());

    // Check for image/video urls
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
