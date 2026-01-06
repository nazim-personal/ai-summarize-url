import { useState, type JSX } from "react";
import Loader from "./components/Loader";
import { fetchWithRetry, summarizeText } from "./services/ai";

const App = (): JSX.Element => {
  const [url, setUrl] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSummarize = async (): Promise<void> => {
    setLoading(true);
    setSummary("");

    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        url
      )}`;

      const html: string = await fetchWithRetry(proxyUrl);
      const extractedText: string = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 4000);

      const result: string = await summarizeText(extractedText);
      setSummary(result);
    } catch {
      setSummary("Failed to summarize the provided URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>AI Website Summariser</h1>

      <input
        type="text"
        placeholder="Enter public URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button disabled={loading} onClick={handleSummarize}>Summarize</button>

      {loading && <Loader />}
      {summary && <p className="summary">{summary}</p>}
    </div>
  );
};

export default App;
