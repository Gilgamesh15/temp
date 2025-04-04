import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { Post } from "@/hooks/post-store";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumSignificantDigits: 3,
  }).format(num);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export const getTimeElapsed = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = diff / (1000 * 60);
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = hours / 24;
  if (days < 7) return `${Math.floor(days)}d ago`;
  const months = days / 30;
  if (months < 12) return `${Math.floor(months)}mon ago`;
  const years = months / 12;
  if (years < 10) return `${Math.floor(years)}y ago`;
  return date.toISOString();
};

export const getAvatarSrc = (
  user: {
    avatar?: string | null;
    gender?: "female" | "male" | "other" | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } & Record<string, any>
) => {
  return (
    user.avatar ??
    (user.gender === "female"
      ? "/avatar-fallback-female.jpeg"
      : user.gender === "male"
      ? "/avatar-fallback-male.jpg"
      : "/avatar-fallback-other.jpeg")
  );
};

export const mutatePost = (
  postId: string,
  mutationFn: (post: Post) => Post,
  posts: Post[]
): Post[] => {
  return posts.map((post) => {
    if (post.id === postId) {
      return mutationFn(post);
    }

    if (!post.children) return post;

    return { ...post, children: mutatePost(postId, mutationFn, post.children) };
  });
};

export const findPost = (postId: string, posts: Post[]): Post | undefined => {
  for (const post of posts) {
    if (post.id === postId) return post;
    if (!post.children) continue;
    const child = findPost(postId, post.children);
    if (child) return child;
  }
  return undefined;
};

export const filterOutPost = (postId: string, posts: Post[]): Post[] => {
  return posts
    .filter((post) => post.id !== postId)
    .map((post) => ({
      ...post,
      children: post.children ? filterOutPost(postId, post.children) : [],
    }));
};

export function toFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, JSON.stringify(value));
  });
  return formData;
}

export const fromFormData = (formData: FormData): Record<string, unknown> => {
  const data: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") {
      throw new Error(
        "File handling is not yet implemented. " +
          "If attempting to handle file uploads in parseFormData util function you need to implement it first."
      );
    }

    data[key] = JSON.parse(value);
  }
  return data;
};
