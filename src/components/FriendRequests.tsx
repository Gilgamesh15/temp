import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/client";
import FriendRequestList from "./FriendRequestList";
import { auth } from "@clerk/nextjs/server";

async function getRequests(userId: string) {
  return prisma.followRequest.findMany({
    where: {
      receiverId: userId,
    },
    include: {
      sender: true,
    },
  });
}

const FriendRequestsCard = async () => {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) return null;

  const requests = await getRequests(currentUserId);

  return (
    <Card>
      {/* Header */}
      <CardHeader className="flex-row justify-between">
        <CardTitle>Friend Requests</CardTitle>

        <Link
          //TODO : FIX
          href="/"
          className={buttonVariants({
            variant: "link",
            size: "sm",
            className: "h-fit w-fit px-0",
          })}
        >
          View All
        </Link>
      </CardHeader>

      {/* Requests List */}
      <CardContent className="space-y-2">
        <FriendRequestList requests={requests} />
      </CardContent>
    </Card>
  );
};

export default FriendRequestsCard;
