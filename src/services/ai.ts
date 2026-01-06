const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function summarizeText(content: string): Promise<string> {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "Summarize the following webpage content briefly."
          },
          {
            role: "user",
            content
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      }),
    }
  );

  const data = await response.json();
  return data.choices[0].message.content;
}
export async function fetchWithRetry(url: string, retries = 2): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === retries - 1) throw err;
    }
  }
  throw new Error("Failed after retries");
}
