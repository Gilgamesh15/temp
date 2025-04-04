"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import prisma from "./client";
import {
  AddPostSchema,
  UpdatePostSchema,
  UpdateProfileSchema,
} from "./schemas";
import { fromFormData } from "./utils";

export const toggleFollow = async (userId: string) => {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) throw new Error("User is not authenticated!");

  try {
    const existingFollow = await prisma.follower.findFirst({
      where: {
        followerId: currentUserId,
        followingId: userId,
      },
    });

    if (existingFollow) {
      await prisma.follower.delete({
        where: {
          id: existingFollow.id,
        },
      });
    } else {
      const existingFollowRequest = await prisma.followRequest.findFirst({
        where: {
          senderId: currentUserId,
          receiverId: userId,
        },
      });

      if (existingFollowRequest) {
        await prisma.followRequest.delete({
          where: {
            id: existingFollowRequest.id,
          },
        });
      } else {
        await prisma.followRequest.create({
          data: {
            senderId: currentUserId,
            receiverId: userId,
          },
        });
      }
    }

    revalidatePath("/");
  } catch (err) {
    console.log(err);
    throw new Error("Something went wrong!");
  }
};

export const toggleBlock = async (userId: string) => {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    throw new Error("User is not Authenticated!!");
  }

  try {
    const existingBlock = await prisma.block.findFirst({
      where: {
        blockerId: currentUserId,
        blockedId: userId,
      },
    });

    if (existingBlock) {
      await prisma.block.delete({
        where: {
          id: existingBlock.id,
        },
      });
    } else {
      await prisma.block.create({
        data: {
          blockerId: currentUserId,
          blockedId: userId,
        },
      });
    }

    revalidatePath("/");
  } catch (err) {
    console.log(err);
    throw new Error("Something went wrong!");
  }
};

export const acceptFollowRequest = async (userId: string) => {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    throw new Error("User is not Authenticated!!");
  }

  try {
    const existingFollowRequest = await prisma.followRequest.findFirst({
      where: {
        senderId: userId,
        receiverId: currentUserId,
      },
    });

    if (existingFollowRequest) {
      await prisma.$transaction([
        prisma.followRequest.delete({
          where: {
            id: existingFollowRequest.id,
          },
        }),
        prisma.follower.create({
          data: {
            followerId: currentUserId,
            followingId: existingFollowRequest.senderId,
          },
        }),
      ]);
    }

    revalidatePath("/");
  } catch (err) {
    console.log(err);
    throw new Error("Something went wrong!");
  }
};

export const declineFollowRequest = async (userId: string) => {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    throw new Error("User is not Authenticated!!");
  }

  try {
    const existingFollowRequest = await prisma.followRequest.findFirst({
      where: {
        senderId: userId,
        receiverId: currentUserId,
      },
    });
    if (existingFollowRequest) {
      prisma.followRequest.delete({
        where: {
          id: existingFollowRequest.id,
        },
      });
    }

    revalidatePath("/");
  } catch (err) {
    console.log(err);
    throw new Error("Something went wrong!");
  }
};

export const toggleLike = async (postId: string) => {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) throw new Error("User is not authenticated");

  try {
    const existingLike = await prisma.like.findFirst({
      where: {
        postId,
        userId: currentUserId,
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
    } else {
      await prisma.like.create({
        data: {
          postId,
          userId: currentUserId,
        },
      });
    }

    revalidatePath("/");
  } catch (error) {
    console.log(error);
    throw new Error("Failed to toggle like!");
  }
};

export const getMoreChildren = async (
  args: Partial<{
    parentId: string;
    take: number;
    skip: number;
  }>
) => {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) throw new Error("User is not authenticated");

  const { parentId, take = 10, skip = 0 } = args;

  try {
    const res = await prisma.post.findMany({
      ...(parentId
        ? {
            where: {
              parentId,
            },
          }
        : {}),
      take,
      skip,
      orderBy: {
        createdAt: "desc",
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
    });

    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deletePost = async (postId: string) => {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) throw new Error("User is not authenticated");

  try {
    await prisma.post.delete({
      where: {
        id: postId,
        authorId: currentUserId,
      },
    });

    revalidatePath("/");
  } catch (error) {
    console.log(error);

    throw new Error("Something went wrong!");
  }
};

export const updatePost = async (payload: z.infer<typeof UpdatePostSchema>) => {
  const { userId } = await auth();

  if (!userId) throw new Error("User is not authenticated");

  try {
    return prisma.post.update({
      where: {
        id: payload.postId,
      },
      data: {
        text: payload.text,
        images: payload.images,
      },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getFilteredUsers = async (filter: string) => {
  const { userId } = await auth();

  if (!userId) throw new Error("User is not authenticated");

  return prisma.user.findMany({
    where: {
      OR: [
        {
          username: {
            contains: filter,
            mode: "insensitive",
          },
          name: {
            contains: filter,
            mode: "insensitive",
          },
          surname: {
            contains: filter,
            mode: "insensitive",
          },
        },
      ],
    },
  });
};
export const createPost = async (data: z.infer<typeof AddPostSchema>) => {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) throw new Error("User is not authenticated");

  try {
    await prisma.post.create({
      data: {
        text: data.text,
        authorId: currentUserId,
        images: data.images,
        parentId: data.parentId,
      },
    });

    revalidatePath("/");
  } catch (error) {
    console.log(error);
    throw new Error("Something went wrong!");
  }
};

//useActionState actions
export interface UpdateProfileState {
  errors: Partial<Record<keyof z.infer<typeof UpdateProfileSchema>, string[]>>;
  code?: number;
}

export async function updateProfileAction(
  prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    return {
      errors: {},
      code: 401,
    };
  }

  const parseResult = UpdateProfileSchema.safeParse(fromFormData(formData));

  if (!parseResult.success) {
    return {
      errors: parseResult.error.flatten().fieldErrors,
      code: 400,
    };
  }

  const data: z.infer<typeof UpdateProfileSchema> = parseResult.data;

  try {
    await prisma.user.update({
      where: {
        id: currentUserId,
      },
      data,
    });

    revalidatePath("/");

    return {
      errors: {},
      code: 200,
    };
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      //unique constraint failed: users.username code
      error.code === "P2002"
    ) {
      return {
        errors: {
          username: ["Username already exists"],
        },
        code: 400,
      };
    }

    return {
      errors: {},
      code: 500,
    };
  }
}

interface AddPostState {
  errors: Partial<Record<keyof z.infer<typeof AddPostSchema>, string[]>>;
  code?: number;
}

export const createPostAction = async (
  prevState: AddPostState,
  formData: FormData
): Promise<AddPostState> => {
  const { userId: currentUserId } = await auth();

  if (!currentUserId) {
    return {
      errors: {},
      code: 401,
    };
  }

  const parseResult = AddPostSchema.safeParse(fromFormData(formData));

  if (!parseResult.success) {
    return {
      errors: parseResult.error.flatten().fieldErrors,
      code: 400,
    };
  }

  const data: z.infer<typeof AddPostSchema> = parseResult.data;

  try {
    await prisma.post.create({
      data: {
        text: data.text,
        authorId: currentUserId,
        images: data.images,
        parentId: data.parentId,
      },
    });

    revalidatePath("/");

    return {
      errors: {},
      code: 201,
    };
  } catch {
    return {
      errors: {},
      code: 500,
    };
  }
};
