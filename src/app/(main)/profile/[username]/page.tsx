import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import prisma from "@/lib/client";
import ProfileCard from "@/components/ProfileCard";
import UserMediaCard from "@/components/UserMediaCard";
import BirthdaysCard from "@/components/BirthdaysCard";
import FriendRequestsCard from "@/components/FriendRequests";
import Posts from "@/components/Posts";
import { Suspense } from "react";

const ProfilePage = async ({ params }: { params: { username: string } }) => {
  const username = params.username;
  const user = await prisma.user.findFirst({
    where: {
      username,
    },
    include: {
      blockedBy: {
        select: {
          blockerId: true,
        },
      },
      followings: {
        select: {
          followingId: true,
        },
      },
      followRequestsReceived: {
        select: {
          senderId: true,
        },
      },
      _count: {
        select: {
          followers: true,
          followings: true,
          posts: true,
        },
      },
    },
  });

  if (!user) return notFound();

  const { userId } = await auth();

  const isSelf = userId === user.id;

  const isBlocked = user.blockedBy.some((block) => block.blockerId === userId);

  if (isBlocked) {
    return notFound();
  }

  return (
    <div className="flex gap-4">
      <div className="w-[25%] flex flex-col gap-4">
        <ProfileCard user={user} />
      </div>

      <div className="w-full lg:w-[70%] xl:w-[50%]">
        <div className="flex flex-col gap-6">
          <Suspense>
            <AsyncPosts />
          </Suspense>
        </div>
      </div>

      <div className="w-[25%]">
        <UserMediaCard />

        {!isSelf && (
          <>
            <Suspense>
              <FriendRequestsCard />
            </Suspense>

            <BirthdaysCard />
          </>
        )}
      </div>
    </div>
  );
};

const AsyncPosts = async () => {
  const { userId } = await auth();

  if (!userId) return null;

  const posts = await prisma.post.findMany({
    include: {
      _count: {
        select: {
          likes: true,
          children: true,
        },
      },
      author: {
        include: {
          followings: {
            select: {
              followingId: true,
            },
          },
          followRequestsReceived: {
            select: {
              senderId: true,
            },
          },
        },
      },
      likes: {
        select: {
          userId: true,
        },
      },
    },
    take: 10,
  });

  const currentUser = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    include: {
      followings: {
        select: {
          followingId: true,
        },
      },
      followRequestsReceived: {
        select: {
          senderId: true,
        },
      },
    },
  });

  if (!currentUser) return null;

  return <Posts initialPosts={posts} currentUser={currentUser} />;
};

export default ProfilePage;
