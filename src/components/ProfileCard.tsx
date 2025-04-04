import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import FollowButton from "./FollowButton";
import UpdateProfileForm from "./UpdateProfileForm";
import { formatNumber, getAvatarSrc } from "@/lib/utils";
import { Prisma } from "@prisma/client";

interface ProfileCardProps {
  user: Prisma.UserGetPayload<{
    include: {
      followings: {
        select: {
          followingId: true;
        };
      };
      followRequestsReceived: {
        select: {
          senderId: true;
        };
      };
      _count: {
        select: {
          followers: true;
          followings: true;
          posts: true;
        };
      };
    };
  }>;
}

const ProfileCard = async ({ user }: ProfileCardProps) => {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) return null;

  const isSelf = currentUserId === user.id;

  return (
    <Card className="h-[462px] mt-[56px] flex flex-col">
      <CardHeader>
        <Link
          href={`/profile/${user.username}`}
          className="border relative w-full h-[220px] bottom-20 -mb-[56px] rounded-3xl overflow-hidden shadow-xl"
        >
          <Image
            src={getAvatarSrc(user)}
            alt={
              isSelf
                ? "Your profile picture"
                : `${user.username}'s profile picture`
            }
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        </Link>

        <div className="flex flex-col items-center">
          <Link
            href={`/profile/${user.username}`}
            className="text-xl font-semibold mb-1"
          >
            {user.name} {user.surname}
          </Link>
          <Link
            href={`/profile/${user.username}`}
            className="text-muted-foreground -mt-1 mb-2 text-sm font-light"
          >
            @{user.username}
          </Link>

          {user.description && (
            <div className="text-center font-normal text-sm text-muted-foreground line-clamp-3">
              {user.description}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="mt-auto">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 flex-col items-center">
            <div className="font-semibold">
              {formatNumber(user._count.posts)}
            </div>
            <div className="text-sm font-normal text-muted-foreground">
              posts
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center">
            <div className="font-semibold">
              {formatNumber(user._count.followers)}
            </div>
            <div className="text-sm font-normal text-muted-foreground">
              followers
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center">
            <div className="font-semibold">
              {formatNumber(user._count.followings)}
            </div>
            <div className="text-sm font-normal text-muted-foreground">
              following
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-4">
        {isSelf ? (
          <UpdateProfileForm defaultValues={user} />
        ) : (
          <FollowButton
            userId={user.id}
            initialState={
              user.followings.find(
                (following) => following.followingId === currentUserId
              )
                ? "following"
                : user.followRequestsReceived.find(
                    (request) => request.senderId === currentUserId
                  )
                ? "request_sent"
                : "not_following"
            }
          />
        )}

        {/** PROFILE LINK */}
        <Link
          href={`/profile/${user.username}`}
          className={buttonVariants({
            className: "flex-1",
            size: "sm",
          })}
        >
          See Profile
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProfileCard;
