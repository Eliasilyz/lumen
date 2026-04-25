import { useParams } from "wouter";
import { useGetPrayer, useGetMe, useAddBookmark, useRemoveBookmark, useUpdatePreferences } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, ArrowLeft, Clock, Type } from "lucide-react";
import { Link } from "wouter";
import { Show } from "@clerk/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";

export function PrayerDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: prayer, isLoading, error } = useGetPrayer(slug);
  const { data: me } = useGetMe();
  
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();
  const updatePrefs = useUpdatePreferences();

  const [localFontScale, setLocalFontScale] = useState<string>("md");

  useEffect(() => {
    if (me?.preferences?.fontScale) {
      setLocalFontScale(me.preferences.fontScale);
    }
  }, [me?.preferences?.fontScale]);

  const handleFontScale = (scale: 'sm' | 'md' | 'lg' | 'xl') => {
    setLocalFontScale(scale);
    if (me) {
      updatePrefs.mutate({ data: { fontScale: scale } });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
        <Skeleton className="h-8 w-24" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="space-y-4 mt-12">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full mt-4" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    );
  }

  if (error || !prayer) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-xl">
        <h2 className="text-3xl font-serif mb-4">Doa Tidak Ditemukan</h2>
        <p className="text-muted-foreground mb-8">Maaf, doa yang Anda cari tidak tersedia atau telah dipindahkan.</p>
        <Link href="/prayers">
          <Button>Kembali ke Pustaka Doa</Button>
        </Link>
      </div>
    );
  }

  const isBookmarked = me?.bookmarkedPrayerIds?.includes(prayer.id) || prayer.bookmarked;

  const handleBookmarkToggle = () => {
    if (isBookmarked) {
      removeBookmark.mutate({ prayerId: prayer.id });
    } else {
      addBookmark.mutate({ data: { prayerId: prayer.id } });
    }
  };

  const fontScaleClasses = {
    sm: "prose-sm",
    md: "prose-base",
    lg: "prose-lg",
    xl: "prose-xl"
  };

  return (
    <article className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      <div className="mb-8">
        <Link href="/prayers">
          <Button variant="ghost" size="sm" className="text-muted-foreground -ml-3">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
      </div>

      <header className="mb-12 text-center space-y-6">
        {prayer.categoryName && (
          <div className="text-primary text-sm font-medium tracking-widest uppercase">
            {prayer.categoryName}
          </div>
        )}
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-foreground font-medium leading-tight">
          {prayer.title}
        </h1>
        
        <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground text-sm">
          {prayer.author && <span>Oleh {prayer.author}</span>}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{prayer.readingMinutes || 1} menit</span>
          </div>
          
          <div className="flex items-center gap-2 border-l pl-6 border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Type className="h-4 w-4" />
                  <span className="sr-only">Ukuran Teks</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => handleFontScale('sm')}>Kecil</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFontScale('md')}>Normal</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFontScale('lg')}>Besar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFontScale('xl')}>Sangat Besar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Show when="signed-in">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={handleBookmarkToggle}
              >
                {isBookmarked ? 
                  <BookmarkCheck className="h-5 w-5 text-primary" /> : 
                  <Bookmark className="h-5 w-5 hover:text-primary" />
                }
              </Button>
            </Show>
            <Show when="signed-out">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-8 w-8 flex items-center justify-center">
                    <Bookmark className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Masuk untuk menyimpan doa</TooltipContent>
              </Tooltip>
            </Show>
          </div>
        </div>
      </header>

      <div className={`prose prose-stone dark:prose-invert max-w-none ${fontScaleClasses[localFontScale as keyof typeof fontScaleClasses] || "prose-base"} font-serif leading-relaxed mb-16`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {prayer.body}
        </ReactMarkdown>
      </div>

      {prayer.related && prayer.related.length > 0 && (
        <section className="pt-12 border-t border-border mt-16">
          <h3 className="text-2xl font-serif mb-6 text-center">Doa Terkait</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {prayer.related.map(related => (
              <Link key={related.id} href={`/prayer/${related.slug}`}>
                <div className="p-4 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer bg-card">
                  <h4 className="font-serif text-lg mb-1">{related.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{related.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
