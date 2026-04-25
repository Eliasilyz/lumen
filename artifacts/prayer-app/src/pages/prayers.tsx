import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useListPrayers, useListCategories, useAddBookmark, useRemoveBookmark, useGetMe } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Bookmark, BookmarkCheck, Clock } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Show, SignInButton, useUser } from "@clerk/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Prayers() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined);
  const [group, setGroup] = useState<string | undefined>(undefined);
  const { user } = useUser();
  const { data: me } = useGetMe({ query: { enabled: !!user } });

  const { data: categories } = useListCategories();
  
  const { data: prayersData, isLoading } = useListPrayers({
    q: debouncedSearch || undefined,
    categorySlug,
    group: group as any,
    limit: 24,
    offset: 0
  });

  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();

  const handleBookmarkToggle = (prayerId: number, isBookmarked: boolean) => {
    if (isBookmarked) {
      removeBookmark.mutate({ prayerId });
    } else {
      addBookmark.mutate({ data: { prayerId } });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-serif text-foreground">Pustaka Doa</h1>
          <p className="text-muted-foreground">Temukan doa untuk setiap langkah perjalanan spiritual Anda.</p>
        </div>
        
        <div className="w-full md:w-auto relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari doa..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-2">
        <Button 
          variant={!categorySlug && !group ? "default" : "outline"} 
          size="sm" 
          onClick={() => { setCategorySlug(undefined); setGroup(undefined); }}
          className="rounded-full"
        >
          Semua Doa
        </Button>
        <Button 
          variant={group === "daily" ? "default" : "outline"} 
          size="sm" 
          onClick={() => { setGroup("daily"); setCategorySlug(undefined); }}
          className="rounded-full"
        >
          Harian
        </Button>
        <Button 
          variant={group === "liturgical" ? "default" : "outline"} 
          size="sm" 
          onClick={() => { setGroup("liturgical"); setCategorySlug(undefined); }}
          className="rounded-full"
        >
          Liturgi
        </Button>
        
        <div className="w-px h-8 bg-border mx-2" />
        
        {categories?.map(cat => (
          <Button 
            key={cat.id}
            variant={categorySlug === cat.slug ? "default" : "outline"} 
            size="sm" 
            onClick={() => { setCategorySlug(cat.slug); setGroup(undefined); }}
            className="rounded-full"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : prayersData?.items.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-xl border border-border">
          <h3 className="text-xl font-serif mb-2">Tidak ada doa ditemukan</h3>
          <p className="text-muted-foreground">Coba ubah kata kunci pencarian atau filter kategori.</p>
          <Button 
            variant="outline" 
            className="mt-6"
            onClick={() => { setSearchTerm(""); setCategorySlug(undefined); setGroup(undefined); }}
          >
            Reset Filter
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {prayersData?.items.map(prayer => {
            const isBookmarked = me?.bookmarkedPrayerIds?.includes(prayer.id) || prayer.bookmarked;
            
            return (
              <Card key={prayer.id} className="flex flex-col h-full hover:shadow-md transition-shadow group relative">
                <CardHeader className="pb-3 flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="font-serif text-xl line-clamp-2 leading-snug">
                      <Link href={`/prayer/${prayer.slug}`} className="hover:text-primary before:absolute before:inset-0">
                        {prayer.title}
                      </Link>
                    </CardTitle>
                    
                    <div className="z-10">
                      <Show when="signed-in">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full -mt-1 -mr-2"
                          onClick={() => handleBookmarkToggle(prayer.id, !!isBookmarked)}
                        >
                          {isBookmarked ? 
                            <BookmarkCheck className="h-5 w-5 text-primary" /> : 
                            <Bookmark className="h-5 w-5 text-muted-foreground hover:text-primary" />
                          }
                        </Button>
                      </Show>
                      <Show when="signed-out">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="h-8 w-8 flex items-center justify-center -mt-1 -mr-2">
                              <Bookmark className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Masuk untuk menyimpan doa</TooltipContent>
                        </Tooltip>
                      </Show>
                    </div>
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
            );
          })}
        </div>
      )}
    </div>
  );
}

