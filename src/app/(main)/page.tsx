import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";

import AddPost from "@/components/AddPost";
import ProfileCard from "@/components/ProfileCard";
import FriendRequestsCard from "@/components/FriendRequests";
import BirthdaysCard from "@/components/BirthdaysCard";
import Posts from "@/components/Posts";
import prisma from "@/lib/client";
import UserMediaCard from "@/components/UserMediaCard";

const POSTS_PER_PAGE = 5;

export default async function Page() {
  const { userId } = await auth();

  if (!userId) throw new Error("User is not authenticated");

  const user = await prisma.user.findUnique({
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
      _count: {
        select: {
          followers: true,
          followings: true,
          posts: true,
        },
      },
    },
  });

  if (!user) throw new Error("User not found");

  const posts = await prisma.post.findMany({
    where: {
      parentId: null,
      OR: [
        {
          author: {
            followers: {
              some: {
                id: userId,
              },
            },
          },
        },
        {
          authorId: userId,
        },
      ],
    },
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
    orderBy: {
      createdAt: "desc",
    },
    take: POSTS_PER_PAGE,
  });

  return (
    <div className="flex gap-4">
      <div className="w-[25%] flex-col gap-4 xl:flex hidden">
        <Suspense>
          <ProfileCard user={user} />
        </Suspense>
      </div>

      <div className="xl:w-[40%] flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <AddPost />

          <Posts initialPosts={posts} currentUser={user} />
        </div>
      </div>

      <div className="w-[35%] xl:flex hidden">
        <div className="flex flex-col gap-4">
          <UserMediaCard />

          <FriendRequestsCard />

          <BirthdaysCard />
        </div>
      </div>
    </div>
  );
}
