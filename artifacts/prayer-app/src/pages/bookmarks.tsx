import { useListMyBookmarks, useRemoveBookmark } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { BookmarkX, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RedirectToSignIn, Show } from "@clerk/react";

function BookmarksContent() {
  const { data: bookmarks, isLoading, refetch } = useListMyBookmarks();
  const removeBookmark = useRemoveBookmark();
  const { toast } = useToast();

  const handleRemove = (prayerId: number) => {
    removeBookmark.mutate({ prayerId }, {
      onSuccess: () => {
        toast({ title: "Dihapus dari Tersimpan" });
        refetch();
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-serif mb-8">Doa Tersimpan</h1>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-2">Doa Tersimpan</h1>
      <p className="text-muted-foreground mb-8">Kumpulan doa favorit Anda untuk akses cepat.</p>

      {!bookmarks || bookmarks.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
          <h3 className="text-xl font-serif mb-2">Belum ada doa tersimpan</h3>
          <p className="text-muted-foreground mb-6">Jelajahi pustaka doa dan simpan doa yang berarti bagi Anda.</p>
          <Link href="/prayers">
            <Button>Jelajahi Pustaka Doa</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {bookmarks.map(prayer => (
            <Card key={prayer.id} className="flex flex-col h-full hover:shadow-md transition-shadow group relative">
              <CardHeader className="pb-3 flex-1">
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="font-serif text-xl line-clamp-2 leading-snug">
                    <Link href={`/prayer/${prayer.slug}`} className="hover:text-primary before:absolute before:inset-0">
                      {prayer.title}
                    </Link>
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full -mt-1 -mr-2 z-10"
                    onClick={() => handleRemove(prayer.id)}
                    disabled={removeBookmark.isPending}
                  >
                    <BookmarkX className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
                {prayer.categoryName && (
                  <Badge variant="secondary" className="w-fit font-normal mt-2">
                    {prayer.categoryName}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground line-clamp-3">{prayer.summary}</p>
              </CardContent>
              <CardFooter className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{prayer.readingMinutes || 1} mnt</span>
                </div>
                <span className="capitalize">{prayer.group}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function Bookmarks() {
  return (
    <>
      <Show when="signed-in">
        <BookmarksContent />
      </Show>
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
    </>
  );
}
