"use client";

import { useState } from "react";
import { AlertTriangle, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ScrollArea } from "./ui/scroll-area";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

import { cn, getAvatarSrc } from "@/lib/utils";
import useFilteredUsers from "@/hooks/use-filtered-users";

const SearchBar = ({ className }: { className?: string }) => {
  const { push } = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");

  const { users, isLoading, isError } = useFilteredUsers(value);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            push(`/search/users?query=${value}`);
          }}
          onReset={() => {
            setValue("");
          }}
          style={{
            // @ts-expect-error setting custom properties
            "--input-padding": "12px",
            "--submit-button-size": "44px",
          }}
          className={className}
        >
          <label className="sr-only" htmlFor="header-search">
            Search
          </label>

          <div className="flex items-center relative">
            <Input
              value={value}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length && !isOpen) {
                  setIsOpen(true);
                } else if (!val.length && isOpen) {
                  setIsOpen(false);
                }
                setValue(val);
              }}
              type="search"
              placeholder="Search for friends..."
              className={cn(
                "min-w-[calc(27ch+2*var(--input-padding)+2*var(--submit-button-size))] pr-[var(--submit-button-size)] pl-[calc(var(--input-padding)+var(--submit-button-size))] h-[var(--submit-button-size)] w-full",
                isError &&
                  "text-destructive placeholder:text-destructive border-destructive focus-visible:ring-destructive"
              )}
              id="header-search"
            />

            {value.length > 0 && (
              <Button
                variant="ghost"
                className="absolute right-0 -translate-x-1/2 top-1/2 -translate-y-1/2 rounded-full p-1 h-1/2 aspect-square"
                type="reset"
              >
                <span className="sr-only">Clear query</span>
                <X />
              </Button>
            )}

            <Button
              type="submit"
              size="icon"
              className="absolute left-0 rounded-r-none aspect-square size-[44px]"
            >
              <Search className="min-w-5 min-h-5" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
        </form>
      </PopoverAnchor>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {isError ? (
          <div className="py-4 text-center text-destructive font-jost leading-tight flex flex-col items-center">
            <AlertTriangle className="min-w-8 min-h-8 mb-2" />
            <span> Something went wrong.</span>
            <span>Please try again later.</span>
          </div>
        ) : isLoading ? (
          <div>
            <ScrollArea className="h-80 rounded">
              <div className="space-y-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            </ScrollArea>

            <div className="block -mb-3 mt-1 text-center text-muted-foreground">
              Looking for users...
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            No users found
          </div>
        ) : (
          <div>
            <ScrollArea className="h-80 rounded">
              <div className="space-y-1">
                {users.map((user) => (
                  <Link
                    href={`/profile/${user.username}`}
                    key={user.id}
                    className="flex items-center gap-3 p-2 hover:bg-muted rounded transition-colors"
                  >
                    <div className="size-10 relative overflow-hidden rounded-full">
                      <Image
                        src={getAvatarSrc(user)}
                        alt={`${user.username}'s avatar`}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="font-medium truncate">
                        {user.name + " " + user.surname}
                      </span>
                      <span className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </ScrollArea>

            <span className="block -mb-3 mt-1 text-center text-muted-foreground">
              {users.length} users found
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default SearchBar;
