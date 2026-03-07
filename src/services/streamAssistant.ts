export async function streamAssistantResponse(
  response: Response,
  onChunk: (text: string) => void
) {

  if (!response.body) throw new Error("Streaming not supported");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value);
    const words = buffer.split(" ");
    // keep last incomplete word in buffer
    buffer = words.pop() || "";
      if (words.length > 0) {
      onChunk(words.join(" ") + " ");
      await new Promise(r => setTimeout(r, 15));
      }
  }
  if (buffer) onChunk(buffer);
}