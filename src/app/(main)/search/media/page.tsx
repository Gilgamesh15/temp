import prisma from "@/lib/client";
import { auth } from "@clerk/nextjs/server";
import Pagination from "@/components/Pagination";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import FiltersCard from "@/components/FiltersCard";

const MEDIA_PER_PAGE = 24;

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

  const where: Prisma.PostWhereInput = {
    NOT: {
      images: {
        isEmpty: true,
      },
    },
    ...(!displayBlocked
      ? {
          author: {
            blockedBy: {
              none: {
                id: userId,
              },
            },
          },
        }
      : {}),
    ...(!displayFollowers
      ? {
          author: {
            followings: {
              none: {
                followerId: userId,
              },
            },
          },
        }
      : {}),
    ...(!displayFollowings
      ? {
          author: {
            followings: {
              none: {
                followingId: userId,
              },
            },
          },
        }
      : {}),
    ...(query
      ? {
          OR: [
            {
              author: {
                username: {
                  contains: query,
                },
              },
            },
            {
              author: {
                name: {
                  contains: query,
                },
              },
            },
            {
              author: {
                surname: {
                  contains: query,
                },
              },
            },
            {
              text: {
                contains: query,
              },
            },
          ],
        }
      : {}),
  };

  const media = await prisma.post
    .findMany({
      where,
      select: {
        images: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    .then((res) =>
      res.reduce((acc, cur) => acc.concat(cur.images), [] as string[])
    );

  const mediaCount = media.length;

  return (
    <div className="flex gap-4 h-full">
      <FiltersCard />

      <div className="w-[70%] flex flex-col justify-between">
        <div className="grid grid-cols-4 gap-2">
          <Dialog>
            {media
              .slice((page - 1) * MEDIA_PER_PAGE, page * MEDIA_PER_PAGE)
              .sort()
              .map((image) => (
                <DialogTrigger
                  key={image}
                  className="relative aspect-square w-full rounded overflow-hidden"
                >
                  <Image
                    src={image}
                    alt="media"
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </DialogTrigger>
              ))}
            <DialogContent className="min-w-[50vw] min-h-[50vh]">
              <DialogHeader>
                <DialogTitle>Media</DialogTitle>
              </DialogHeader>

              <Carousel>
                <CarouselContent>
                  {media
                    .slice((page - 1) * MEDIA_PER_PAGE, page * MEDIA_PER_PAGE)
                    .sort()
                    .map((image) => (
                      <CarouselItem
                        key={image}
                        className="relative aspect-square w-full rounded overflow-hidden"
                      >
                        <Image
                          src={image}
                          alt="media"
                          fill
                          className="object-scale-down"
                        />
                      </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselNext />
                <CarouselPrevious />
              </Carousel>
            </DialogContent>
          </Dialog>
        </div>

        <Pagination totalPages={Math.ceil(mediaCount / MEDIA_PER_PAGE)} />
      </div>
    </div>
  );
}
