# Socialite - Modern Social Networking Platform

A full-stack social media application built with Next.js, TypeScript, and Prisma that demonstrates advanced frontend and backend development skills.

![Socialite App Screenshot](https://via.placeholder.com/1200x600?text=Socialite)

## 🚀 Project Overview

Socialite is a comprehensive social networking platform that enables users to connect, share content, and interact in a modern, responsive interface. This project showcases my ability to implement complex features while maintaining clean architecture and code quality.

## 💻 Technology Stack

### Frontend

- **Next.js 14**: Leveraging App Router, Server Components, and Server Actions
- **React**: Custom hooks, Context API, and optimistic updates
- **TypeScript**: Type-safe development with robust interfaces
- **Tailwind CSS**: Utility-first approach for responsive design
- **shadcn/ui**: High-quality, accessible UI components

### Backend

- **Prisma ORM**: Type-safe database queries and schema management
- **PostgreSQL**: Relational database for structured data storage
- **Clerk Authentication**: User management with robust webhook integration
- **Next.js API Routes**: Serverless functions for data operations

## 🏗️ Key Technical Features

### Advanced Posts Management System

The application features a sophisticated posts management system with:

```typescript
// Example of optimistic updates in post interactions
const toggleLike = (postId: string) => {
  startTransition(() => {
    setOptimisticPosts((prev) =>
      mutatePost(
        postId,
        (post) => {
          const isLiked = post.likes.some((like) => like.userId === userId);
          return {
            ...post,
            _count: {
              ...post._count,
              likes: isLiked ? post._count.likes - 1 : post._count.likes + 1,
            },
            likes: isLiked
              ? post.likes.filter((like) => like.userId !== userId)
              : [...post.likes, { userId }],
          };
        },
        prev
      )
    );
  });
  toggleLikeAction(postId);
};
```

- **Context-based state management** with optimistic updates for immediate feedback
- **Multi-level comment threading** with efficient pagination
- **Real-time draft handling** for edits and replies with validation
- **Complex social interactions** (likes, follows, replies) with instant UI updates
- **Intelligent content organization** with nested threading and efficient state updates

### URL-based Search and Filtering System

A robust search and filtering system enables:

```typescript
// Composing complex database queries based on URL parameters
const where: Prisma.PostWhereInput = {
  NOT: {
    images: { isEmpty: true },
  },
  ...(!displayBlocked
    ? {
        author: {
          blockedBy: { none: { id: userId } },
        },
      }
    : {}),
  ...(query
    ? {
        OR: [
          { author: { username: { contains: query } } },
          { author: { name: { contains: query } } },
          { text: { contains: query } },
        ],
      }
    : {}),
};
```

- **Parameter-based filtering** preserved in URL structure for shareable views
- **Composable filter combinations** for targeted content discovery
- **Debounced search implementation** for performance optimization
- **Bookmarkable filtered views** that persist across sessions
- **Efficient database queries** with Prisma for optimal performance

### Webhook Integration and User Management

A comprehensive user management system featuring:

- **Real-time user data synchronization** between Clerk authentication and database
- **Automatic handling of user lifecycle events** (creation, updates, deletion)
- **Secure authentication flows** with proper authorization checks
- **Consistent user data** across authentication and application layers
- **Scalable approach** for handling growing user bases

## 💪 Technical Implementations

### Optimistic UI Updates with Server Consistency

The application provides immediate feedback while maintaining data integrity:

```typescript
// PostProvider implementation for optimistic updates
const [posts, setPosts] = useState<Post[]>(initialPosts);
const [optimisticPosts, setOptimisticPosts] = useOptimistic<Post[]>(posts);
const [, startTransition] = useTransition();

// Updating UI instantly before server confirmation
startTransition(() => {
  setOptimisticPosts((prev) =>
    mutatePost(
      postId,
      (post) => ({
        /* optimistic update logic */
      }),
      prev
    )
  );
});
// Actual server action
toggleLikeAction(postId);
```

### Complex Social Relationship Management

The application handles various user relationships with:

```typescript
// Server action for follow/unfollow functionality
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
        where: { id: existingFollow.id },
      });
    } else {
      // Handle follow request logic...
    }
    revalidatePath("/");
  } catch (err) {
    console.log(err);
    throw new Error("Something went wrong!");
  }
};
```

### Media Management System

Sophisticated media handling with:

- **Gallery view with filtering options** for easy browsing
- **Modal-based media viewing** with carousel navigation
- **Pagination support** for efficient loading of large media collections
- **Integration with post creation/editing flow**
- **Responsive image display** across device sizes

## 🔍 What Sets This Project Apart

- **Production-Grade Architecture**: Clean separation of concerns and scalable patterns
- **Performance Optimization**: Efficient data fetching, pagination, and rendering
- **TypeScript Integration**: End-to-end type safety from database to UI
- **Modern UI/UX**: Optimistic updates for immediate feedback and responsive design
- **Complex Feature Implementation**: Social graph, content management, and media handling

## 📂 Project Structure

```
src/
├── components/       # UI components
│   ├── ui/           # Reusable UI elements
│   ├── posts/        # Post-related components
│   ├── profile/      # Profile-related components
│   └── shared/       # Shared components
├── hooks/            # Custom React hooks including post-store
├── lib/              # Utility functions and shared code
├── app/              # Next.js app router pages
└── middleware.ts     # Auth middleware
```

---

_This project demonstrates my experience with modern full-stack development, focusing on scalable architecture, complex state management, and polished user experiences._
