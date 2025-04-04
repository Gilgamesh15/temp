"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, X } from "lucide-react";

import { acceptFollowRequest, declineFollowRequest } from "@/lib/actions";
import { RequestWithSender } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

interface FriendRequestListProps {
  requests: RequestWithSender[];
}

const FriendRequestList = ({ requests }: FriendRequestListProps) => {
  const [optimisticRequests, removeOptimisticRequest] = useOptimistic(
    requests,
    (state, userId: string) => state.filter((req) => req.senderId !== userId)
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, startTransition] = useTransition();

  function accept(userId: string) {
    startTransition(() => {
      removeOptimisticRequest(userId);
      acceptFollowRequest(userId);
    });
  }

  function decline(userId: string) {
    startTransition(() => {
      removeOptimisticRequest(userId);
      declineFollowRequest(userId);
    });
  }

  return optimisticRequests.slice(0, 4).map((request) => (
    <Card key={request.id}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/profile/${request.sender.username}`}
            className="rounded object-cover border shadow relative aspect-square h-14 overflow-hidden"
          >
            <Image
              src={
                request.sender.avatar ||
                (request.sender.gender === "female"
                  ? "/avatar-fallback-female.jpeg"
                  : "/avatar-fallback-male.jpg")
              }
              fill
              alt={`${request.sender.username}'s avatar`}
              className="transition-transform duration-200 hover:scale-105"
            />
          </Link>

          <div className="flex-1 flex flex-col">
            <Link
              className="font-medium"
              href={`/profile/${request.sender.username}`}
            >
              {request.sender.name} {request.sender.surname}
            </Link>

            <Link
              href={`/profile/${request.sender.username}`}
              className="text-sm text-muted-foreground"
            >
              {request.sender.username}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            className="size-6"
            onClick={() => accept(request.sender.id)}
          >
            <Check />
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="size-6"
            onClick={() => decline(request.sender.id)}
          >
            <X />
          </Button>
        </div>
      </CardContent>
    </Card>
  ));
};

export default FriendRequestList;
