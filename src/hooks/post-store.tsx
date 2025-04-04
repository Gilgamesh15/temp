"use client";

import { Post, User } from "@/lib/types";
import { findPost, mutatePost, filterOutPost } from "@/lib/utils";
import {
  createContext,
  useContext,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  deletePost as deletePostAction,
  getMoreChildren,
  toggleFollow as toggleFollowAction,
  toggleLike as toggleLikeAction,
  updatePost,
} from "@/lib/actions";

// Context interface for post operations
interface PostContextType {
  toggleLike: (postId: string) => void;
  toggleFollow: (postId: string) => void;
  loadMoreChildren: (postId: string, pageSize: number) => Promise<void>;
  deletePost: (postId: string) => void;
  initReply: (postId: string) => void;
  setReplyState: (postId: string, payload: { text?: string }) => void;
  submitReply: (postId: string, payload: { text?: string }) => Promise<void>;
  initEdit: (postId: string) => void;
  setEditState: (postId: string, payload: { text?: string }) => void;
  submitEdit: (postId: string, payload: { text?: string }) => Promise<void>;
  isLoadingChildren: (postId: string) => boolean;
  isEditPost: (postId: string) => boolean;
  isReplyPost: (postId: string) => boolean;
  cancelEdit: (postId: string) => void;
}

const PostContext = createContext<PostContextType | null>(null);

// Provider props interface
interface PostProviderProps {
  children: (
    posts: Post[],
    getMorePosts: () => Promise<void>
  ) => React.ReactNode;
  initialPosts?: Post[];
  currentUser: User;
}

/**
 * PostProvider component that manages the state and operations for posts
 */
