import { ClerkLoaded, ClerkLoading, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  Loader2,
  LogOut,
  Menu,
  Search,
  Settings,
  User2,
} from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

import SearchBar from "./SearchBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { currentUser } from "@clerk/nextjs/server";

const Navbar = async () => {
  const user = await currentUser();

  if (!user) return null;

  return (
    <nav className="gap-8 fixed z-50 w-screen h-16 left-0 top-0 bg-background shadow-sm flex items-center justify-between px-4 md:px-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu />
          </Button>
        </SheetTrigger>

        <SheetContent side="left">
          {/**
           * //TODO Add links
           */}
        </SheetContent>
      </Sheet>

      <Link href="/" className="flex items-center gap-3">
        <Image src="/logo.png" alt="Logo" width={40} height={40} />
        <span className="text-2xl font-bold capitalize">Socialite</span>
      </Link>

      <SearchBar className="hidden md:block flex-1 max-w-2xl" />

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="md:hidden" asChild>
          <Link href="/search/users">
            <Search />
          </Link>
        </Button>

        <Button variant="ghost" size="icon" asChild>
          <Link href="/notifications">
            <Bell />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User2 />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <ClerkLoaded>
              <DropdownMenuLabel>Account</DropdownMenuLabel>

              <DropdownMenuItem asChild>
                <Link href={`/profile/${user.username}`}>
                  <User2 />
                  Profile
                </Link>
              </DropdownMenuItem>

              <SignOutButton>
                <DropdownMenuItem>
                  <LogOut />
                  Sign Out
                </DropdownMenuItem>
              </SignOutButton>

              <SignOutButton>
                <DropdownMenuItem>
                  <Settings />
                  Settings
                </DropdownMenuItem>
              </SignOutButton>
            </ClerkLoaded>

            <ClerkLoading>
              <Loader2 className="size-4 animate-spin" />
            </ClerkLoading>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
