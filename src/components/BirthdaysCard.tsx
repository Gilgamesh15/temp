import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Gift, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/client";
import { auth } from "@clerk/nextjs/server";

async function getBirthdays(userId: string) {
  const users = await prisma.user.findMany({
    where: {
      followings: {
        some: {
          id: {
            equals: userId,
          },
        },
      },
      birthDate: {
        gte: new Date(),
        lte: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30),
      },
    },
  });
  return users;
}

const BirthdaysCard = async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const users = (await getBirthdays(userId)).filter(
    (user) => user.birthDate !== null
  );

  const todayUsers = users.filter((user) => {
    return user.birthDate!.getDate() === new Date().getDate();
  });

  const thisMonthUsers = users.filter((user) => {
    return (
      user.birthDate!.getMonth() === new Date().getMonth() &&
      user.birthDate!.getDate() > new Date().getDate()
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Celebrations</CardTitle>
      </CardHeader>

      <CardContent>
        {todayUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6 flex items-center gap-4">
              <Link
                href={`/profile/${user.username}`}
                className="rounded object-cover border shadow relative aspect-square h-14 overflow-hidden"
              >
                <Image
                  src={
                    user.avatar || user.gender === "female"
                      ? "/avatar-fallback-female.jpeg"
                      : "/avatar-fallback-male.jpeg"
                  }
                  fill
                  alt={`${user.username}'s avatar`}
                  className="transition-transform duration-200 hover:scale-105"
                />
              </Link>

              <div className="flex-1">
                <Link
                  className="font-medium"
                  href={`/profile/${user.username}`}
                >
                  {user.name} {user.surname}
                </Link>

                <p className="text-sm text-muted-foreground">
                  Celebrating today
                </p>
              </div>

              <Link
                //TODO make this lead to proper page
                href={`#`}
                className={buttonVariants({})}
              >
                Celebrate
              </Link>
            </CardContent>
          </Card>
        ))}
      </CardContent>

      <CardFooter className="flex-col items-start">
        <Button
          variant="secondary"
          size="lg"
          className="py-10 w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Gift className="min-w-10 min-h-10 rounded text-primary-foreground bg-primary p-2" />

            <div>
              <p className="text-sm font-medium">Upcoming Birthdays</p>
              <p className="text-xs text-muted-foreground">
                {thisMonthUsers.length} celebrations this month
              </p>
            </div>
          </div>

          <ChevronRight className="min-w-5 min-h-5 text-muted-foreground" />
        </Button>

        <div className="mt-2 w-full">
          {thisMonthUsers.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.username}`}
              className={buttonVariants({
                variant: "ghost",
                className: "py-8 w-full",
              })}
            >
              <div className="rounded object-cover border shadow relative aspect-square h-8 overflow-hidden">
                <Image
                  src={
                    user.avatar ||
                    (user.gender === "female"
                      ? "/avatar-fallback-female.jpeg"
                      : "/avatar-fallback-male.jpeg")
                  }
                  fill
                  alt={`${user.username}'s avatar`}
                />
              </div>

              <div className="flex-1">
                <p className="text-sm">
                  {user.name} {user.surname}
                </p>
                <p className="text-xs text-muted-foreground">
                  In {user.birthDate!.getDate() - new Date().getDate()} days
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};

export default BirthdaysCard;
