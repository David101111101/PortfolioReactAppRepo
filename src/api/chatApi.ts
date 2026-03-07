//public HTTP endpoints
const CHAT_API_URL = import.meta.env.VITE_API_BASE_URL;
export async function sendChatQuestion(question: string) {
    console.log(CHAT_API_URL);
  return fetch(CHAT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });
}