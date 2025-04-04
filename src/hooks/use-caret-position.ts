"use client";

import { RefObject, useEffect, useState } from "react";

const useCaretPosition = (
  textareaRef: RefObject<HTMLTextAreaElement | null>
) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const updateCaretPosition = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const selectionStart = textarea.selectionStart;

    // Create a temporary div with the same styling as the textarea
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.top = textarea.getBoundingClientRect().top + "px";
    div.style.left = textarea.getBoundingClientRect().left + "px";
    div.style.visibility = "hidden";
    div.style.width = `${textarea.clientWidth}px`;
    div.style.height = "auto";
    div.style.fontFamily = window.getComputedStyle(textarea).fontFamily;
    div.style.fontSize = window.getComputedStyle(textarea).fontSize;
    div.style.lineHeight = window.getComputedStyle(textarea).lineHeight;
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";
    div.style.padding = window.getComputedStyle(textarea).padding;

    // Get text before caret
    const textBeforeCaret = textarea.value.substring(0, selectionStart);
    // Create a span for the text before caret
    const textNode = document.createTextNode(textBeforeCaret);
    // Create a span for the caret itself
    const caretSpan = document.createElement("span");
    caretSpan.textContent = "|";

    // Add content to the div
    div.appendChild(textNode);
    div.appendChild(caretSpan);
    document.body.appendChild(div);

    // Get the position of the caret span
    const rect = caretSpan.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();

    // Calculate position relative to textarea
    const x = rect.left - textareaRect.left;
    const y = rect.top - textareaRect.top;

    // Clean up
    document.body.removeChild(div);

    // Update position state
    setPosition({ x, y });
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Update position when clicking, selecting, or typing in the textarea
    const events = ["click", "keyup", "select", "mouseup"];
    events.forEach((event) => {
      textarea.addEventListener(event, updateCaretPosition);
    });

    // Initial update
    updateCaretPosition();

    return () => {
      events.forEach((event) => {
        textarea.removeEventListener(event, updateCaretPosition);
      });
    };
  }, [textareaRef]);

  return position;
};

export default useCaretPosition;
