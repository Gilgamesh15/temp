import { useEffect } from "react";

const useAutoResizableTextarea = (
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
) => {
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [textareaRef, textareaRef.current?.value]);
};

export default useAutoResizableTextarea;
