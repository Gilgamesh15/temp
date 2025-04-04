"use client";

import useFilteredUsers from "@/hooks/use-filtered-users";
import { Prisma } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { cn, getAvatarSrc } from "@/lib/utils";
import Image from "next/image";

const MentionPopover = ({
  lastMention,
  caretPosition,
  onSelect,
}: {
  lastMention: string | undefined;
  caretPosition: { x: number; y: number };
  onSelect: (user: Prisma.UserGetPayload<object>) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { users, isLoading, isError } = useFilteredUsers(lastMention || "");

  useEffect(() => {
    setOpen(!!lastMention);
  }, [lastMention]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if no results or loading
      if (users.length === 0 || isLoading) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % users.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
          break;
        case "Enter":
        case "Tab":
          e.preventDefault();
          onSelect(users[selectedIndex]);
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading, onSelect, selectedIndex, users, users.length]);

  useEffect(() => {
    if (containerRef.current && users.length > 0) {
      const highlightedItem = containerRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, users.length]);

  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedIndex(0);
        }
        setOpen(!open);
      }}
    >
      <PopoverAnchor
        className="absolute"
        style={{
          left: `${caretPosition.x}px`,
          top: `${caretPosition.y}px`,
          transform: "translate(0px, 20px)",
        }}
      />

      <PopoverContent
        className="p-0 w-fit max-w-64"
        align="center"
        avoidCollisions={true}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div ref={containerRef}>
          {isLoading ? (
            <div className="p-2 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <p className="text-sm text-muted-foreground">Loading users...</p>
            </div>
          ) : isError ? (
            <div className="p-2 text-sm text-destructive">
              Failed to load users
            </div>
          ) : users.length === 0 ? (
            <div className="p-2 text-sm text-center text-muted-foreground">
              No users found for <br /> &ldquo;@{lastMention}&ldquo;
            </div>
          ) : (
            <ScrollArea className="max-h-60">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  data-index={index}
                  className={cn(
                    "flex items-center gap-2 p-1 cursor-pointer",
                    selectedIndex === index && "bg-accent"
                  )}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex-shrink-0">
                    <Image
                      src={getAvatarSrc(user)}
                      alt={`@${user.username}'s avatar`}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      @{user.username}
                    </span>
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MentionPopover;
