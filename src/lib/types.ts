import { Prisma } from "@prisma/client";

export type RequestWithSender = Prisma.FollowRequestGetPayload<{
  include: {
    sender: true;
  };
}>;

export type Post = Prisma.PostGetPayload<{
  include: {
    _count: {
      select: {
        likes: true;
        children: true;
      };
    };
    author: {
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
      };
    };
    likes: {
      select: {
        userId: true;
      };
    };
  };
}> & {
  children?: Post[];
};

export type User = Prisma.UserGetPayload<{
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
  };
}>;
