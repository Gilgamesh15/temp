import { z } from "zod";

export const UpdateProfileSchema = z.object({
  name: z.string().nonempty(),
  surname: z.string().nonempty(),
  username: z.string().nonempty(),
  description: z.string().max(255).nullable(),
  birthDate: z.date().min(new Date(1900, 0, 1)).max(new Date()).nullable(),
  gender: z.enum(["male", "female", "other"]).optional(),
  avatar: z.string().nullable(),
});

export const AddPostSchema = z.object({
  text: z.string().min(1).max(280),
  images: z.array(z.string()).max(8).optional(),
  parentId: z.string().nullable(),
});

export const AddPostDefaultValues: z.infer<typeof AddPostSchema> = {
  text: "",
  images: [],
  parentId: null,
};

export const UpdatePostSchema = z.object({
  text: z.string().min(1).max(280),
  images: z.array(z.string()).max(8).optional(),
  postId: z.string().uuid(),
});
