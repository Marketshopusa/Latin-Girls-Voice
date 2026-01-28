import React from "react";

type LineKind = "dialogue" | "meta" | "plain";

function classifyLine(line: string): LineKind {
  const trimmed = line.trim();
  if (/^\*\*_.*_\*\*$/.test(trimmed)) return "dialogue";
  if (/^_.*_$/.test(trimmed)) return "meta";
  return "plain";
}

function stripWrapper(line: string, kind: LineKind) {
  const trimmed = line.trim();
  if (kind === "dialogue") return trimmed.replace(/^\*\*_/, "").replace(/_\*\*$/, "");
  if (kind === "meta") return trimmed.replace(/^_/, "").replace(/_$/, "");
  return line;
}

export function ChatMessageContent({
  text,
  isUser,
}: {
  text: string;
  isUser: boolean;
}) {
  // For user messages we keep the original formatting.
  if (isUser) {
    return <p className="text-base leading-relaxed whitespace-pre-wrap">{text}</p>;
  }

  const lines = text.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, idx) => {
        if (line.trim() === "") {
          return <div key={idx} className="h-2" />;
        }

        const kind = classifyLine(line);
        const content = stripWrapper(line, kind);

        if (kind === "dialogue") {
          return (
            <p key={idx} className="text-base leading-relaxed font-semibold italic">
              {content}
            </p>
          );
        }

        if (kind === "meta") {
          return (
            <p key={idx} className="text-sm leading-relaxed italic opacity-85">
              {content}
            </p>
          );
        }

        return (
          <p key={idx} className="text-base leading-relaxed whitespace-pre-wrap">
            {line}
          </p>
        );
      })}
    </div>
  );
}
