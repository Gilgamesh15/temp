import prisma from "@/lib/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { buttonVariants } from "./ui/button";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

const UserMediaCard = async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const media = await prisma.post
    .findMany({
      where: {
        authorId: userId,
        NOT: {
          images: {
            isEmpty: true,
          },
        },
      },
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Media</CardTitle>
        <CardDescription>Enter description</CardDescription>
      </CardHeader>

      <CardContent className="grid grid-cols-4 gap-1">
        <Dialog>
          {media.slice(0, 16).map((image) => (
            <DialogTrigger key={image} className="overflow-hidden rounded">
              <Image
                src={image}
                alt="Post"
                width={300}
                height={300}
                className="aspect-square w-full h-full object-cover transition-transform hover:scale-110"
              />
            </DialogTrigger>
          ))}

          <DialogContent className="min-w-[50vw] min-h-[50vh]">
            <DialogHeader>
              <DialogTitle>Media</DialogTitle>
            </DialogHeader>

            <Carousel>
              <CarouselContent>
                {media.map((image) => (
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
      </CardContent>

      <CardFooter>
        <Link
          href={`/search/media?username=${userId}`}
          className={buttonVariants({
            variant: "outline",
            className: "w-full",
          })}
        >
          View all
        </Link>
      </CardFooter>
    </Card>
  );
};

export default UserMediaCard;
