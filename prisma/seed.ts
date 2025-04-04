import { PrismaClient, NotificationType } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { clerkClient } from "@clerk/nextjs/server";
import { ClerkClient, User } from "@clerk/backend";
import { User as PrismaUser, Post } from "@prisma/client";

const prisma = new PrismaClient();

// Configuration
const USER_COUNT = 10;
const GENDER_OCCURRENCE = 0.8;
const MALE_OCCURRENCE = 0.5;
const FEMALE_OCCURRENCE = 0.5;
const BIRTHDATE_OCCURRENCE = 0.8;
const DESCRIPTION_OCCURRENCE = 0.8;
const AVATAR_OCCURRENCE = 0.8;
const MAX_POSTS_PER_USER = 10;
const MAX_COMMENTS_PER_POST = 5;
const MAX_LIKES_PER_POST = 15;
const MAX_FOLLOWERS_PER_USER = 20;
const MAX_FOLLOW_REQUESTS_PER_USER = 5;
const MAX_BLOCKS_PER_USER = 3;
const MAX_NOTIFICATIONS_PER_USER = 8;

type ClerkUserCreateInput = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
};

async function main() {
  console.log("Seeding database means deleting all previous data...");
  console.log("Seeding database...");

  // Initialize Clerk client
  const clerk = await clerkClient();

  // Clean existing data
  console.log("Clearing previous data...");
  await clearData(clerk);

  // Create Clerk users
  const clerkUsers = await createClerkUsers(clerk, USER_COUNT);

  // Create Prisma users based on Clerk users
  const users = await createPrismaUsers(clerkUsers);
  console.log(`Created ${users.length} Prisma users based on Clerk accounts`);

  // Create posts
  const posts = await createPosts(users);
  console.log(`Created ${posts.length} posts`);

  // Create comments (posts that are replies to other posts)
  await createComments(users, posts);
  console.log("Created comments");

  // Create likes
  await createLikes(users, posts);
  console.log("Created likes");

  // Create followers
  await createFollowers(users);
  console.log("Created followers");

  // Create follow requests
  await createFollowRequests(users);
  console.log("Created follow requests");

  // Create blocks
  await createBlocks(users);
  console.log("Created blocks");

  // Create notifications
  await createNotifications(users);
  console.log("Created notifications");

  console.log("Database seeding completed successfully");
}

async function clearData(clerk: ClerkClient) {
  // Delete all Prisma records in reverse order of dependencies
  const block = await prisma.block.deleteMany();
  console.log("Deleted " + block.count + " blocks");

  const followRequest = await prisma.followRequest.deleteMany();
  console.log("Deleted " + followRequest.count + " follow requests");

  const follower = await prisma.follower.deleteMany();
  console.log("Deleted " + follower.count + " followers");

  const like = await prisma.like.deleteMany();
  console.log("Deleted " + like.count + " likes");

  const notification = await prisma.notification.deleteMany();
  console.log("Deleted " + notification.count + " notifications");

  const post = await prisma.post.deleteMany();
  console.log("Deleted " + post.count + " posts");

  const user = await prisma.user.deleteMany();
  console.log("Deleted " + user.count + " users");

  // Delete all Clerk users
  try {
    const clerkUsers = await clerk.users
      .getUserList({ limit: Number.MAX_SAFE_INTEGER })
      .then((res) => res.data);

    const clerkRes = await Promise.all(
      clerkUsers.map((user) => clerk.users.deleteUser(user.id))
    );
    console.log("Deleted " + clerkRes.length + " Clerk users");
  } catch (error) {
    console.error("Error deleting Clerk users:", error);
  }
}

