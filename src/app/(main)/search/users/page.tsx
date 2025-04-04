import ProfileCard from "@/components/ProfileCard";
import prisma from "@/lib/client";
import { auth } from "@clerk/nextjs/server";
import Pagination from "@/components/Pagination";
import { Prisma } from "@prisma/client";
import FiltersCard from "@/components/FiltersCard";

const USERS_PER_PAGE = 10;

export default async function Page({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await searchParamsPromise;
  const { userId } = await auth();

  if (!userId) throw new Error("User is not authenticated");

  const displayBlocked = searchParams["block"] === "true";
  const displayFollowers = searchParams["followers"] === "true";
  const displayFollowings = searchParams["followings"] === "true";
  const query =
    typeof searchParams["query"] === "string" ? searchParams["query"] : "";
  const page = parseInt(
    typeof searchParams["page"] === "string" ? searchParams["page"] : "1"
  );

  const where: Prisma.UserWhereInput = {
    id: {
      not: userId,
    },
    ...(!displayBlocked
      ? {
          blockedBy: {
            none: {
              id: userId,
            },
          },
        }
      : {}),
    ...(!displayFollowers
      ? {
          followings: {
            none: {
              followerId: userId,
            },
          },
        }
      : {}),
    ...(!displayFollowings
      ? {
          followings: {
            none: {
              followingId: userId,
            },
          },
        }
      : {}),
    ...(query
      ? {
          OR: [
            {
              username: {
                contains: query,
              },
            },
            {
              name: {
                contains: query,
              },
            },
            {
              surname: {
                contains: query,
              },
            },
          ],
        }
      : {}),
  };

  const userCount = await prisma.user.count({
    where,
  });

  const users = await prisma.user.findMany({
    where,
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
    take: USERS_PER_PAGE,
    skip: (page - 1) * USERS_PER_PAGE,
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex gap-4 h-full">
      <FiltersCard />

      <div className="w-[70%] flex flex-col justify-between">
        <div className="grid grid-cols-3 gap-2">
          {users.map((user) => (
            <ProfileCard key={user.id} user={user} />
          ))}
        </div>

        <Pagination totalPages={Math.ceil(userCount / USERS_PER_PAGE)} />
      </div>
    </div>
  );
}
