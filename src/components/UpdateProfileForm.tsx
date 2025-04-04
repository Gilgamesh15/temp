"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActionState, useEffect, useState, useTransition } from "react";
import { updateProfileAction } from "@/lib/actions";
import { UpdateProfileSchema as formSchema } from "@/lib/schemas";
import { Textarea } from "./ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn, getAvatarSrc, toFormData } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, UserCircle, Settings, Edit } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { CldUploadWidget, CloudinaryUploadWidgetInfo } from "next-cloudinary";
import Image from "next/image";
import { Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface UpdateProfileFormProps {
  defaultValues: z.infer<typeof formSchema>;
}

const UpdateProfileForm = ({ defaultValues }: UpdateProfileFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(updateProfileAction, {
    errors: {
      name: undefined,
      surname: undefined,
      username: undefined,
      description: undefined,
      birthDate: undefined,
      gender: undefined,
      avatar: undefined,
    },
    code: undefined,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    if (state?.errors) {
      Object.entries(state.errors).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          form.setError(key as keyof z.infer<typeof formSchema>, {
            message: value.join(", "),
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/** EDIT BUTTON */}
      <DialogTrigger asChild>
        <Button variant="secondary" className="aspect-square size-10">
          <Edit />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <DialogDescription>Edit your profile information.</DialogDescription>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic-info">
              <TabsList className="flex w-full">
                <TabsTrigger value="basic-info" className="flex-1">
                  <UserCircle className="mr-2" />
                  Basic Information
                </TabsTrigger>

                <TabsTrigger value="profile-customization" className="flex-1">
                  <Settings className="mr-2" />
                  Profile Customization
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic-info">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Update your basic information.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your first name"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Your legal first name
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="surname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your last name"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Your legal last name
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Choose a unique username"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This will be your public identifier across the
                            platform
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Select your birth date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value ?? undefined}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() ||
                                    date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              Must be at least 13 years old
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value ?? undefined}
                            >
                              <FormControl>
                                <SelectTrigger className="mt-0">
                                  <SelectValue placeholder="Select your gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Used for demographic purposes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profile Customization Tab */}
              <TabsContent value="profile-customization" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Customization</CardTitle>
                    <CardDescription>
                      Update your profile settings.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Placeholder for future avatar upload component */}
                    <FormField
                      control={form.control}
                      name="avatar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="avatar-upload">
                            Profile Picture
                          </FormLabel>
                          <FormControl>
                            {/* Upload Widget */}
                            <CldUploadWidget
                              uploadPreset="avatar"
                              options={{
                                maxFiles: 1,
                                resourceType: "image",
                                clientAllowedFormats: ["jpg", "png", "jpeg"],
                                maxFileSize: 5000000,
                              }}
                              onSuccess={(result) => {
                                const uploadResult =
                                  result.info as CloudinaryUploadWidgetInfo;

                                form.setValue(
                                  "avatar",
                                  uploadResult.secure_url
                                );
                                field.onChange(uploadResult.secure_url);
                              }}
                            >
                              {({ open }) => (
                                <div className="flex flex-col items-center gap-4">
                                  {/* Image Preview Area */}
                                  <div className="relative border w-60 h-60 rounded-3xl overflow-hidden shadow-xl">
                                    <Image
                                      src={
                                        field.value ||
                                        getAvatarSrc(defaultValues)
                                      }
                                      alt={"Your avatar preview"}
                                      fill
                                      className="object-cover transition-transform duration-300 hover:scale-105"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      document.body.style.pointerEvents =
                                        "none";
                                      open("local");
                                    }}
                                    onBlur={() => {
                                      document.body.style.pointerEvents =
                                        "auto";
                                    }}
                                  >
                                    <Upload className="w-4 h-4" />
                                    {field.value
                                      ? "Change Picture"
                                      : "Upload Picture"}
                                  </Button>
                                </div>
                              )}
                            </CldUploadWidget>
                          </FormControl>
                          <FormDescription>
                            Upload a profile picture (JPG or PNG, max 5MB)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>About Me</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Share a bit about yourself, your interests, or what you do"
                              className="resize-none"
                              {...field}
                              value={field.value ?? undefined}
                            />
                          </FormControl>
                          <FormDescription>
                            This description will be displayed on your public
                            profile
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Button disabled={isPending} type="submit" className="w-full">
              {isPending ? "Saving Changes..." : "Save Profile"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateProfileForm;
