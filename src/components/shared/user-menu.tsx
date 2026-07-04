"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { signOutAction } from "@/server/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ShellUser } from "@/components/shared/workspace-shell";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({ user }: { user: ShellUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          data-testid="user-menu-trigger"
          className="flex items-center gap-2 px-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-slate-900 text-xs text-white">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" data-testid="menu-settings">
            <Settings className="mr-2 h-4 w-4" aria-hidden />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="menu-sign-out"
          onSelect={() => {
            void signOutAction();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