const PostProvider = ({
  children,
  initialPosts = [],
  currentUser,
}: PostProviderProps) => {
  // State management
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [optimisticPosts, setOptimisticPosts] = useOptimistic<Post[]>(posts);
  const [, startTransition] = useTransition();
  const [loadingChildrenPostId, setLoadingChildrenPostId] = useState<
    null | string
  >(null);

  // Draft management for replies and edits
  const [draftState, setDraftState] = useState<null | {
    type: "reply" | "edit";
    postId: string;
  }>(null);

  const userId = currentUser.id;

  const getMorePosts = async () => {
    try {
      const newPosts = await getMoreChildren({
        skip: posts.length,
        take: 10,
      });

      setPosts((prev) => [...prev, ...newPosts]);
    } catch (error) {
      console.log(error);
    }
  };

  // Handle liking/unliking a post with optimistic updates
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

  // Handle following/unfollowing a user with optimistic updates
  const toggleFollow = (postId: string) => {
    const post = findPost(postId, posts);
    if (!post) return;

    startTransition(() => {
      setOptimisticPosts((prev) =>
        mutatePost(
          postId,
          (post) => {
            const { followings, followRequestsReceived } = post.author;
            const isFollowing = followings.some(
              (f) => f.followingId === userId
            );
            const isFollowRequest = followRequestsReceived.some(
              (r) => r.senderId === userId
            );

            return {
              ...post,
              author: {
                ...post.author,
                followings: isFollowing
                  ? followings.filter((f) => f.followingId !== userId)
                  : followings,
                followRequestsReceived: isFollowRequest
                  ? followRequestsReceived.filter((r) => r.senderId !== userId)
                  : [...followRequestsReceived, { senderId: userId }],
              },
            };
          },
          prev
        )
      );
    });

    toggleFollowAction(userId);
  };

  // Load more child posts
  const loadMoreChildren = async (postId: string, pageSize: number) => {
    const post = findPost(postId, posts);
    if (!post) return;

    setLoadingChildrenPostId(postId);

    try {
      const newChildren = await getMoreChildren({
        parentId: post.id,
        take: pageSize,
        skip: post.children?.length,
      });

      startTransition(() => {
        setOptimisticPosts((prev) => {
          return mutatePost(
            postId,
            (post) => {
              if (!post.children)
                return { ...post, children: [...newChildren] };
              return { ...post, children: [...post.children, ...newChildren] };
            },
            prev
          );
        });

        setPosts((prev) => {
          return mutatePost(
            postId,
            (post) => {
              if (!post.children)
                return { ...post, children: [...newChildren] };
              return { ...post, children: [...post.children, ...newChildren] };
            },
            prev
          );
        });
      });
    } catch (error) {
      console.error("Failed to load more children:", error);
    } finally {
      setLoadingChildrenPostId(null);
    }
  };

  const deletePost = async (postId: string) => {
    startTransition(() => {
      setOptimisticPosts((prev) => filterOutPost(postId, prev));
    });

    try {
      await deletePostAction(postId);

      setPosts((prev) => filterOutPost(postId, prev));
    } catch (error) {
      console.log("Failed to delete post:", error);

      toast.error("Failed to delete post!");
    }
  };

  // Initialize a reply to a post
  const initReply = (postId: string) => {
    //prevent replies to replies AND multiple replies to the same post
    if (
      draftState?.type === "reply" &&
      (draftState.postId === postId ||
        findPost(draftState.postId, posts)?.parentId === postId)
    )
      return;

    //cleanup previous draft to prevent more then one dummy posts
    if (draftState) {
      setPosts(filterOutPost(draftState.postId, posts));
    }

    const tempId = `temp-${Date.now()}`;

    setDraftState({
      type: "reply",
      postId: tempId,
    });

    const dummyPost: Post = {
      id: tempId,
      text: "",
      authorId: userId,
      author: currentUser,
      parentId: postId,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        likes: 0,
        children: 0,
      },
      likes: [],
      images: [],
    };

    setPosts((prev) =>
      mutatePost(
        postId,
        (post) => ({
          ...post,
          children: [dummyPost, ...(post.children ?? [])],
        }),
        prev
      )
    );
  };

  // Update the state of a draft reply
  const setReplyState = (postId: string, payload: { text?: string }) => {
    if (draftState?.type === "reply" && draftState.postId === postId) {
      setPosts((prev) =>
        mutatePost(
          postId,
          (post) => ({ ...post, text: payload.text ?? "" }),
          prev
        )
      );
    }
  };

  // Submit a reply
  const submitReply = async (postId: string, payload: { text?: string }) => {
    if (draftState?.type !== "reply" || draftState.postId !== postId) return;

    const post = findPost(postId, posts);
    if (!post) return;

    try {
      await {
        text: payload.text || post.text || "",
        parentId: post.parentId ?? undefined,
      };

      // Reset draft state and refresh posts
      setDraftState(null);

      // Here you might want to fetch the actual post with the real ID
      // rather than using a temporary one
    } catch (error) {
      console.error("Failed to submit reply:", error);
    }
  };

  // Initialize editing a post
  const initEdit = (postId: string) => {
    if (draftState?.type === "edit" && draftState.postId === postId) return;

    setDraftState({
      type: "edit",
      postId,
    });
  };

  const cancelEdit = () => {
    setDraftState(null);
  };

  // Update the state of a post being edited
  const setEditState = (postId: string, payload: { text?: string }) => {
    if (draftState?.type !== "edit" || draftState.postId !== postId) return;

    setPosts((prev) =>
      mutatePost(
        postId,
        (post) => ({ ...post, text: payload.text ?? post.text ?? "" }),
        prev
      )
    );
  };

  // Submit an edit to a post
  const submitEdit = async (
    postId: string,
    payload: { text?: string; images?: string[] }
  ) => {
    if (draftState?.type !== "edit" || draftState.postId !== postId) return;

    const post = findPost(postId, posts);
    if (!post) return;

    try {
      await updatePost({
        postId,
        text: payload.text || post.text || "",
        images: payload.images || post.images || [],
      });

      setDraftState(null);
    } catch (error) {
      console.error("Failed to submit edit:", error);
    }
  };

  return (
    <PostContext.Provider
      value={{
        toggleLike,
        toggleFollow,
        loadMoreChildren,
        deletePost,
        initReply,
        setReplyState,
        submitReply,
        initEdit,
        setEditState,
        submitEdit,
        isLoadingChildren: (postId: string) => loadingChildrenPostId === postId,
        isEditPost: (postId: string) =>
          draftState?.type === "edit" && draftState.postId === postId,
        isReplyPost: (postId: string) =>
          draftState?.type === "reply" && draftState.postId === postId,
        cancelEdit,
      }}
    >
      {children(optimisticPosts, getMorePosts)}
    </PostContext.Provider>
  );
};

/**
 * Hook to use post operations for a specific post
 */
const usePostContext = () => {
  const context = useContext(PostContext);
  if (context === null) {
    throw new Error("usePostContext must be used within a PostProvider");
  }
  return context;
};

/**
 * Custom hook to use post operations for a specific post
 */
const usePost = (postId: string) => {
  const {
    toggleLike,
    toggleFollow,
    loadMoreChildren,
    deletePost,
    initReply,
    setReplyState,
    submitReply,
    initEdit,
    setEditState,
    submitEdit,
    isLoadingChildren,
    isEditPost,
    isReplyPost,
    cancelEdit,
  } = usePostContext();

  return {
    toggleLike: () => toggleLike(postId),
    toggleFollow: () => toggleFollow(postId),
    loadMoreChildren: (pageSize: number) => loadMoreChildren(postId, pageSize),
    deletePost: () => deletePost(postId),
    initReply: () => initReply(postId),
    setReplyState: (payload: { text?: string }) =>
      setReplyState(postId, payload),
    submitReply: (payload: { text?: string }) => submitReply(postId, payload),
    initEdit: () => initEdit(postId),
    setEditState: (payload: { text?: string }) => setEditState(postId, payload),
    submitEdit: (payload: { text?: string }) => submitEdit(postId, payload),
    isLoadingChildren: isLoadingChildren(postId),
    isEditPost: isEditPost(postId),
    isReplyPost: isReplyPost(postId),
    cancelEdit: () => cancelEdit(postId),
  };
};

export { PostProvider, usePost };
export type { Post, User };
