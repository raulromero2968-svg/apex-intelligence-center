"use client";

interface ResearchPanelProps {
  userText?: string;
  llmText?: string;
  title?: string;
}

/**
 * Escape HTML special characters to prevent XSS attacks
 */
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
          .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;").replace(/`/g, "&#96;");
}

export default function ResearchPanel({
  userText = "",
  llmText = "",
  title = "Research Analysis",
}: ResearchPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h2>

      {userText && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            User Input
          </h3>
          <div className="whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            {escapeHtml(userText)}
          </div>
        </div>
      )}

      {llmText && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Analysis
          </h3>
          <div className="whitespace-pre-wrap rounded bg-blue-50 p-3 text-sm text-gray-800 dark:bg-blue-900/20 dark:text-gray-200">
            {escapeHtml(llmText)}
          </div>
        </div>
      )}

      {!userText && !llmText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No research data available.
        </p>
      )}
    </div>
  );
}
