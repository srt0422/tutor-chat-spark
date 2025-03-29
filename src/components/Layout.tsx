
import React, { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/ModeToggle";
import { Book, Code, FileCode, Home, LogIn } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-primary/5">
        <div className="container py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileCode className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Industry Coding Tutor</h1>
          </div>
          <div className="flex items-center gap-3">
            <nav>
              <ul className="flex gap-4">
                <li>
                  <Button variant="ghost" size="sm">
                    <Home className="h-4 w-4 mr-1" />
                    Home
                  </Button>
                </li>
                <li>
                  <Button variant="ghost" size="sm">
                    <Book className="h-4 w-4 mr-1" />
                    Learn
                  </Button>
                </li>
                <li>
                  <Button variant="ghost" size="sm">
                    <Code className="h-4 w-4 mr-1" />
                    Practice
                  </Button>
                </li>
              </ul>
            </nav>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm">
              <LogIn className="h-4 w-4 mr-1" />
              Sign In
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t bg-primary/5 py-4 text-center text-sm text-muted-foreground">
        <div className="container">
          <p>© 2023 Industry Coding Tutor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