async function createClerkUsers(clerk: ClerkClient, count: number) {


  const clerkUsers = await Promise.all(
    Array.from({length:count}).map((_) => clerk.users.createUser({
      username: faker.internet.username().replace(/[^a-zA-Z0-9_-]/g, ""),
      emailAddress: [faker.internet.email()],
      password: faker.internet.password(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    }))
  );

  console.log("Created " + clerkUsers.length + " Clerk users");
  return clerkUsers;
}

async function createPrismaUsers(clerkUsers: User[]): Promise<PrismaUser[]> {
  // First create all users in bulk
  await prisma.user.createMany({
    data: clerkUsers.map((user) => ({
      id: user.id,
      name: user.firstName ?? "Unknown", // Ensure name is always a string
      surname: user.lastName ?? "Unknown", // Ensure surname is always a string
      username: user.username ?? faker.internet.username(), // Ensure username is always a string
      gender:
        Math.random() > GENDER_OCCURRENCE
          ? Math.random() < MALE_OCCURRENCE
            ? "male"
            : Math.random() < FEMALE_OCCURRENCE
            ? "female"
            : "other"
          : "other", // Default value
      birthDate:
        Math.random() > BIRTHDATE_OCCURRENCE ? faker.date.birthdate({}) : null,
      description:
        Math.random() > DESCRIPTION_OCCURRENCE
          ? faker.lorem.sentence({ min: 10, max: 100 })
          : null,
      avatar: Math.random() > AVATAR_OCCURRENCE ? faker.image.avatar() : null,
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent({ days: 30 }),
    })),
  });

  // Then fetch all created users to return them
  const users = await prisma.user.findMany();
  console.log("Created " + users.length + " Prisma users");
  return users;
}

async function createPosts(users: PrismaUser[]) {
  const posts = [];

  for (const user of users) {
    const numPosts = faker.number.int({ min: 0, max: MAX_POSTS_PER_USER });

    for (let i = 0; i < numPosts; i++) {
      const numImages = faker.number.int({ min: 0, max: 4 });
      const images = [];

      for (let j = 0; j < numImages; j++) {
        images.push(faker.image.url());
      }

      const post = await prisma.post.create({
        data: {
          text: faker.lorem.paragraph(),
          images,
          authorId: user.id,
          createdAt: faker.date.recent({ days: 60 }),
          updatedAt: faker.date.recent({ days: 30 }),
        },
      });

      posts.push(post);
    }
  }

  return posts;
}

async function createComments(users: PrismaUser[], posts: Post[]) {
  for (const post of posts) {
    // Only some posts will have comments
    if (faker.datatype.boolean()) {
      const numComments = faker.number.int({
        min: 1,
        max: MAX_COMMENTS_PER_POST,
      });

      for (let i = 0; i < numComments; i++) {
        // Select a random user to be the commenter
        const commenter = faker.helpers.arrayElement(users);

        // Don't allow users to comment on their own posts in this seed
        if (commenter.id !== post.authorId) {
          await prisma.post.create({
            data: {
              text: faker.lorem.sentences({ min: 1, max: 3 }),
              images: [], // Comments typically don't have images
              authorId: commenter.id,
              parentId: post.id,
              createdAt: faker.date.recent({ days: 30 }),
              updatedAt: faker.date.recent({ days: 15 }),
            },
          });
        }
      }
    }
  }
}

async function createLikes(users: PrismaUser[], posts: Post[]) {
  for (const post of posts) {
    const numLikes = faker.number.int({ min: 0, max: MAX_LIKES_PER_POST });
    const likers = faker.helpers.arrayElements(users, numLikes);

    for (const user of likers) {
      // Users shouldn't like their own posts in this seed
      if (user.id !== post.authorId) {
        try {
          await prisma.like.create({
            data: {
              userId: user.id,
              postId: post.id,
              createdAt: faker.date.recent({ days: 20 }),
            },
          });
        } catch {
          // Ignore duplicate likes
          console.log(
            `Skipping duplicate like from user ${user.id} on post ${post.id}`
          );
        }
      }
    }
  }
}

async function createFollowers(users: PrismaUser[]) {
  for (const user of users) {
    const numFollowers = faker.number.int({
      min: 0,
      max: MAX_FOLLOWERS_PER_USER,
    });
    const followers = faker.helpers.arrayElements(
      users.filter((u) => u.id !== user.id), // Can't follow yourself
      numFollowers
    );

    for (const follower of followers) {
      try {
        await prisma.follower.create({
          data: {
            followerId: follower.id,
            followingId: user.id,
            createdAt: faker.date.past({ years: 1 }),
          },
        });
      } catch (error) {
        // Ignore duplicate followers
        throw error;
      }
    }
  }
}

async function createFollowRequests(users: PrismaUser[]) {
  for (const user of users) {
    const numRequests = faker.number.int({
      min: 0,
      max: MAX_FOLLOW_REQUESTS_PER_USER,
    });
    // Get users who are not already following this user
    const potentialRequesters = users.filter((u) => u.id !== user.id);
    const requesters = faker.helpers.arrayElements(
      potentialRequesters,
      numRequests
    );

    for (const requester of requesters) {
      try {
        await prisma.followRequest.create({
          data: {
            senderId: requester.id,
            receiverId: user.id,
            createdAt: faker.date.recent({ days: 14 }),
          },
        });
      } catch (error) {
        // Ignore duplicate follow requests
        throw error;
      }
    }
  }
}

async function createBlocks(users: PrismaUser[]) {
  for (const user of users) {
    const numBlocks = faker.number.int({ min: 0, max: MAX_BLOCKS_PER_USER });
    const blockedUsers = faker.helpers.arrayElements(
      users.filter((u) => u.id !== user.id), // Can't block yourself
      numBlocks
    );

    for (const blocked of blockedUsers) {
      try {
        await prisma.block.create({
          data: {
            blockerId: user.id,
            blockedId: blocked.id,
            createdAt: faker.date.recent({ days: 30 }),
          },
        });
      } catch (error) {
        // Ignore duplicate blocks
        throw error;
      }
    }
  }
}

async function createNotifications(users: PrismaUser[]) {
  const notificationTypes = Object.values(NotificationType);

  for (const user of users) {
    const numNotifications = faker.number.int({
      min: 1,
      max: MAX_NOTIFICATIONS_PER_USER,
    });

    for (let i = 0; i < numNotifications; i++) {
      const type = faker.helpers.arrayElement(notificationTypes);
      let title = "";
      let description = "";

      // Create appropriate notification text based on type
      switch (type) {
        case "mention":
          title = "New mention";
          description = `${
            faker.helpers.arrayElement(users).name
          } mentioned you in a post`;
          break;
        case "followRequestRecieved":
          title = "New follow request";
          description = `${
            faker.helpers.arrayElement(users).name
          } wants to follow you`;
          break;
        case "followRequestAccepted":
          title = "Follow request accepted";
          description = `${
            faker.helpers.arrayElement(users).name
          } accepted your follow request`;
          break;
        case "followThreshold":
          title = "Milestone reached!";
          description = `Congratulations! You've reached ${faker.number.int({
            min: 10,
            max: 1000,
          })} followers`;
          break;
        case "like":
          title = "New like";
          description = `${
            faker.helpers.arrayElement(users).name
          } liked your post`;
          break;
        case "likeThreshold":
          title = "Popular post!";
          description = `Your post has received ${faker.number.int({
            min: 10,
            max: 100,
          })} likes`;
          break;
        case "comment":
          title = "New comment";
          description = `${
            faker.helpers.arrayElement(users).name
          } commented on your post`;
          break;
        case "commentThreshold":
          title = "Engaging post!";
          description = `Your post has received ${faker.number.int({
            min: 5,
            max: 50,
          })} comments`;
          break;
        case "block":
          title = "User blocked";
          description = `You've blocked ${
            faker.helpers.arrayElement(users).name
          }`;
          break;
        case "unblock":
          title = "User unblocked";
          description = `You've unblocked ${
            faker.helpers.arrayElement(users).name
          }`;
          break;
        case "birthday":
          title = "Happy Birthday!";
          description = `Wishing you a wonderful birthday, ${user.name}!`;
          break;
      }

      await prisma.notification.create({
        data: {
          type,
          userId: user.id,
          title,
          description,
          dismissed: faker.datatype.boolean(),
          isRead: faker.datatype.boolean(),
          isDeleted: false,
          createdAt: faker.date.recent({ days: 10 }),
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
