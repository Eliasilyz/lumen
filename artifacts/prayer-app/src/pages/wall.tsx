import { useState } from "react";
import { useListWallPosts, useCreateWallPost, usePrayForWallPost } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function Wall() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const { data: wallData, isLoading, refetch } = useListWallPosts({
    category: category as any,
    limit: 50,
  });

  const prayForPost = usePrayForWallPost();
  const createPost = useCreateWallPost();

  const [newMessage, setNewMessage] = useState("");
  const [newCategory, setNewCategory] = useState<string>("other");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);

  const categories = [
    { value: "healing", label: "Penyembuhan" },
    { value: "family", label: "Keluarga" },
    { value: "disaster", label: "Bencana" },
    { value: "work", label: "Pekerjaan" },
    { value: "vocation", label: "Panggilan" },
    { value: "gratitude", label: "Syukur" },
    { value: "other", label: "Lainnya" },
  ];

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.length < 8) {
      toast({
        title: "Pesan terlalu pendek",
        description: "Mohon tuliskan setidaknya 8 karakter.",
        variant: "destructive"
      });
      return;
    }

    createPost.mutate({
      data: {
        message: newMessage,
        category: newCategory as any,
        anonymous: isAnonymous,
        displayName: isAnonymous ? null : newDisplayName || null
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Intensi Berhasil Dikirim",
          description: "Intensi Anda sedang dalam proses moderasi sebelum ditampilkan.",
        });
        setIsFormOpen(false);
        setNewMessage("");
        setNewDisplayName("");
      },
      onError: () => {
        toast({
          title: "Terjadi Kesalahan",
          description: "Gagal mengirim intensi doa. Silakan coba lagi.",
          variant: "destructive"
        });
      }
    });
  };

  const handlePray = (id: number) => {
    prayForPost.mutate({ id }, {
      onSuccess: () => {
        toast({
          title: "Doa Terkirim",
          description: "Terima kasih telah mendoakan intensi ini.",
        });
        refetch();
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-foreground">Dinding Harapan</h1>
          <p className="text-muted-foreground mt-2">Bagikan ujud doa Anda dan doakan sesama.</p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? "Tutup Form" : "Bagikan Intensi"}
        </Button>
      </div>

      {isFormOpen && (
        <Card className="mb-12 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="font-serif">Tulis Intensi Doa</CardTitle>
            <CardDescription>Intensi Anda akan dimoderasi sebelum ditampilkan di Dinding Harapan.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Ujud Doa (min 8 karakter)</Label>
                <Textarea 
                  id="message" 
                  placeholder="Ya Tuhan, saya mohon doa untuk..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between mt-2">
                    <Label htmlFor="anonymous" className="cursor-pointer">Kirim sebagai Anonim</Label>
                    <Switch 
                      id="anonymous" 
                      checked={isAnonymous} 
                      onCheckedChange={setIsAnonymous} 
                    />
                  </div>
                  
                  {!isAnonymous && (
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Nama Tampilan (opsional)</Label>
                      <Input 
                        id="displayName" 
                        placeholder="Nama Anda" 
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <Button type="submit" disabled={createPost.isPending} className="w-full md:w-auto">
                {createPost.isPending ? "Mengirim..." : "Kirim Intensi"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 mb-8">
        <Button 
          variant={!category ? "default" : "outline"} 
          size="sm" 
          onClick={() => setCategory(undefined)}
          className="rounded-full"
        >
          Semua Intensi
        </Button>
        {categories.map(cat => (
          <Button 
            key={cat.value}
            variant={category === cat.value ? "default" : "outline"} 
            size="sm" 
            onClick={() => setCategory(cat.value)}
            className="rounded-full"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : wallData?.items.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">Belum ada intensi doa di kategori ini.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallData?.items.map(post => (
            <Card key={post.id} className="flex flex-col h-full bg-card hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="text-xs font-medium text-primary uppercase tracking-wider">
                    {categories.find(c => c.value === post.category)?.label || post.category}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: idLocale })}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-foreground leading-relaxed">"{post.message}"</p>
                <p className="text-sm text-muted-foreground mt-4 font-medium">— {post.displayName}</p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="secondary" 
                  className="w-full gap-2"
                  onClick={() => handlePray(post.id)}
                  disabled={prayForPost.isPending}
                >
                  Bantu Doa 
                  <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                    {post.prayCount}
                  </span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
