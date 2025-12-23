"use client"

import { Search, Bell, User, Menu } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function AppNavbar() {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b border-border bg-white/95 px-6 backdrop-blur-md">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-1 items-center gap-4 md:gap-8">
                <form className="ml-auto flex-1 sm:flex-initial">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="搜索项目、图纸、任务..."
                            className="pl-8 sm:w-[300px] md:w-[400px] lg:w-[500px] bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                        />
                    </div>
                </form>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:bg-accent/50">
                        <Bell className="h-5 w-5" />
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
                    </Button>
                    <div className="h-4 w-px bg-border/50 mx-1" />
                    <div className="flex items-center gap-3 pl-2">
                        <div className="flex flex-col items-end gap-0">
                            <span className="text-sm font-semibold">张工 (Admin)</span>
                            <span className="text-[10px] text-muted-foreground">研发部 · 核心评审员</span>
                        </div>
                        <Avatar className="h-9 w-9 border-2 border-primary/20">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>NPI</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
        </header>
    )
}
