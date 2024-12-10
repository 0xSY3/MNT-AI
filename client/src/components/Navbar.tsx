import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Code2,
  BarChart2,
  FileCode,
  Users,
  Home,
  TestTube,
} from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-8 flex items-center space-x-2">
          <Code2 className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">MNT DEV AI</span>
        </div>

        <div className="flex space-x-4">
          <Link href="/">
            <Button variant="ghost">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>

          <Link href="/contract-builder">
            <Button variant="ghost">
              <Code2 className="mr-2 h-4 w-4" />
              Contract Builder
            </Button>
          </Link>

          <Link href="/test-suite">
            <Button variant="ghost">
              <TestTube className="mr-2 h-4 w-4" />
              Test Suite
            </Button>
          </Link>

          <Link href="/templates">
            <Button variant="ghost">
              <FileCode className="mr-2 h-4 w-4" />
              Templates
            </Button>
          </Link>

          <Link href="/forum">
            <Button variant="ghost">
              <Users className="mr-2 h-4 w-4" />
              Forum
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
