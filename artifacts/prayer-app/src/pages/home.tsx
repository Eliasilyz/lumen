import { Link } from "wouter";
import { SignInButton, Show } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetTodayDashboard, usePrayForWallPost } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function HomeRedirect() {
  return (
    <>
      <Show when="signed-out">
        <PublicLanding />
      </Show>
      <Show when="signed-in">
        <TodayHub />
      </Show>
    </>
  );
}

export function PublicLanding() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  
  return (
    <div className="flex flex-col items-center">
      <section className="w-full py-24 md:py-32 lg:py-40 bg-card text-center px-4">
        <div className="container mx-auto max-w-4xl flex flex-col items-center gap-8">
          <img src={`${basePath}/logo.svg`} alt="Lumen Logo" className="h-20 w-20 text-primary mb-4" />
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-foreground font-medium leading-tight">
            Ruang Hening untuk<br/>Doa Harian Anda
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-sans leading-relaxed">
            Lumen adalah teman doa Katolik modern Anda. Tidak terburu-buru, devosional, dan sungguh sakral. Bergabunglah bersama kami menemukan kedamaian melalui liturgi, renungan harian, dan doa bersama.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <SignInButton mode="modal">
              <Button size="lg" className="text-base px-8">Mulai Berdoa</Button>
            </SignInButton>
            <Link href="/prayers">
              <Button variant="outline" size="lg" className="text-base px-8">Jelajahi Pustaka</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full py-20 px-4 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-serif">1</div>
              <h3 className="text-xl font-serif font-medium">Liturgi Harian</h3>
              <p className="text-muted-foreground">Ikuti kalender liturgi Gereja dengan bacaan dan warna yang sesuai setiap harinya.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-serif">2</div>
              <h3 className="text-xl font-serif font-medium">Pustaka Doa</h3>
              <p className="text-muted-foreground">Temukan ratusan doa tradisional dan kontemporer untuk setiap kebutuhan hidup Anda.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-serif">3</div>
              <h3 className="text-xl font-serif font-medium">Dinding Harapan</h3>
              <p className="text-muted-foreground">Bagikan intensi doa Anda dan doakan ujud-intensi dari saudara-saudari seiman lainnya.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function TodayHub() {
  const { data: dashboard, isLoading, error } = useGetTodayDashboard();
  const prayForPost = usePrayForWallPost();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-8 w-48 mt-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-serif mb-4">Gagal memuat data hari ini</h2>
        <p className="text-muted-foreground mb-6">Silakan coba beberapa saat lagi.</p>
        <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
      </div>
    );
  }

  const { today, recommendedPrayer, featuredPrayers, recentWallPosts, transparency } = dashboard;
  
  const seasonColors: Record<string, string> = {
    violet: "bg-purple-600",
    white: "bg-white border-gray-200 border",
    red: "bg-red-600",
    green: "bg-green-600",
    rose: "bg-pink-400",
    black: "bg-black"
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-12">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-serif text-foreground">
          {format(new Date(today.date), "EEEE, d MMMM yyyy", { locale: idLocale })}
        </h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className={`w-3 h-3 rounded-full ${seasonColors[today.color] || "bg-primary"}`} />
          <span>{today.title} {today.isFeast ? "(Pesta)" : ""}</span>
          {today.saint && <span className="before:content-['•'] before:mx-2">{today.saint}</span>}
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {today.reflection && (
            <Card className="bg-card border-card-border shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Renungan Hari Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed text-muted-foreground font-serif italic">
                  "{today.reflection}"
                </p>
              </CardContent>
            </Card>
          )}
          
          <div className="space-y-4">
            <h2 className="text-2xl font-serif">Doa yang Disarankan</h2>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="font-serif">{recommendedPrayer.title}</CardTitle>
                <CardDescription>{recommendedPrayer.categoryName}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-2">{recommendedPrayer.summary}</p>
              </CardContent>
              <CardFooter>
                <Link href={`/prayer/${recommendedPrayer.slug}`}>
                  <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10 -ml-4">
                    Berdoa Sekarang
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-xl">Dinding Harapan</CardTitle>
              <CardDescription>Intensi terbaru dari komunitas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentWallPosts.map(post => (
                <div key={post.id} className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0">
                  <p className="text-sm line-clamp-3">"{post.message}"</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{post.displayName}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => prayForPost.mutate({ id: post.id })}
                      disabled={prayForPost.isPending}
                    >
                      Bantu Doa ({post.prayCount})
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Link href="/wall" className="w-full">
                <Button variant="ghost" className="w-full text-muted-foreground">Lihat Semua</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-xl">Dukungan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Terkumpul</span>
                  <span className="font-medium">Rp {(transparency.raisedAmount / 100).toLocaleString('id-ID')}</span>
                </div>
                <Progress value={Math.min(100, (transparency.raisedAmount / transparency.goalAmount) * 100)} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  dari target Rp {(transparency.goalAmount / 100).toLocaleString('id-ID')}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/donate" className="w-full">
                <Button variant="outline" className="w-full">Dukung Lumen</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif">Doa Pilihan</h2>
          <Link href="/prayers">
            <Button variant="ghost" className="text-muted-foreground">Lihat Pustaka</Button>
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredPrayers.map(prayer => (
            <Card key={prayer.id} className="flex flex-col h-full hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3 flex-1">
                <CardTitle className="font-serif text-lg line-clamp-2">{prayer.title}</CardTitle>
                <CardDescription className="line-clamp-1">{prayer.categoryName}</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{prayer.summary}</p>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href={`/prayer/${prayer.slug}`} className="w-full">
                  <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary hover:bg-primary/10">
                    Buka Doa
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
