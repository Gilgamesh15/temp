"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useActionState, useTransition, useEffect, useRef } from "react";
import { CldUploadWidget, CloudinaryUploadWidgetInfo } from "next-cloudinary";
import { ImagePlus, X, Send, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

import { AddPostDefaultValues, AddPostSchema } from "@/lib/schemas";
import { createPostAction } from "@/lib/actions";
import { toFormData } from "@/lib/utils";
import useCaretPosition from "@/hooks/use-caret-position";
import useAutoResizableTextarea from "@/hooks/use-resizable-textarea";
import MentionPopover from "./MentionPopover";

const AddPost = () => {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(createPostAction, {
    errors: {
      text: undefined,
      images: undefined,
    },
    code: undefined,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useAutoResizableTextarea(textareaRef);
  const caretPosition = useCaretPosition(textareaRef);

  const form = useForm<z.infer<typeof AddPostSchema>>({
    resolver: zodResolver(AddPostSchema),
    defaultValues: AddPostDefaultValues,
  });

  useEffect(() => {
    if (state.errors) {
      Object.entries(state.errors).forEach(([key, value]) => {
        if (value) {
          form.setError(key as keyof z.infer<typeof AddPostSchema>, {
            message: typeof value === "string" ? value : value.join(", "),
          });
        }
      });
    }
  }, [state?.errors, form]);

  const handleSubmit = form.handleSubmit((data) => {
    startTransition(() => {
      formAction(toFormData(data));
    });
  });

  useEffect(() => {
    toast.dismiss();

    if (isPending) {
      toast.loading("Creating post...");
    } else if (state.code === 401) {
      toast.error("Unauthorized.", {
        description: "You must be logged in to create a post.",
      });
    } else if (state.code === 400) {
      toast.warning("Failed to create post.", {
        description: "Please check the fields and try again.",
      });
    } else if (state.code === 201) {
      toast.success("Post created!", {
        description: "Your post has been created.",
      });
    } else if (state.code === 500) {
      toast.error("Failed to create post.", {
        description: "Please try again later.",
      });
    }
  }, [state.code, isPending]);

  const text = form.getValues("text");
  const mentions = text.match(/@\w+$/g);
  const lastMention = mentions?.[0]?.replace(/@/, "");

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Create Post</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder="What's on your mind?"
                          className="resize-none"
                          {...field}
                          ref={textareaRef}
                        />
                        <MentionPopover
                          lastMention={lastMention}
                          caretPosition={caretPosition}
                          onSelect={(user) => {
                            const textBeforeMention = text.substring(
                              0,
                              text.lastIndexOf("@")
                            );
                            const replacementText = `${textBeforeMention}@${user.username} `;
                            field.onChange(replacementText);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      You can <span className="text-blue-500">@mention</span>{" "}
                      other users and organizations.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-2">
                          {field.value?.map((image, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                field.onChange(
                                  field.value?.filter(
                                    (_, prevIndex) => prevIndex !== index
                                  )
                                )
                              }
                              className="relative overflow-hidden group"
                            >
                              <Image
                                src={image}
                                alt={`Post image - ${index + 1}`}
                                fill
                                className="object-cover"
                              />

                              <X className="absolute p-1.5 min-h-full min-w-full bg-secondary text-secondary-foreground opacity-0 group-hover:opacity-75 transition-opacity" />
                            </Button>
                          ))}

                          <CldUploadWidget
                            uploadPreset="media_files"
                            options={{
                              maxFiles: 1,
                              resourceType: "image",
                              clientAllowedFormats: ["jpg", "png", "jpeg"],
                              maxFileSize: 5000000,
                            }}
                            onSuccess={(result) => {
                              const res =
                                result.info as CloudinaryUploadWidgetInfo;

                              field.onChange(
                                field.value
                                  ? [...field.value, res.secure_url]
                                  : [res.secure_url]
                              );
                            }}
                          >
                            {({ open }) => (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => open()}
                              >
                                <ImagePlus />
                              </Button>
                            )}
                          </CldUploadWidget>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="animate-spin"></Loader2>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
};

export default AddPost;
