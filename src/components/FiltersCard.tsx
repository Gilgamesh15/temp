"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";

const FiltersCard = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleToggle = (
    param: "block" | "followers" | "followings",
    checked: boolean
  ) => {
    const params = new URLSearchParams(searchParams);
    if (checked) {
      params.set(param, "true");
    } else {
      params.delete(param);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    params.delete("block");
    params.delete("followers");
    params.delete("followings");
    params.delete("query");

    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Card className="max-w-[30%] max-h-fit">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <CardDescription>Refine your search results</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Enter keywords..."
              className="pl-9"
              onChange={(e) => {
                handleSearch(e.target.value);
              }}
              defaultValue={searchParams.get("query")?.toString() || ""}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-medium">View Options</Label>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="block-switch" className="cursor-pointer">
                Show Blocked
              </Label>
              <p className="text-xs text-muted-foreground">
                Include blocked content
              </p>
            </div>
            <Switch
              id="block-switch"
              checked={searchParams.has("block")}
              onCheckedChange={(checked) => handleToggle("block", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="followers-switch" className="cursor-pointer">
                Followers
              </Label>
              <p className="text-xs text-muted-foreground">
                Show people who follow you
              </p>
            </div>
            <Switch
              id="followers-switch"
              checked={searchParams.has("followers")}
              onCheckedChange={(checked) => handleToggle("followers", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="followings-switch" className="cursor-pointer">
                Following
              </Label>
              <p className="text-xs text-muted-foreground">
                Show people you are following
              </p>
            </div>
            <Switch
              id="followings-switch"
              checked={searchParams.has("followings")}
              onCheckedChange={(checked) => handleToggle("followings", checked)}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          Clear All
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FiltersCard;
