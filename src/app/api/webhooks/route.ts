import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";

import prisma from "@/lib/client";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env"
    );
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", {
      status: 400,
    });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", {
      status: 400,
    });
  }

  if (evt.type === "user.created") {
    try {
      await prisma.user.create({
        data: {
          id: evt.data.id,
          username: evt.data.username!,
          name: evt.data.first_name!,
          surname: evt.data.last_name!,
          avatar: evt.data.image_url,
        },
      });
    } catch (error) {
      console.error("Error: Could not create user", error);

      return new Response("Error: Could not create user", {
        status: 400,
      });
    }
  }

  if (evt.type === "user.updated") {
    try {
      await prisma.user.update({
        where: {
          id: evt.data.id,
        },
        data: {
          username: evt.data.username!,
          name: evt.data.first_name!,
          surname: evt.data.last_name!,
          avatar: evt.data.image_url,
        },
      });
    } catch (error) {
      console.error("Error: Could not update user", error);
      return new Response("Error: Could not update user", {
        status: 400,
      });
    }
  }

  if (evt.type === "user.deleted") {
    try {
      await prisma.user.delete({
        where: {
          id: evt.data.id,
        },
      });
    } catch (error) {
      console.error("Error: Could not delete user", error);
      return new Response("Error: Could not delete user", {
        status: 400,
      });
    }
  }

  return new Response("Webhook received", { status: 200 });
}
