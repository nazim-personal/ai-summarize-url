import { useState, type JSX } from "react";
import Loader from "./components/Loader";
import { fetchWithRetry, summarizeText } from "./services/ai";

const App = (): JSX.Element => {
  const [url, setUrl] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Validate URL format
  const isValidUrl = (urlString: string): boolean => {
    if (!urlString.trim()) return false;

    try {
      const urlObj = new URL(urlString);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Format summary text to HTML for better display
  const formatSummary = (text: string): string => {
    let formatted = text;

    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Split into lines for processing
    const lines = formatted.split('\n');
    let inList = false;
    let listType: 'ul' | 'ol' | null = null;
    const processedLines: string[] = [];
    let firstParagraphDone = false;

    lines.forEach((line) => {
      const trimmed = line.trim();

      // Skip empty lines within lists
      if (trimmed === '') {
        if (inList) {
          return;
        }
        processedLines.push('');
        return;
      }

      // Check for headings (lines ending with ":")
      if (trimmed.match(/^[A-Z][^:]*:$/)) {
        if (inList) {
          processedLines.push(`</${listType}>`);
          inList = false;
          listType = null;
        }
        processedLines.push(`<h3>${trimmed.slice(0, -1)}</h3>`);
        return;
      }

      // Check if line is a bullet point (starts with -)
      if (trimmed.startsWith('- ')) {
        if (!inList || listType !== 'ul') {
          if (inList) processedLines.push(`</${listType}>`);
          processedLines.push('<ul>');
          inList = true;
          listType = 'ul';
        }
        processedLines.push(`<li>${trimmed.substring(2)}</li>`);
        return;
      }

      // Check if line looks like a list item (starts with capital letter and ends with period)
      if (inList === false && trimmed.match(/^[A-Z].*\.$/)) {
        // This might be a list item without bullet
        if (!firstParagraphDone) {
          firstParagraphDone = true;
          processedLines.push(`<p>${trimmed}</p>`);
          return;
        }

        if (!inList) {
          processedLines.push('<ul>');
          inList = true;
          listType = 'ul';
        }
        processedLines.push(`<li>${trimmed}</li>`);
        return;
      }

      // Regular paragraph
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }

      processedLines.push(`<p>${trimmed}</p>`);
      if (!firstParagraphDone) firstParagraphDone = true;
    });

    // Close any open list
    if (inList && listType) {
      processedLines.push(`</${listType}>`);
    }

    return processedLines.join('\n');
  };

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
        disabled={loading}
      />

      <button disabled={loading || !isValidUrl(url)} onClick={handleSummarize}>
        {loading ? "Processing..." : "Summarize"}
      </button>

      {loading && <Loader />}
      {summary && (
        <div
          className="summary"
          dangerouslySetInnerHTML={{ __html: formatSummary(summary) }}
        />
      )}
    </div>
  );
};

export default App;
