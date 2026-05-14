import { Loader2 } from "lucide-react";

import { BrandLockup } from "@/components/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConfirmLoading() {
  return (
    <main className="relative flex min-h-svh items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex justify-center">
          <BrandLockup align="center" />
        </div>
        <Card className="border-border/70 bg-card/88">
          <CardHeader className="items-center space-y-5 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:text-emerald-200">
              <Loader2 className="size-7 animate-spin" />
            </div>
            <CardTitle className="font-display text-4xl leading-none text-foreground sm:text-5xl">
              Loading confirmation
            </CardTitle>
            <CardDescription className="text-base leading-7">
              Preparing your secure email confirmation page.
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    </main>
  );
}
