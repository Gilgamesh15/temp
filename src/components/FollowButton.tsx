"use client";

import { toggleFollow as toggleFollowAction } from "@/lib/actions";
import { useOptimistic, useTransition } from "react";
import { Button } from "./ui/button";

interface FollowButtonProps {
  initialState: "following" | "not_following" | "request_sent";
  userId: string;
}

const FollowButton = ({ initialState, userId }: FollowButtonProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, startTransition] = useTransition();
  const [optimisticFollowState, optimisitcSetFollowState] = useOptimistic(
    initialState,
    (prev) =>
      prev === "following" || prev === "request_sent"
        ? "not_following"
        : "request_sent"
  );

  const toggleFollow = () => {
    startTransition(() => {
      optimisitcSetFollowState(null);
    });

    toggleFollowAction(userId);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      className="flex-1"
      onClick={toggleFollow}
    >
      {optimisticFollowState === "not_following"
        ? "Follow"
        : optimisticFollowState === "request_sent"
        ? "Cancel Request"
        : "Unfollow"}
    </Button>
  );
};

export default FollowButton;
