"use client";

import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { type Post, PostProvider, usePost, User } from "@/hooks/post-store";
import { Button } from "@/components/ui/button";
import {
  Check,
  Edit2,
  Eye,
  Loader2,
  MessageCirclePlus,
  MessageSquare,
  MessageSquareDashed,
  MoreHorizontal,
  Share2,
  ThumbsUp,
  Trash2,
  UserPlus2,
  X,
} from "lucide-react";
import { cn, getAvatarSrc, getTimeElapsed } from "@/lib/utils";
import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { EmailShareButton } from "react-share";

const CHILDREN_PER_PAGE = 5;
const MARGIN_DEPTH = 32;

const Posts = ({
  initialPosts,
  currentUser,
}: {
  initialPosts?: Post[];
  currentUser: User;
}) => {
  return (
    <div className="space-y-2">
      <PostProvider initialPosts={initialPosts} currentUser={currentUser}>
        {(posts, getMorePosts) => (
          <>
            {posts.map((post) => (
              <Post key={post.id} post={post} />
            ))}
            <Button className="w-full" variant="outline" onClick={getMorePosts}>
              Load more
            </Button>
          </>
        )}
      </PostProvider>
    </div>
  );
};

interface PostProps {
  post: Post;
  depth?: number;
}
const Post = ({ post, depth = 0 }: PostProps) => {
  const {
    toggleLike,
    loadMoreChildren,
    isLoadingChildren,
    initReply,
    initEdit,
    deletePost,
    toggleFollow,
    isEditPost,
    setEditState,
    submitReply,
    isReplyPost,
    submitEdit,
    setReplyState,
    cancelEdit,
  } = usePost(post.id);
  const { userId } = useAuth();

  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLiked = post.likes.some((like) => like.userId === userId);
  const hasMoreChildren = (post.children?.length || 0) < post._count.children;
  const isSelf = userId === post.author.id;
  const isFollowing = post.author.followings.some(
    (following) => following.followingId === userId
  );
  const isFollowRequest = post.author.followRequestsReceived.some(
    (request) => request.senderId === userId
  );

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [post.text]);

  return (
    <div className="space-y-2">
      <Card
        style={{
          marginLeft: depth * MARGIN_DEPTH,
        }}
        className="rounded-2xl border-l-4 border-l-primary"
      >
        <CardHeader className="p-4 pb-0 flex-row justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${post.author.username}`}
              className="relative size-12 rounded-full overflow-hidden border shadow"
            >
              <Image
                src={getAvatarSrc(post.author)}
                alt={`${post.author.username}'s profile picture`}
                fill
                className="object-cover transition-transform duration-200 ease-in-out hover:scale-110"
              />
            </Link>

            <div>
              <Link
                href={`/profile/${post.author.username}`}
                className="font-semibold"
              >
                {post.author.name} {post.author.surname}
              </Link>

              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Link href={`/profile/${post.author.username}`}>
                  @{post.author.username}
                </Link>
                <span>•</span>
                <time dateTime={post.createdAt.toISOString()}>
                  {getTimeElapsed(post.createdAt)}
                </time>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isEditPost}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {isSelf ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/post/${post.id}`}>
                      <Eye />
                      View
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={initEdit}
                    className="flex items-center gap-2"
                  >
                    <Edit2 /> Edit
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={deletePost}
                    className="flex items-center gap-2 text-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onClick={toggleFollow}
                  className="flex items-center gap-2"
                >
                  <UserPlus2 />
                  {isFollowing
                    ? "Unfollow"
                    : isFollowRequest
                    ? "Cancel request"
                    : "Follow"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="p-4">
          {isEditPost || isReplyPost ? (
            <form
              action={(formData) => {
                if (isEditPost)
                  submitEdit({ text: formData.get("text") as string });
                if (isReplyPost)
                  submitReply({ text: formData.get("text") as string });
              }}
              className="flex w-full gap-2"
            >
              <textarea
                name="text"
                className="flex-1 resize-none w-full overflow-y-hidden outline-none"
                value={post.text}
                ref={textareaRef}
                onChange={(e) => {
                  if (isEditPost) setEditState({ text: e.target.value });
                  if (isReplyPost) setReplyState({ text: e.target.value });
                }}
              />

              <div className="flex flex-col gap-2">
                <Button
                  className="flex-1 aspect-square"
                  size="sm"
                  variant="destructive"
                  onClick={cancelEdit}
                >
                  <X />
                </Button>

                <Button
                  className="flex-1 aspect-square"
                  size="sm"
                  type="submit"
                >
                  <Check />
                </Button>
              </div>
            </form>
          ) : (
            <p>{post.text}</p>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 flex-row justify-between">
          <div className="flex items-center gap-2">
            <Button
              disabled={isEditPost}
              onClick={() => {
                if (!isEditPost) toggleLike();
              }}
              variant={isLiked ? "secondary" : "ghost"}
              size="sm"
            >
              <ThumbsUp className={cn(isLiked && "fill-primary")} />
              {post._count.likes ?? 0}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              disabled={isEditPost}
              onClick={() => {
                if (!isEditPost) {
                  if (!post.children?.length) {
                    loadMoreChildren(CHILDREN_PER_PAGE);
                  }
                  setExpanded(!expanded);
                }
              }}
            >
              {expanded ? <MessageSquareDashed /> : <MessageSquare />}
              {post._count.children ?? 0}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={isEditPost}
              onClick={() => {
                if (!isEditPost) {
                  setExpanded(true);
                  initReply();
                }
              }}
            >
              <MessageCirclePlus />
              Reply
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Share2 />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent>
                <EmailShareButton
                  url={`${process.env.NEXT_PUBLIC_SERVER_URL}/${post.id}`}
                  subject="Check out this post!"
                  body={`Check out this post by ${post.author.name} ${post.author.surname}: ${post.text}`}
                  separator="\n"
                >
                  Share via Email
                </EmailShareButton>
              </DialogContent>
            </Dialog>
          </div>
        </CardFooter>
      </Card>

      {!isEditPost && (
        <div className="space-y-2">
          {expanded &&
            post.children?.map((child) => (
              <Post key={child.id} post={child} depth={depth + 1} />
            ))}

          {expanded && hasMoreChildren && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => loadMoreChildren(CHILDREN_PER_PAGE)}
              disabled={isLoadingChildren}
            >
              {isLoadingChildren ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "load more"
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Posts;
